import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./MessagesSidebar.css";
import { searchUsers, getFollowingUsers } from "../../services/userService";
import {
  getConversations,
  getConversationMessages,
  createConversation,
  sendMessage,
  getCurrentUser,
  deleteConversation,
  markMessagesAsRead,
  deleteMessage,
} from "../../services/chatService";
import profilePicDefault from "../../imgs/profile-user (1).png";
import { Button } from "primereact/button";

// Debounce funkcija
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const MessagesSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [wsConnection, setWsConnection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    messageId: null,
    x: 0,
    y: 0,
  });
  const [showUnsendDialog, setShowUnsendDialog] = useState(false);
  const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Funkcija za ažuriranje liste razgovora s debouncing
  const updateConversationsList = useCallback(async () => {
    try {
      const conversationsData = await getConversations();
      if (conversationsData.success) {
        setConversations(conversationsData.conversations);
      }
    } catch (error) {
      console.error("Error updating conversations:", error);
    }
  }, []);

  // Debounced verzija za sprečavanje previše API poziva
  const debouncedUpdateConversations = useCallback(
    debounce(updateConversationsList, 1000),
    [updateConversationsList]
  );

  // Dohvati korisnike koje pratim, razgovore i trenutnog korisnika
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Dohvati trenutnog korisnika
        const currentUserData = await getCurrentUser();
        if (currentUserData.success) {
          setCurrentUser(currentUserData.data);
        }

        // Dohvati korisnike koje pratim
        const followingData = await getFollowingUsers();
        if (followingData.success) {
          setFollowingUsers(followingData.users);
        }

        // Dohvati razgovore
        const conversationsData = await getConversations();
        if (conversationsData.success) {
          // Inicijaliziraj isTyping i typingUser za svaki razgovor
          const conversationsWithTyping = conversationsData.conversations.map(
            (conv) => ({
              ...conv,
              isTyping: false,
              typingUser: null,
            })
          );
          setConversations(conversationsWithTyping);
          console.log(
            "Conversations loaded:",
            conversationsWithTyping.map((c) => ({
              id: c.id,
              username: c.other_participant?.username,
              profile_image: c.other_participant?.profile_image,
            }))
          );
        }
      } catch (error) {
        console.error("Greška prilikom dohvaćanja podataka:", error);
      }
    };

    fetchData();
  }, [currentUser?.id]);

  // Automatsko otvaranje chata iz profila
  useEffect(() => {
    const targetId =
      location.state?.openWithUserId || location.state?.startChatWithUserId; // podrži i staro ime
    if (!targetId || !currentUser?.id) return;

    // spriječi ponovno trigganje kod back/forward
    navigate(location.pathname, { replace: true });

    const openChat = async () => {
      // Pobrinemo se da imamo svježu listu
      if (!conversations.length) {
        await updateConversationsList();
      }

      const ensureConversations = conversations.length
        ? conversations
        : (await getConversations())?.conversations || [];

      // 1) Probaj naći postojeći razgovor
      const existing = ensureConversations.find(
        (c) => Number(c.other_participant?.id) === Number(targetId)
      );
      if (existing) {
        await handleSelectConversation(existing);
        return;
      }

      // 2) Ako ne postoji – kreiraj pa odaberi
      const created = await createConversation(targetId);
      if (created?.success) {
        const fresh = await getConversations();
        const newConv = fresh?.conversations?.find(
          (c) => c.id === created.conversation_id
        );
        if (newConv) {
          await handleSelectConversation(newConv);
        }
      }
    };

    openChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, currentUser?.id, conversations.length]);

  // Poveži se na ChatNotificationConsumer kada je currentUser dostupan
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log(
      "ChatNotificationConsumer setup - token:",
      !!token,
      "currentUser:",
      currentUser?.id
    );
    if (token && currentUser?.id) {
      const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
      const djangoHost =
        process.env.NODE_ENV === "production"
          ? window.location.host
          : "localhost:8000";
      const base = `${wsScheme}://${djangoHost}`;

      console.log("Connecting to ChatNotificationConsumer");
      const notificationWs = new WebSocket(
        `${base}/ws/chat-notifications/?token=${token}`
      );

      notificationWs.onopen = () => {
        console.log("ChatNotificationConsumer connected successfully");
      };

      notificationWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Notification received:", data);

        switch (data.type) {
          case "conversation_created":
            console.log("New conversation created:", data);
            
            // Normaliziraj URL slike - koristi punu URL putanju
            const normalizeImageUrl = (url) => {
              if (!url) return url;
              if (url.startsWith('/media/')) {
                return `http://localhost:8000${url}`;
              }
              return url;
            };

            setConversations((prev) => [
              {
                ...data.conversation,
                isTyping: false,
                typingUser: null,
                other_participant: {
                  ...data.conversation.other_participant,
                  profile_image: normalizeImageUrl(
                    data.conversation.other_participant?.profile_image
                  ),
                },
              },
              ...prev,
            ]);
            break;

          case "conversation_updated":
            console.log("Conversation updated:", data);
            console.log("Conversation data:", data.conversation);
            console.log(
              "Profile image in update:",
              data.conversation?.other_participant?.profile_image
            );
            setConversations((prev) => {
              console.log("Previous conversations:", prev.map(c => ({
                id: c.id,
                profile_image: c.other_participant?.profile_image,
                username: c.other_participant?.username
              })));
              
              const filtered = prev.filter(
                (conv) => conv.id !== data.conversation.id
              );

              // Pronađi postojeći razgovor da sačuvaš REST API URL-ove
              const existingConversation = prev.find(
                (conv) => conv.id === data.conversation.id
              );

              // Normaliziraj URL slike - koristi punu URL putanju
              const normalizeImageUrl = (url) => {
                if (!url) return url;
                if (url.startsWith('/media/')) {
                  return `http://localhost:8000${url}`;
                }
                return url;
              };

              const updatedConversation = {
                ...data.conversation,
                isTyping: false,
                typingUser: null,
                // Koristi novu sliku ako je dostupna, inače postojeću
                other_participant: {
                  ...data.conversation.other_participant,
                  profile_image: normalizeImageUrl(
                    data.conversation.other_participant?.profile_image ||
                    existingConversation?.other_participant?.profile_image
                  ),
                },
              };
              
              const result = [updatedConversation, ...filtered];
              console.log("Result conversations:", result.map(c => ({
                id: c.id,
                profile_image: c.other_participant?.profile_image,
                username: c.other_participant?.username
              })));
              
              console.log("Updated conversation:", updatedConversation);
              console.log(
                "Using profile image:",
                data.conversation.other_participant?.profile_image || "fallback to existing"
              );
              return result;
            });
            break;

          case "conversation_deleted":
            console.log("Conversation deleted:", data);
            setConversations((prev) =>
              prev.filter((conv) => conv.id !== data.conversation_id)
            );
            break;

          case "user_typing":
            console.log(
              "User typing in conversation:",
              data.conversation_id,
              "username:",
              data.username
            );
            {
              const convId = Number(data.conversation_id);
              setConversations((prev) => {
                const updated = prev.map((conv) =>
                  Number(conv.id) === convId
                    ? { ...conv, isTyping: true, typingUser: data.username }
                    : conv
                );
                console.log(
                  "Typing updated conversations:",
                  updated.map((c) => ({
                    id: c.id,
                    isTyping: c.isTyping,
                    typingUser: c.typingUser,
                    other_participant: c.other_participant?.username,
                  }))
                );
                return updated;
              });
              // Auto-clear ako stop_typing ne stigne:
              setTimeout(() => {
                setConversations((prev) =>
                  prev.map((conv) =>
                    Number(conv.id) === convId
                      ? { ...conv, isTyping: false, typingUser: null }
                      : conv
                  )
                );
              }, 3000);
            }
            break;

          case "user_stop_typing":
            console.log(
              "User stopped typing in conversation:",
              data.conversation_id
            );
            {
              const convId = Number(data.conversation_id);
              setConversations((prev) =>
                prev.map((conv) =>
                  Number(conv.id) === convId
                    ? { ...conv, isTyping: false, typingUser: null }
                    : conv
                )
              );
            }
            break;
        }
      };

      notificationWs.onerror = (error) => {
        console.error("ChatNotificationConsumer error:", error);
      };

      notificationWs.onclose = () => {
        console.log("ChatNotificationConsumer disconnected");
      };

      // Cleanup na unmount
      return () => {
        if (notificationWs) {
          notificationWs.close();
        }
      };
    }
  }, [currentUser?.id]);

  // Uklonjen setInterval - sada se koristi samo WebSocket za real-time ažuriranja

  // Resetiraj selectedConversation ako se ne nalazi u conversations listi
  useEffect(() => {
    console.log(
      "useEffect triggered - selectedConversation:",
      selectedConversation?.id,
      "conversations count:",
      conversations.length
    );
    console.log(
      "Conversations list:",
      conversations.map((conv) => ({
        id: conv.id,
        username: conv.other_participant?.username,
        profile_image: conv.other_participant?.profile_image,
        profile_image_type: typeof conv.other_participant?.profile_image,
        profile_image_starts_with_http:
          conv.other_participant?.profile_image?.startsWith("http"),
        profile_image_starts_with_ws:
          conv.other_participant?.profile_image?.startsWith("ws://"),
        profile_image_starts_with_slash:
          conv.other_participant?.profile_image?.startsWith("/"),
      }))
    );

    if (selectedConversation) {
      // Ako je lista prazna ili razgovor ne postoji u listi, resetiraj
      if (
        conversations.length === 0 ||
        !conversations.find((conv) => conv.id === selectedConversation.id)
      ) {
        console.log(
          "Selected conversation not found in list or list is empty, resetting..."
        );
        setSelectedConversation(null);
        setMessages([]);

        // Zatvori WebSocket konekciju
        if (wsConnection) {
          wsConnection.close();
          setWsConnection(null);
        }

        // Očisti reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        setReconnectAttempts(0);

        // Zatvori details sidebar
        setShowDetailsSidebar(false);

        // Vrati rutu na messages
        navigate("/home/messages");

        // Force re-render
        setForceUpdate((prev) => prev + 1);
      }
    } else {
      console.log("No selectedConversation to check");
    }
  }, [conversations, selectedConversation, wsConnection]);

  // Force re-render kada se selectedConversation promijeni
  useEffect(() => {
    console.log("selectedConversation changed:", selectedConversation);

    // Preload profile slike za sve razgovore
    if (conversations.length > 0) {
      conversations.forEach((conversation) => {
        if (conversation.other_participant?.profile_image) {
          const img = new Image();
          img.src = conversation.other_participant.profile_image;
        }
      });
    }

    // Preload header sliku ako postoji selectedConversation
    if (selectedConversation?.other_participant?.profile_image) {
      console.log("Preloading header image:", selectedConversation.other_participant.profile_image);
      const headerImg = new Image();
      headerImg.onload = () => {
        console.log("Header image preloaded successfully:", selectedConversation.other_participant.profile_image);
      };
      headerImg.onerror = () => {
        console.error("Header image preload failed:", selectedConversation.other_participant.profile_image);
      };
      headerImg.src = selectedConversation.other_participant.profile_image;
    }
  }, [selectedConversation, conversations]);

  // Preload avatara nakon fetchanja razgovora
  useEffect(() => {
    if (conversations.length > 0) {
      console.log("Preloading images for conversations:", conversations.map(c => ({
        id: c.id,
        profile_image: c?.other_participant?.profile_image,
        username: c?.other_participant?.username
      })));
      
      conversations.forEach((c) => {
        const url = c?.other_participant?.profile_image;
        if (url) {
          const img = new Image();
          img.onload = () => {
            console.log("Preloaded image:", url);
          };
          img.onerror = () => {
            console.error("Failed to preload image:", url);
          };
          img.src = url;
        }
      });
    }
  }, [conversations]);

  // Resetiraj unread_count za trenutno odabrani razgovor kada se komponenta učita
  useEffect(() => {
    if (selectedConversation) {
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                unread_count: 0,
              }
            : conv
        )
      );
    }
  }, [selectedConversation?.id]);

  // Zatvori context menu kada se klikne vani
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.show]);

  // Cleanup WebSocket konekcije kada se komponenta unmounta
  useEffect(() => {
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [wsConnection]);

  // Automatski označi poruke kao pročitane kada se poruke učitaju
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      // Odmah resetiraj unread_count za trenutno odabrani razgovor
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                unread_count: 0,
              }
            : conv
        )
      );

      // Označi poruke kao pročitane nakon kratkog kašnjenja
      const timer = setTimeout(() => {
        markMessagesAsRead(selectedConversation.id);

        debouncedUpdateConversations();

        // Pošalji WebSocket poruku da su poruke označene kao pročitane
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              type: "read_messages",
            })
          );
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [selectedConversation, messages.length]); // Dodan messages.length dependency

  // Search funkcionalnost
  useEffect(() => {
    if (!searchTerm) {
      setUsers([]);
      setShowSearchResults(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setShowSearchResults(true);

    const timeoutId = setTimeout(async () => {
      try {
        const data = await searchUsers(searchTerm);
        if (!cancelled) {
          setUsers(data.success ? data.users : []);
        }
      } catch (error) {
        console.error("Greška prilikom pretrage:", error);
        if (!cancelled) {
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  // Skrolaj na dno kad se poruke promijene
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Skrolaj na typing dots kada se prikazuju
  useEffect(() => {
    if (typingUsers.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingUsers]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    // Ne zatvaraj input na blur - ostaje otvoren dok se ne klikne back ikona
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setShowSearchResults(false);
    // Input ostaje fokusiran
    inputRef.current?.focus();
  };

  const handleBackClick = () => {
    setIsInputFocused(false);
    setSearchTerm("");
    setShowSearchResults(false);
  };

  // Funkcija za odabir razgovora
  const handleSelectConversation = async (conversation) => {
    // Ako je već odabran isti razgovor, ne radi ništa
    if (selectedConversation?.id === conversation.id) {
      return;
    }

    // Preload profile sliku za odabrani razgovor
    if (conversation.other_participant?.profile_image) {
      const img = new Image();
      img.src = conversation.other_participant.profile_image;
    }

    // Očisti reconnect timeout ako postoji
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setReconnectAttempts(0);

    setSelectedConversation(conversation);

    // Odmah resetiraj unread_count za odabrani razgovor
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === conversation.id
          ? {
              ...conv,
              unread_count: 0,
            }
          : conv
      )
    );

    try {
      const messagesData = await getConversationMessages(conversation.id);
      if (messagesData.success) {
        console.log("Messages from API:", messagesData.messages);
        setMessages(messagesData.messages);

        // Preload profile slike za sve poruke
        messagesData.messages.forEach((message) => {
          if (message.sender?.profile_image) {
            const img = new Image();
            img.src = message.sender.profile_image;
          }
        });
      } else {
        console.error("Greška prilikom dohvaćanja poruka:", messagesData.error);
        // Ako ne možemo dohvatiti poruke, resetiraj odabrani razgovor
        setSelectedConversation(null);
        setMessages([]);
        return;
      }

      // Označi poruke kao pročitane
      try {
        await markMessagesAsRead(conversation.id);
      } catch (error) {
        console.error(
          "Greška prilikom označavanja poruka kao pročitane:",
          error
        );
        // Nastavi iako označavanje nije uspjelo
      }

      // Ažuriraj listu razgovora da se ukloni broj nepročitanih poruka
      debouncedUpdateConversations();

      // Poveži se na WebSocket za ovaj razgovor
      connectWebSocket(conversation.id);
    } catch (error) {
      console.error("Greška prilikom dohvaćanja poruka:", error);
      // Ako ne možemo dohvatiti poruke, resetiraj odabrani razgovor
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  // Funkcija za kreiranje novog razgovora
  const handleStartConversation = async (user) => {
    try {
      const conversationData = await createConversation(user.id);
      if (conversationData.success) {
        // Dohvati ažurirane razgovore
        await updateConversationsList();
        const conversationsData = await getConversations();
        if (conversationsData.success) {
          setConversations(conversationsData.conversations);

          // Pronađi i odaberi novi razgovor
          const newConversation = conversationsData.conversations.find(
            (conv) => conv.id === conversationData.conversation_id
          );
          if (newConversation) {
            handleSelectConversation(newConversation);
          }
        }
      }
    } catch (error) {
      console.error("Greška prilikom kreiranja razgovora:", error);
    }
  };

  // Funkcija za slanje poruke
  const handleSendMessage = async (messageContent = null) => {
    const contentToSend = messageContent || newMessage.trim();
    if (!contentToSend || !selectedConversation || !currentUser) return;

    // Pošalji poruku preko WebSocket-a
    await sendMessageViaWebSocket(contentToSend);

    // Očisti input samo ako nije poslana predefinirana poruka (kao srce)
    if (!messageContent) {
      setNewMessage("");
    }

    // Zatvori reply mod ako je aktivan
    setReplyToMessage(null);

    // Zaustavi typing indikator
    sendTypingIndicator(false);
    setIsTyping(false);
  };

  // Funkcija za handling input promjena (typing indikator)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Pošalji typing indikator
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  // Funkcija za formatiranje vremena
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Funkcija za formatiranje relativnog vremena (23h, 2d, ..)
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - messageTime) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}mo`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}y`;
    }
  };

  // Funkcija za otvaranje/zatvaranje details sidebar-a
  const toggleDetailsSidebar = () => {
    setShowDetailsSidebar((prev) => !prev);
  };

  // Funkcija za otvaranje context menu-a
  const handleContextMenu = (e, messageId) => {
    e.preventDefault();
    e.stopPropagation();

    // Pronađi poruku da odredimo poziciju
    const message = messages.find((m) => m.id === messageId);
    const isOwnMessage = message?.sender.id === currentUser?.id;

    // Pozicioniramo menu iznad ili ispod ikone s tri točkice
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220; // širina menu-a

    // ima li dovoljno mjesta ispod, ako ne, prikaži iznad
    const menuHeight = 200; // približna visina menu-a
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const showBelow = spaceBelow >= menuHeight;

    const menuY = showBelow ? rect.bottom + 5 : rect.top - menuHeight + 20;

    // Za tuđe poruke: menu se širi prema desno
    // Za moje poruke: menu se širi prema lijevo
    const menuX = isOwnMessage ? rect.right - menuWidth : rect.left;

    setContextMenu({
      show: true,
      messageId,
      x: menuX,
      y: menuY,
    });
  };

  // Funkcija za zatvaranje context menu-a
  const closeContextMenu = () => {
    setContextMenu({ show: false, messageId: null, x: 0, y: 0 });
  };

  // Funkcija za forward poruke
  const handleForward = () => {
    console.log("Forward message:", contextMenu.messageId);
    closeContextMenu();
  };

  // Funkcija za reply poruke
  const handleReply = (messageId = null) => {
    const targetMessageId = messageId || contextMenu.messageId;
    console.log("handleReply called, targetMessageId:", targetMessageId);
    const message = messages.find((m) => m.id === targetMessageId);
    console.log("found message:", message);
    if (message) {
      setReplyToMessage(message);
      console.log("Reply mode activated for message:", message);
    }
    closeContextMenu();
  };

  // Funkcija za zatvaranje reply moda
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // Funkcija za copy poruke
  const handleCopy = () => {
    const message = messages.find((m) => m.id === contextMenu.messageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
      setShowCopiedNotification(true);

      // Automatski sakrij notifikaciju nakon 2 sekunde
      setTimeout(() => {
        setShowCopiedNotification(false);
      }, 2000);
    }
    closeContextMenu();
  };

  // Funkcija za prikaz unsend dialog-a
  const handleUnsend = () => {
    setMessageToDelete(contextMenu.messageId);
    setShowUnsendDialog(true);
    closeContextMenu();
  };

  // Funkcija za stvarno brisanje poruke
  const confirmUnsend = async () => {
    if (!messageToDelete || !selectedConversation) {
      setShowUnsendDialog(false);
      setMessageToDelete(null);
      return;
    }

    try {
      const result = await deleteMessage(
        selectedConversation.id,
        messageToDelete
      );
      if (result.success) {
        // Ukloni poruku iz lokalne liste
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== messageToDelete)
        );

        // Pošalji WebSocket poruku o brisanju
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              type: "message_deleted",
              message_id: messageToDelete,
            })
          );
        }

        console.log("Message deleted successfully");
      } else {
        console.error("Failed to delete message:", result.error);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }

    setShowUnsendDialog(false);
    setMessageToDelete(null);
  };

  // Funkcija za formatiranje datuma za context menu
  const formatContextMenuTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);

    // Provjeri je li danas
    const isToday = messageDate.toDateString() === now.toDateString();

    if (isToday) {
      // Samo vrijeme ako je danas
      return messageDate.toLocaleTimeString("hr-HR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else {
      // Provjeri je li prošli tjedan (7 dana unazad)
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);

      if (messageDate >= oneWeekAgo) {
        // Dan i vrijeme ako je prošli tjedan
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = dayNames[messageDate.getDay()];
        const time = messageDate.toLocaleTimeString("hr-HR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return `${dayName}, ${time}`;
      } else {
        // Pun datum i vrijeme ako je starije od prošlog tjedna
        const day = messageDate.getDate().toString().padStart(2, "0");
        const month = messageDate.toLocaleDateString("en-US", {
          month: "short",
        });
        const year = messageDate.getFullYear();
        const time = messageDate.toLocaleTimeString("hr-HR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return `${day} ${month} ${year}, ${time}`;
      }
    }
  };

  // WebSocket funkcije
  const connectWebSocket = useCallback(
    (conversationId) => {
      console.log(
        "connectWebSocket called with conversationId:",
        conversationId
      );
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.log("No auth token found");
        return;
      }

      // Zatvori postojeću konekciju ako postoji
      if (wsConnection) {
        console.log("Closing existing WebSocket connection");
        wsConnection.close();
      }

      // Dinamički odredi WebSocket URL - koristi Django server port
      const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
      const djangoHost =
        process.env.NODE_ENV === "production"
          ? window.location.host
          : "localhost:8000";
      const base = `${wsScheme}://${djangoHost}`;

      console.log(
        `Connecting to WebSocket: ${base}/ws/chat/${conversationId}/`
      );
      
      const ws = new WebSocket(`${base}/ws/chat/${conversationId}/`, [
        "jwt",
        token,
      ]);

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setWsConnection(ws);
        setReconnectAttempts(0); // Reset reconnect attempts on successful connection
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        switch (data.type) {
          case "connection_established":
            console.log("Connection established");
            break;

          case "chat_message":
            console.log("New chat message received:", data);
            // Dodaj novu poruku u listu
            const newMessage = {
              id: data.message_id,
              content: data.message,
              sender: {
                id: data.sender_id,
                username: data.sender_username,
              },
              created_at: data.timestamp || new Date().toISOString(),
              is_read: false,
              reply_to: data.reply_to || null,
            };

            setMessages((prev) => [...prev, newMessage]);

            // Preload profile sliku za novu poruku ako je dostupna
            if (data.sender_profile_image) {
              const img = new Image();
              img.src = data.sender_profile_image;
            }

            // Ažuriraj last_message u trenutnom razgovoru odmah
            if (selectedConversation) {
              setConversations((prevConversations) =>
                prevConversations.map((conv) =>
                  conv.id === selectedConversation.id
                    ? {
                        ...conv,
                        last_message: {
                          content: data.message,
                          sender_username: data.sender_username,
                          created_at:
                            data.timestamp || new Date().toISOString(),
                        },
                        unread_count:
                          conv.unread_count +
                          (data.sender_id !== currentUser?.id ? 1 : 0),
                      }
                    : conv
                )
              );
            }

            // Ažuriraj listu razgovora
            debouncedUpdateConversations();
            break;

          case "user_typing":
            if (data.user_id !== currentUser?.id) {
              setTypingUsers((prev) => {
                if (!prev.find((user) => user.id === data.user_id)) {
                  return [
                    ...prev,
                    { id: data.user_id, username: data.username },
                  ];
                }
                return prev;
              });

              // Ažuriraj conversations state za typing indicator u listi
              setConversations((prev) => {
                const updated = prev.map((conv) =>
                  conv.id === selectedConversation?.id
                    ? { ...conv, isTyping: true, typingUser: data.username }
                    : conv
                );
                console.log(
                  "ChatConsumer - Updated conversations for typing:",
                  updated.map((c) => ({
                    id: c.id,
                    isTyping: c.isTyping,
                    typingUser: c.typingUser,
                    other_participant: c.other_participant?.username,
                  }))
                );
                return updated;
              });
            }
            break;

          case "user_stop_typing":
            setTypingUsers((prev) =>
              prev.filter((user) => user.id !== data.user_id)
            );

            // Ažuriraj conversations state za typing indicator u listi
            setConversations((prev) => {
              const updated = prev.map((conv) =>
                conv.id === selectedConversation?.id
                  ? { ...conv, isTyping: false, typingUser: null }
                  : conv
              );
              return updated;
            });
            break;

          case "messages_read":
            console.log("Messages marked as read:", data);
            // Ažuriraj "seen" status za poruke koje NISU poslao korisnik koji je pročitao poruke
            setMessages((prev) =>
              prev.map((msg) =>
                msg.sender.id !== data.user_id ? { ...msg, is_read: true } : msg
              )
            );

            // Ažuriraj unread_count u trenutnom razgovoru
            if (selectedConversation) {
              setConversations((prevConversations) =>
                prevConversations.map((conv) =>
                  conv.id === selectedConversation.id
                    ? {
                        ...conv,
                        unread_count: 0,
                      }
                    : conv
                )
              );
            }

            // Ažuriraj listu razgovora da se ukloni broj nepročitanih poruka
            debouncedUpdateConversations();
            break;

          case "message_deleted":
            console.log("Message deleted:", data);
            // Ukloni poruku iz lokalne liste
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== data.message_id)
            );
            break;

          case "conversation_deleted":
            console.log("Conversation deleted:", data);
            console.log("Current selectedConversation:", selectedConversation);
            console.log(
              "Comparing:",
              selectedConversation?.id,
              "===",
              data.conversation_id
            );
            console.log(
              "All conversations before deletion:",
              conversations.map((conv) => ({
                id: conv.id,
                username: conv.other_participant?.username,
              }))
            );

            // Ako je trenutno odabrani razgovor obrisan, resetiraj ga
            if (
              selectedConversation &&
              (selectedConversation.id === data.conversation_id ||
                selectedConversation.id === parseInt(data.conversation_id))
            ) {
              console.log("Resetting selectedConversation to null");
              setSelectedConversation(null);
              setMessages([]);

              // Zatvori WebSocket konekciju
              if (wsConnection) {
                wsConnection.close();
                setWsConnection(null);
              }

              // Zatvori details sidebar
              setShowDetailsSidebar(false);
            } else {
              console.log(
                "Not resetting - conversation not selected or ID mismatch"
              );
            }

            // Ukloni razgovor iz liste
            console.log(
              "Removing conversation from list:",
              data.conversation_id
            );
            setConversations((prev) => {
              const filtered = prev.filter(
                (conv) => conv.id !== data.conversation_id
              );
              console.log(
                "Conversations after removal:",
                filtered.map((conv) => ({
                  id: conv.id,
                  username: conv.other_participant?.username,
                }))
              );
              return filtered;
            });
            break;

          case "conversation_created":
            console.log("New conversation created:", data);
            // Dodaj novi razgovor na vrh liste
            setConversations((prev) => [data.conversation, ...prev]);
            break;

          case "conversation_updated":
            console.log("Conversation updated:", data);
            // Ažuriraj postojeći razgovor u listi i premjesti ga na vrh
            setConversations((prev) => {
              const filtered = prev.filter(
                (conv) => conv.id !== data.conversation.id
              );
              return [data.conversation, ...filtered];
            });
            break;

          case "conversation_list_update":
            console.log("Full conversation list update:", data);
            // Zamijeni cijelu listu razgovora
            setConversations(data.conversations);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.log("WebSocket readyState:", ws.readyState);
      };

      ws.onclose = (event) => {
        console.log(
          "WebSocket disconnected. Code:",
          event.code,
          "Reason:",
          event.reason
        );
        setWsConnection(null);

        // Pokušaj ponovno povezivanje s exponential backoff
        if (
          event.code !== 1000 &&
          selectedConversation &&
          conversations.find((conv) => conv.id === selectedConversation.id)
        ) {
          // 1000 = normal closure
          const backoffTime = Math.min(
            1000 * Math.pow(2, reconnectAttempts),
            30000
          ); // max 30s
          console.log(
            `Attempting to reconnect in ${backoffTime}ms (attempt ${
              reconnectAttempts + 1
            })`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connectWebSocket(selectedConversation.id);
          }, backoffTime);
        } else {
          console.log(
            "Not attempting to reconnect - conversation deleted or not found"
          );
          // Očisti reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          setReconnectAttempts(0);
        }
      };

      return ws;
    },
    [currentUser?.id]
  );

  // Funkcija za slanje poruke preko WebSocket-a
  const sendMessageViaWebSocket = async (content) => {
    console.log("Attempting to send message:", content);
    console.log("WebSocket connection state:", wsConnection?.readyState);

    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      const messageData = {
        type: "chat_message",
        message: content,
        timestamp: new Date().toISOString(),
        reply_to: replyToMessage ? {
          id: replyToMessage.id,
          content: replyToMessage.content,
          sender: {
            id: replyToMessage.sender.id,
            username: replyToMessage.sender.username,
            full_name: replyToMessage.sender.full_name
          }
        } : null
      };
      console.log("Sending via WebSocket:", messageData);
      wsConnection.send(JSON.stringify(messageData));
    } else {
      console.log("WebSocket not available, using API fallback");
      // Fallback na API ako WebSocket nije dostupan
      try {
        if (!selectedConversation?.id) {
          console.error("No conversation selected");
          return;
        }

        const messageData = await sendMessage(selectedConversation.id, content, replyToMessage);
        if (messageData.success) {
          console.log("Message sent via API:", messageData);
          setMessages((prevMessages) => [...prevMessages, messageData.message]);

          // Ažuriraj last_message u trenutnom razgovoru odmah
          if (selectedConversation) {
            setConversations((prevConversations) =>
              prevConversations.map((conv) =>
                conv.id === selectedConversation.id
                  ? {
                      ...conv,
                      last_message: {
                        content: messageData.message.content,
                        sender_username: messageData.message.sender.username,
                        created_at: messageData.message.created_at,
                      },
                    }
                  : conv
              )
            );
          }

          updateConversationsList();
        } else {
          console.error("Failed to send message:", messageData.error);
        }
      } catch (error) {
        console.error("Greška prilikom slanja poruke:", error);
        // Ako slanje ne uspije, možda je razgovor obrisan - ažuriraj listu
        updateConversationsList();
      }
    }
  };

  // Funkcija za slanje typing indikatora
  const sendTypingIndicator = (isTyping) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(
        JSON.stringify({
          type: isTyping ? "typing" : "stop_typing",
        })
      );
    }
  };

  // Funkcija za prikaz delete chat dialog-a
  const handleDeleteConversation = () => {
    setShowDeleteChatDialog(true);
  };

  // Funkcija za stvarno brisanje razgovora
  const confirmDeleteConversation = async () => {
    if (!selectedConversation) {
      setShowDeleteChatDialog(false);
      return;
    }

    try {
      const result = await deleteConversation(selectedConversation.id);
      if (result.success) {
        // Ažuriraj listu razgovora
        await updateConversationsList();

        // Zatvori details sidebar i resetiraj odabrani razgovor
        setShowDetailsSidebar(false);
        setSelectedConversation(null);
        setMessages([]);

        // Zatvori WebSocket konekciju
        if (wsConnection) {
          wsConnection.close();
          setWsConnection(null);
        }

        // Očisti reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        setReconnectAttempts(0);
      }
    } catch (error) {
      console.error("Greška prilikom brisanja razgovora:", error);
    }

    setShowDeleteChatDialog(false);
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: scale(0.8); }
            20% { opacity: 1; transform: scale(1); }
            80% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.8); }
          }
        `}
      </style>
      <div
        className="main-messages-container"
        key={`${selectedConversation?.id || "no-conversation"}-${forceUpdate}`}
      >
        <div className="left-messages-container">
          <div className="left-messages-header">
            <div className="inner-left-header">
              <p style={{ fontWeight: "600", fontSize: "20px" }}>
                {currentUser?.username || "Loading..."}
              </p>
              <svg
                aria-label="Down Chevron Icon"
                className="x1lliihq x1n2onr6 x5n08af"
                fill="currentColor"
                height="12"
                role="img"
                viewBox="0 0 24 24"
                width="12"
              >
                <path d="M12 17.502a1 1 0 0 1-.707-.293l-9-9.004a1 1 0 0 1 1.414-1.414L12 15.087l8.293-8.296a1 1 0 0 1 1.414 1.414l-9 9.004a1 1 0 0 1-.707.293Z"></path>
              </svg>
            </div>
            <svg
              aria-label="New message"
              className="x1lliihq x1n2onr6 x5n08af"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                d="M12.202 3.203H5.25a3 3 0 0 0-3 3V18.75a3 3 0 0 0 3 3h12.547a3 3 0 0 0 3-3v-6.952"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
              <path
                d="M10.002 17.226H6.774v-3.228L18.607 2.165a1.417 1.417 0 0 1 2.004 0l1.224 1.225a1.417 1.417 0 0 1 0 2.004Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
              <line
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="16.848"
                x2="20.076"
                y1="3.924"
                y2="7.153"
              ></line>
            </svg>
          </div>
          <div className="left-messages-search-container">
            <div
              style={{ position: "relative", width: "100%", padding: "0 16px" }}
            >
              {/* Back ikona - prikazuje se samo kad je input fokusiran */}
              {isInputFocused && (
                <svg
                  aria-label="Back"
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    position: "absolute",
                    left: "18px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#262626",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                  onClick={handleBackClick}
                >
                  <polyline
                    fill="none"
                    points="16.502 3 7.498 12 16.502 21"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></polyline>
                </svg>
              )}

              <input
                ref={inputRef}
                className="messages-search-input"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={{
                  width: isInputFocused ? "89%" : "100%",
                  padding: isInputFocused
                    ? "8px 12px 8px 13px"
                    : "8px 12px 8px 47px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5",
                  fontSize: "14px",
                  outline: "none",
                  height: "3em",
                  transition: "padding 0.2s ease",
                  marginLeft: isInputFocused ? "40px" : "0",
                  transition: "margin-left 0.2s ease, padding 0.2s ease",
                }}
              />

              {/* Search ikona - prikazuje se samo kad nije fokusiran */}
              {!isInputFocused && (
                <i
                  className="pi pi-search"
                  style={{
                    position: "absolute",
                    left: "37px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#8e8e8e",
                    fontSize: "14px",
                  }}
                ></i>
              )}

              {/* Loading spinner - prikazuje se kad se traži */}
              {isInputFocused && searchTerm && loading && (
                <i
                  className="pi pi-spinner pi-spin"
                  style={{
                    position: "absolute",
                    right: "28px",
                    top: "30%",
                    transform: "translateY(-50%)",
                    color: "#8e8e8e",
                    fontSize: "14px",
                  }}
                ></i>
              )}

              {/* X ikona - prikazuje se kad ima teksta i nije loading */}
              {isInputFocused && searchTerm && !loading && (
                <i
                  className="pi pi-times-circle"
                  style={{
                    position: "absolute",
                    right: "28px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8e8e8e",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  onClick={handleClearSearch}
                ></i>
              )}
            </div>

            {/* Lista razgovora - prikazuje se kad nije input fokusiran */}
            {!isInputFocused && (
              <div style={{ marginTop: "10px", padding: "0px" }}>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#000000",
                    paddingLeft: "1.1em",
                    marginTop: "0.8em",
                  }}
                >
                  Messages{" "}
                </h2>{" "}
                {conversations.filter(
                  (conversation) =>
                    conversation.last_message &&
                    conversation.last_message.content
                ).length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {conversations
                      .filter(
                        (conversation) =>
                          conversation.last_message &&
                          conversation.last_message.content
                      )
                      .map((conversation) => (
                        <li
                          key={conversation.id}
                          className="conversation-item"
                          onClick={() => {
                            handleSelectConversation(conversation);
                            navigate(`/home/messages/conversation/${conversation.id}`);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            cursor: "pointer",
                            backgroundColor:
                              selectedConversation?.id === conversation.id
                                ? "#efefef"
                                : "transparent",
                          }}
                        >
                          <img
                            key={`${conversation.id}-${conversation.other_participant.id}`}
                            src={
                              conversation.other_participant.profile_image &&
                              conversation.other_participant.profile_image.startsWith(
                                "http"
                              ) &&
                              !conversation.other_participant.profile_image.startsWith(
                                "ws://"
                              )
                                ? conversation.other_participant.profile_image
                                : profilePicDefault
                            }
                            alt={conversation.other_participant.username}
                            width={56}
                            height={56}
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            onLoad={() => {
                              console.log(
                                "Image loaded successfully:",
                                conversation.other_participant.profile_image
                              );
                            }}
                            onError={(e) => {
                              console.error(
                                "Image failed to load:",
                                conversation.other_participant.profile_image,
                                e
                              );
                              console.log(
                                "Image URL type:",
                                typeof conversation.other_participant
                                  .profile_image
                              );
                              console.log(
                                "Image URL starts with ws://",
                                conversation.other_participant.profile_image?.startsWith(
                                  "ws://"
                                )
                              );
                              e.target.onerror = null;

                              // Pokušaj ponovno učitati sliku nakon 1 sekunde
                              setTimeout(() => {
                                if (
                                  conversation.other_participant.profile_image
                                ) {
                                  console.log(
                                    "Retrying image load:",
                                    conversation.other_participant.profile_image
                                  );
                                  e.target.src =
                                    conversation.other_participant.profile_image;
                                } else {
                                  e.target.src = profilePicDefault;
                                }
                              }, 1000);
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "14px",
                                color: "#262626",
                                marginBottom: "2px",
                              }}
                            >
                              {conversation.other_participant.username}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {" "}
                              <div
                                style={{
                                  color:
                                    conversation.unread_count > 0 &&
                                    selectedConversation?.id !== conversation.id
                                      ? "#000000"
                                      : "#737373",
                                  fontSize: "12px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  marginBottom: "2px",
                                  fontWeight:
                                    conversation.unread_count > 0 &&
                                    selectedConversation?.id !== conversation.id
                                      ? "bold"
                                      : "normal",
                                }}
                              >
                                {conversation.isTyping ? (
                                  <>
                                    {conversation.typingUser ===
                                    currentUser?.username
                                      ? "You: "
                                      : ""}
                                    <span
                                      style={{
                                        color: "#737373",
                                        fontSize: "12px",
                                      }}
                                    >
                                      Typing...
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    {conversation.last_message
                                      ?.sender_username ===
                                    currentUser?.username
                                      ? "You: "
                                      : ""}
                                    {conversation.last_message?.content ||
                                      "No messages yet"}
                                  </>
                                )}
                              </div>
                              {!conversation.isTyping && (
                                <>
                                  <span
                                    style={{
                                      color: "#8e8e8e",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {" "}
                                    ·{" "}
                                  </span>
                                  {conversation.last_message?.created_at && (
                                    <div
                                      style={{
                                        color: "#8e8e8e",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {formatRelativeTime(
                                        conversation.last_message.created_at
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          {conversation.unread_count > 0 &&
                            selectedConversation?.id !== conversation.id && (
                              <div
                                style={{
                                  backgroundColor: "#0095f6",
                                  borderRadius: "50%",
                                  width: "8px",
                                  height: "8px",
                                  minWidth: "8px",
                                }}
                              />
                            )}
                        </li>
                      ))}
                  </ul>
                ) : conversations.filter(
                    (conversation) =>
                      conversation.last_message &&
                      conversation.last_message.content
                  ).length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "40px 20px",
                      textAlign: "center",
                    }}
                  >
                    {/* Profilna slika */}
                    <img
                      src={currentUser?.profile_image_url || profilePicDefault}
                      alt={currentUser?.username || "Profile"}
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: "16px",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = profilePicDefault;
                      }}
                    />

                    {/* Username */}
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "16px",
                        color: "#262626",
                        marginBottom: "8px",
                      }}
                    >
                      {currentUser?.username || "Loading..."}
                    </div>

                    {/* View Profile gumb */}
                    <Button
                      label="View Profile"
                      onClick={() => navigate("/home/profile")}
                      className="view-profile-button"
                    />
                  </div>
                ) : null}
              </div>
            )}

            {/* Lista korisnika koje pratim - prikazuje se kad je input fokusiran i nema search rezultata */}
            {isInputFocused && !searchTerm && (
              <div style={{ marginTop: "10px", padding: "0px" }}>
                {followingUsers.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {followingUsers.slice(0, 20).map((user) => (
                      <li
                        className="following-users-messages-container"
                        key={user.id}
                        onClick={() => handleStartConversation(user)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          paddingLeft: "1em",
                          cursor: "pointer",
                          height: "4em",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <img
                          src={user.profile_image || profilePicDefault}
                          alt={user.username}
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = profilePicDefault;
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#262626",
                            }}
                          >
                            {user.username}
                          </div>
                          <div
                            style={{
                              color: "#8e8e8e",
                              fontSize: "14px",
                              marginTop: "2px",
                            }}
                          >
                            {user.full_name}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#8e8e8e",
                      fontSize: "14px",
                      padding: "20px 0",
                    }}
                  >
                    No following users found.
                  </div>
                )}
              </div>
            )}

            {/* Search rezultati - prikazuje se kad ima search rezultata */}
            {showSearchResults && (
              <div style={{ marginTop: "10px", padding: "0px" }}>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#000000",
                    paddingLeft: "1.7em",
                    marginTop: "0.8em",
                  }}
                >
                  More accounts
                </h2>
                {users.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {users.map((user) => (
                      <li
                        className="users-search-results-messages-container"
                        key={user.id}
                        onClick={() => handleStartConversation(user)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          paddingLeft: "1em",
                          height: "4em",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <img
                          src={user.profile_image || profilePicDefault}
                          alt={user.username}
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = profilePicDefault;
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#262626",
                            }}
                          >
                            {user.username}
                          </div>
                          <div
                            style={{
                              color: "#8e8e8e",
                              fontSize: "14px",
                              marginTop: "2px",
                            }}
                          >
                            {user.full_name}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : searchTerm && !loading ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#8e8e8e",
                      fontSize: "14px",
                      padding: "20em 0",
                    }}
                  >
                    No results found.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div
          className="right-messages-container"
          style={{
            width: showDetailsSidebar ? "66%" : "71%",
            justifyContent: showDetailsSidebar ? "start" : "center",
          }}
        >
          {selectedConversation ? (
            // Chat interface
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                width: showDetailsSidebar ? "71%" : "100%",
                transition: "width 0.3s ease",
                justifyContent:"space-between"
              }}
            >
              {/* Chat header */}
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* Left side - Profile info */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <img
                    key={`header-${selectedConversation.id}-${selectedConversation.other_participant.id}`}
                    src={
                      selectedConversation.other_participant.profile_image ||
                      profilePicDefault
                    }
                    alt={selectedConversation.other_participant.username}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                    onLoad={() => {
                      console.log("Header image loaded:", selectedConversation.other_participant.profile_image);
                    }}
                    onError={(e) => {
                      console.error("Header image failed to load:", selectedConversation.other_participant.profile_image);
                      e.target.onerror = null;
                      e.target.src = profilePicDefault;
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "16px" }}>
                      {selectedConversation.other_participant.full_name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#737373" }}>
                      {selectedConversation.other_participant.username}
                    </div>
                  </div>
                </div>

                {/* Right side - Action icons */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  {/* Audio Call */}
                  <svg
                    aria-label="Audio Call"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    style={{ cursor: "pointer", color: "#262626" }}
                  >
                    <title>Audio Call</title>
                    <path d="M18.227 22.912c-4.913 0-9.286-3.627-11.486-5.828C4.486 14.83.731 10.291.921 5.231a3.289 3.289 0 0 1 .908-2.138 17.116 17.116 0 0 1 1.865-1.71 2.307 2.307 0 0 1 3.004.174 13.283 13.283 0 0 1 3.658 5.325 2.551 2.551 0 0 1-.19 1.941l-.455.853a.463.463 0 0 0-.024.387 7.57 7.57 0 0 0 4.077 4.075.455.455 0 0 0 .386-.024l.853-.455a2.548 2.548 0 0 1 1.94-.19 13.278 13.278 0 0 1 5.326 3.658 2.309 2.309 0 0 1 .174 3.003 17.319 17.319 0 0 1-1.71 1.866 3.29 3.29 0 0 1-2.138.91 10.27 10.27 0 0 1-.368.006Zm-13.144-20a.27.27 0 0 0-.167.054A15.121 15.121 0 0 0 3.28 4.47a1.289 1.289 0 0 0-.36.836c-.161 4.301 3.21 8.34 5.235 10.364s6.06 5.403 10.366 5.236a1.284 1.284 0 0 0 .835-.36 15.217 15.217 0 0 0 1.504-1.637.324.324 0 0 0-.047-.41 11.62 11.62 0 0 0-4.457-3.119.545.545 0 0 0-.411.044l-.854.455a2.452 2.452 0 0 1-2.071.116 9.571 9.571 0 0 1-5.189-5.188 2.457 2.457 0 0 1 .115-2.071l.456-.855a.544.544 0 0 0 .043-.41 11.629 11.629 0 0 0-3.118-4.458.36.36 0 0 0-.244-.1Z"></path>
                  </svg>

                  {/* Video Call */}
                  <svg
                    aria-label="Video Call"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    style={{ cursor: "pointer", color: "#262626" }}
                  >
                    <title>Video Call</title>
                    <rect
                      fill="none"
                      height="18"
                      rx="3"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      width="16.999"
                      x="1"
                      y="3"
                    ></rect>
                    <path
                      d="m17.999 9.146 2.495-2.256A1.5 1.5 0 0 1 23 8.003v7.994a1.5 1.5 0 0 1-2.506 1.113L18 14.854"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>

                  {/* Conversation information */}
                  {showDetailsSidebar ? (
                    <svg
                      aria-label="Conversation information"
                      fill="currentColor"
                      height="24"
                      role="img"
                      viewBox="0 0 24 24"
                      width="24"
                      style={{ cursor: "pointer", color: "#262626" }}
                      onClick={toggleDetailsSidebar}
                    >
                      <title>Conversation information</title>
                      <path d="M12.001.504a11.5 11.5 0 1 0 11.5 11.5 11.513 11.513 0 0 0-11.5-11.5Zm-.182 5.955a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Zm1.614 11.318h-2.865a1 1 0 0 1 0-2H11V12.05h-.432a1 1 0 0 1 0-2H12a1 1 0 0 1 1 1v4.727h.433a1 1 0 1 1 0 2Z"></path>
                    </svg>
                  ) : (
                    <svg
                      aria-label="Conversation information"
                      fill="currentColor"
                      height="24"
                      role="img"
                      viewBox="0 0 24 24"
                      width="24"
                      style={{ cursor: "pointer", color: "#262626" }}
                      onClick={toggleDetailsSidebar}
                    >
                      <title>Conversation information</title>
                      <circle
                        cx="12.001"
                        cy="12.005"
                        fill="none"
                        r="10.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></circle>
                      <circle cx="11.819" cy="7.709" r="1.25"></circle>
                      <line
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        x1="10.569"
                        x2="13.432"
                        y1="16.777"
                        y2="16.777"
                      ></line>
                      <polyline
                        fill="none"
                        points="10.569 11.05 12 11.05 12 16.777"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></polyline>
                    </svg>
                  )}
                </div>
              </div>

              {/* Messages area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1.5em",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: replyToMessage ? "33em" : "38em",
                }}
              >
                {messages.length > 0 ? (
                  <>
                                                            {messages.map((message, index) => {
                      const nextMessage = messages[index + 1];
                      const isNextMessageReply = nextMessage && nextMessage.reply_to;
                      
                      return (
                        <div
                        key={message.id}
                        style={{
                          alignSelf:
                            message.sender.id === currentUser?.id
                              ? "flex-end"
                              : "flex-start",
                          maxWidth: "100%",
                          width: "100%",
                          display: "flex",
                          justifyContent: "center",
                          flexDirection: "column",
                          alignItems:
                            message.sender.id === currentUser?.id
                              ? "flex-end"
                              : "flex-start",
                          position: "relative",
                          paddingLeft:
                            message.sender.id === currentUser?.id ? "0" : "0",
                          paddingRight:
                            message.sender.id === currentUser?.id ? "0" : "0",
                          minHeight: "40px",
                          marginTop: message.reply_to ? "2.5em" : (message.content === "❤️" ? "1em" : "0"),
                          marginBottom: message.reply_to 
                            ? (isNextMessageReply ? "1.5em" : "2.5em") 
                            : (message.content === "❤️" ? "1em" : "0em"),
                        }}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        {/* Reply indicator */}
                        {message.reply_to && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#737373",
                              marginBottom: "4px",
                              marginTop: "1em",
                              textAlign: message.sender.id === currentUser?.id ? "right" : "left",
                            }}
                          >
                            {message.sender.id === currentUser?.id 
                              ? `You replied to ${message.reply_to.sender.id === currentUser?.id ? "yourself" : message.reply_to.sender.full_name || message.reply_to.sender.username}`
                              : `Replied to ${message.reply_to.sender.id === message.sender.id ? "themselves" : "you"}`
                            }
                            <div
                              style={{
                                backgroundColor: message.sender.id === currentUser?.id ? "#efefef" : "#3797f0",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "14px",
                                color: message.sender.id === currentUser?.id ? "#000000" : "#ffffff",
                                display: "block",
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                width: "fit-content",
                                marginLeft: message.sender.id === currentUser?.id ? "auto" : "20px",
                                marginRight: message.sender.id === currentUser?.id ? "20px" : "auto",
                                marginBottom: "0.5em",
                                marginTop: "0.5em",
                              }}
                            >
                              {message.reply_to.content}
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            backgroundColor:
                              message.content === "❤️"
                                ? "transparent"
                                : message.sender.id === currentUser?.id
                                ? "#3797f0"
                                : "#efefef",
                            color:
                              message.content === "❤️"
                                ? "inherit"
                                : message.sender.id === currentUser?.id
                                ? "white"
                                : "#000000",
                            padding:
                              message.content === "❤️" ? "4px" : "8px 12px",
                            borderRadius:
                              message.content === "❤️" ? "0" : "18px",
                            fontSize:
                              message.content === "❤️" ? "50px" : "14px",
                            wordWrap: "break-word",
                            width: "fit-content",
                            maxWidth: "70%",
                            position: "relative",
                          }}
                        >
                          {message.content}

                          {/* Message options icons on hover */}
                          {(hoveredMessageId === message.id ||
                            (contextMenu.show &&
                              contextMenu.messageId === message.id)) && (
                            <div
                              className="message-options-container"
                              style={{
                                position: "absolute",
                                top: "50%",
                                transform: "translateY(-50%)",
                                left:
                                  message.sender.id === currentUser?.id
                                    ? "auto"
                                    : message.content === "❤️"
                                    ? "calc(100% + 0em)"
                                    : "calc(100% + 1em)",
                                right:
                                  message.sender.id === currentUser?.id
                                    ? message.content === "❤️"
                                      ? "calc(100% + 0em)"
                                      : "calc(100% + 1em)"
                                    : "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                pointerEvents: "auto",
                                width: "120px",
                                justifyContent:
                                  message.sender.id === currentUser?.id
                                    ? "flex-end"
                                    : "flex-start",
                                zIndex: 10,
                              }}
                              onMouseEnter={() =>
                                setHoveredMessageId(message.id)
                              }
                              onMouseLeave={() => {
                                if (!contextMenu.show) {
                                  setHoveredMessageId(null);
                                }
                              }}
                            >
                              {/* More options icon */}
                              <div
                                className="message-option-button"
                                style={{
                                  cursor: "pointer",
                                  padding: "4px",
                                  borderRadius: "50%",
                                  backgroundColor: "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "background-color 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(0, 0, 0, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }}
                                onClick={(e) =>
                                  handleContextMenu(e, message.id)
                                }
                              >
                                <svg
                                  aria-label={`See more options for message from ${message.sender.username}`}
                                  fill="currentColor"
                                  height="16"
                                  role="img"
                                  viewBox="0 0 24 24"
                                  width="16"
                                  style={{ color: "#262626" }}
                                >
                                  <title>
                                    See more options for message from{" "}
                                    {message.sender.username}
                                  </title>
                                  <circle cx="12" cy="12" r="1.5"></circle>
                                  <circle cx="12" cy="6" r="1.5"></circle>
                                  <circle cx="12" cy="18" r="1.5"></circle>
                                </svg>
                              </div>

                              {/* Reply icon */}
                              <div
                                className="message-option-button"
                                style={{
                                  cursor: "pointer",
                                  padding: "4px",
                                  borderRadius: "50%",
                                  backgroundColor: "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "background-color 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(0, 0, 0, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }}
                                onClick={() => handleReply(message.id)}
                              >
                                <svg
                                  aria-label={`Reply to message from ${message.sender.username}`}
                                  fill="currentColor"
                                  height="16"
                                  role="img"
                                  viewBox="0 0 24 24"
                                  width="16"
                                  style={{ color: "#262626" }}
                                >
                                  <title>
                                    Reply to message from{" "}
                                    {message.sender.username}
                                  </title>
                                  <path d="M14 8.999H4.413l5.294-5.292a1 1 0 1 0-1.414-1.414l-7 6.998c-.014.014-.019.033-.032.048A.933.933 0 0 0 1 9.998V10c0 .027.013.05.015.076a.907.907 0 0 0 .282.634l6.996 6.998a1 1 0 0 0 1.414-1.414L4.415 11H14a7.008 7.008 0 0 1 7 7v3.006a1 1 0 0 0 2 0V18a9.01 9.01 0 0 0-9-9Z"></path>
                                </svg>
                              </div>

                              {/* React icon */}
                              <div
                                className="message-option-button"
                                style={{
                                  cursor: "pointer",
                                  padding: "4px",
                                  borderRadius: "50%",
                                  backgroundColor: "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "background-color 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(0, 0, 0, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }}
                              >
                                <svg
                                  aria-label={`React to message from ${message.sender.username}`}
                                  fill="currentColor"
                                  height="16"
                                  role="img"
                                  viewBox="0 0 24 24"
                                  width="16"
                                  style={{ color: "#262626" }}
                                >
                                  <title>
                                    React to message from{" "}
                                    {message.sender.username}
                                  </title>
                                  <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#8e8e8e",
                            marginTop: "4px",
                            textAlign:
                              message.sender.id === currentUser?.id
                                ? "right"
                                : "left",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            justifyContent:
                              message.sender.id === currentUser?.id
                                ? "flex-end"
                                : "flex-start",
                          }}
                        >
                          {/* Ovdje možemo dodati vrijeme poruke ako je potrebno */}
                        </div>

                        {/* Seen status - ispod poruke */}
                        {message.sender.id === currentUser?.id &&
                          message.id ===
                            messages
                              .filter((m) => m.sender.id === currentUser?.id)
                              .pop()?.id &&
                          message.id === messages[messages.length - 1]?.id &&
                          message.is_read && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#8e8e8e",
                                marginTop: "2px",
                                textAlign: "right",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#737373",
                                  fontWeight: "normal",
                                }}
                              >
                                Seen {formatRelativeTime(message.created_at)}
                              </span>
                            </div>
                          )}
                      </div>
                    );
                  })}

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div
                        style={{
                          alignSelf: "flex-start",
                          maxWidth: "70%",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "#efefef",
                            padding: "8px 12px",
                            borderRadius: "18px",
                            fontSize: "14px",
                            color: "#8e8e8e",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      marginTop: "20px",
                      gap: "0.5em",
                    }}
                  >
                    {/* Profilna slika */}
                    <img
                      src={
                        selectedConversation.other_participant.profile_image ||
                        profilePicDefault
                      }
                      alt={
                        selectedConversation.other_participant.username ||
                        "Profile"
                      }
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: "16px",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = profilePicDefault;
                      }}
                    />

                    {/* Username */}
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "16px",
                        color: "#262626",
                        marginBottom: "8px",
                      }}
                    >
                      {selectedConversation.other_participant.username ||
                        "Loading..."}
                    </div>

                    {/* View Profile gumb */}
                    <Button
                      label="View Profile"
                      onClick={() =>
                        navigate(
                          `/home/users/${selectedConversation.other_participant.id}/profile`
                        )
                      }
                      className="view-profile-button"
                    />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Banner */}
              {replyToMessage && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #f0f0f0",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "black",
                        marginBottom: "4px",
                      }}
                    >
                      Replying to{" "}
                      <span style={{ fontWeight: "600" }}>
                        {replyToMessage.sender.id === currentUser?.id
                          ? "yourself"
                          : replyToMessage.sender.full_name ||
                            replyToMessage.sender.username}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#8e8e8e",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {replyToMessage.content}
                    </div>
                  </div>
                  <button
                    onClick={handleCancelReply}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      marginLeft: "8px",
                    }}
                  >
                    <svg
                      aria-label="Close"
                      fill="currentColor"
                      height="16"
                      role="img"
                      viewBox="0 0 24 24"
                      width="16"
                      style={{ color: "#262626" }}
                    >
                      <title>Close</title>
                      <polyline
                        fill="none"
                        points="20.643 3.357 12 12 3.353 20.647"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></polyline>
                      <line
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        x1="20.649"
                        x2="3.354"
                        y1="20.649"
                        y2="3.354"
                      ></line>
                    </svg>
                  </button>
                </div>
              )}

              {/* Message input */}
              <div
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Message input field with icons inside */}
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #dbdbdb",
                    borderRadius: "22px",
                    backgroundColor: "white",
                    padding: "11px 14px",
                  }}
                >
                  {/* Left side icon - Emoji picker */}
                  <svg
                    aria-label="Choose an emoji"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    style={{
                      cursor: "pointer",
                      color: "#262626",
                      marginRight: "8px",
                    }}
                  >
                    <title>Choose an emoji</title>
                    <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                  </svg>

                  {/* Input field */}
                  <input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage(null)
                    }
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      backgroundColor: "transparent",
                      padding: "4px 0",
                    }}
                  />

                  {/* Right side icons - show when not typing */}
                  {!newMessage.trim() && (
                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        alignItems: "center",
                      }}
                    >
                      {/* Voice clip */}
                      <svg
                        aria-label="Voice clip"
                        fill="currentColor"
                        height="24"
                        role="img"
                        viewBox="0 0 24 24"
                        width="24"
                        style={{ cursor: "pointer", color: "#262626" }}
                      >
                        <title>Voice clip</title>
                        <path
                          d="M19.5 10.671v.897a7.5 7.5 0 0 1-15 0v-.897"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                        <line
                          fill="none"
                          stroke="currentColor"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          x1="12"
                          x2="12"
                          y1="19.068"
                          y2="22"
                        ></line>
                        <line
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          x1="8.706"
                          x2="15.104"
                          y1="22"
                          y2="22"
                        ></line>
                        <path
                          d="M12 15.745a4 4 0 0 1-4-4V6a4 4 0 0 1 8 0v5.745a4 4 0 0 1-4 4Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                      </svg>

                      {/* Add photo or video */}
                      <svg
                        aria-label="Add photo or video"
                        fill="currentColor"
                        height="24"
                        role="img"
                        viewBox="0 0 24 24"
                        width="24"
                        style={{ cursor: "pointer", color: "#262626" }}
                      >
                        <title>Add photo or video</title>
                        <path
                          d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z"
                          fillRule="evenodd"
                        ></path>
                        <path
                          d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                          fill="none"
                          stroke="currentColor"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                        <path
                          d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564h0v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                      </svg>

                      {/* GIF or sticker */}
                      <svg
                        aria-label="Choose a GIF or sticker"
                        fill="currentColor"
                        height="24"
                        role="img"
                        viewBox="0 0 24 24"
                        width="24"
                        style={{ cursor: "pointer", color: "#262626" }}
                      >
                        <title>Choose a GIF or sticker</title>
                        <path
                          d="M13.11 22H7.416A5.417 5.417 0 0 1 2 16.583V7.417A5.417 5.417 0 0 1 7.417 2h9.166A5.417 5.417 0 0 1 22 7.417v5.836a2.083 2.083 0 0 1-.626 1.488l-6.808 6.664A2.083 2.083 0 0 1 13.11 22Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                        <circle cx="8.238" cy="9.943" r="1.335"></circle>
                        <circle cx="15.762" cy="9.943" r="1.335"></circle>
                        <path
                          d="M15.174 15.23a4.887 4.887 0 0 1-6.937-.301"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                        <path
                          d="M22 10.833v1.629a1.25 1.25 0 0 1-1.25 1.25h-1.79a5.417 5.417 0 0 0-5.417 5.417v1.62a1.25 1.25 0 0 1-1.25 1.25H9.897"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        ></path>
                      </svg>

                      {/* Like */}
                      <svg
                        aria-label="Like"
                        fill="currentColor"
                        height="24"
                        role="img"
                        viewBox="0 0 24 24"
                        width="24"
                        style={{ cursor: "pointer", color: "#262626" }}
                        onClick={() => handleSendMessage("❤️")}
                      >
                        <title>Like</title>
                        <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path>
                      </svg>
                    </div>
                  )}

                  {/* Send button - shows only when typing */}
                  {newMessage.trim() && (
                    <button
                      onClick={() => handleSendMessage(null)}
                      style={{
                        backgroundColor: "transparent",
                        color: "#3143e3",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                    >
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Default "Your messages" screen
            <div className="yourMessages-template-div">
              <svg
                aria-label=""
                className="x1lliihq x1n2onr6 xyb1xck"
                fill="currentColor"
                height="96"
                role="img"
                viewBox="0 0 96 96"
                width="96"
              >
                <path d="M48 0C21.532 0 0 21.533 0 48s21.532 48 48 48 48-21.532 48-48S74.468 0 48 0Zm0 94C22.636 94 2 73.364 2 48S22.636 2 48 2s46 20.636 46 46-20.636 46-46 46Zm12.227-53.284-7.257 5.507c-.49.37-1.166.375-1.661.005l-5.373-4.031a3.453 3.453 0 0 0-4.989.921l-6.756 10.718c-.653 1.027.615 2.189 1.582 1.453l7.257-5.507a1.382 1.382 0 0 1 1.661-.005l5.373 4.031a3.453 3.453 0 0 0 4.989-.92l6.756-10.719c.653-1.027-.615-2.189-1.582-1.453ZM48 25c-12.958 0-23 9.492-23 22.31 0 6.706 2.749 12.5 7.224 16.503.375.338.602.806.62 1.31l.125 4.091a1.845 1.845 0 0 0 2.582 1.629l4.563-2.013a1.844 1.844 0 0 1 1.227-.093c2.096.579 4.331.884 6.659.884 12.958 0 23-9.491 23-22.31S60.958 25 48 25Zm0 42.621c-2.114 0-4.175-.273-6.133-.813a3.834 3.834 0 0 0-2.56.192l-4.346 1.917-.118-3.867a3.833 3.833 0 0 0-1.286-2.727C29.33 58.54 27 53.209 27 47.31 27 35.73 36.028 27 48 27s21 8.73 21 20.31-9.028 20.31-21 20.31Z"></path>
              </svg>
              <p style={{ fontSize: "20px", color: "#000000", margin: "0px" }}>
                Your messages
              </p>
              <p style={{ fontSize: "14px", color: "#737373", margin: "0px" }}>
                Send private photos and messages to a friend or group.
              </p>
              <Button
                style={{
                  backgroundColor: "#4a5df9",
                  border: "none",
                  color: "#fff",
                  height: "32px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginTop: "1em",
                }}
                label="Send message"
              />
            </div>
          )}

          {/* Details Sidebar */}
          {showDetailsSidebar && selectedConversation && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "23%",
                height: "100%",
                backgroundColor: "white",
                borderLeft: "1px solid #f0f0f0",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "27px",
                  borderBottom: "1px solid #f0f0f0",
                  fontWeight: "550",
                  fontSize: "20px",
                }}
              >
                Details
              </div>

              {/* Mute Messages Section */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <svg
                    aria-label="Mute icon"
                    className="x1lliihq x1n2onr6 x5n08af"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <title>Mute icon</title>
                    <path d="m21.306 14.019-.484-.852A6.358 6.358 0 0 1 20 9.997a7.953 7.953 0 0 0-4.745-7.302 3.971 3.971 0 0 0-6.51.002 7.95 7.95 0 0 0-4.74 7.323 6.337 6.337 0 0 1-.83 3.175l-.468.823a4.001 4.001 0 0 0 3.476 5.983h1.96a3.98 3.98 0 0 0 7.716 0h1.964a4.004 4.004 0 0 0 3.482-5.982Zm-9.304 6.983a1.993 1.993 0 0 1-1.722-1.001h3.444a1.993 1.993 0 0 1-1.722 1.001Zm7.554-3.997a1.986 1.986 0 0 1-1.732.996H6.184a2.002 2.002 0 0 1-1.74-2.993l.47-.822a8.337 8.337 0 0 0 1.093-4.174 5.962 5.962 0 0 1 3.781-5.584.996.996 0 0 0 .494-.426 1.976 1.976 0 0 1 3.439 0 1 1 0 0 0 .494.425 5.989 5.989 0 0 1 3.786 5.634 8.303 8.303 0 0 0 1.082 4.094l.483.852a1.984 1.984 0 0 1-.01 1.998Z"></path>
                  </svg>
                  <span style={{ fontSize: "16px" }}>Mute messages</span>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "24px",
                    backgroundColor: isMuted ? "#262626" : "#dbdbdb",
                    borderRadius: "12px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "2px",
                      left: isMuted ? "22px" : "2px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>

              {/* Members Section */}
              <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "16px",
                    marginBottom: "16px",
                  }}
                >
                  Members
                </div>
                <div
                  className="info-item-user"
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <img
                    key={`details-${selectedConversation.id}-${selectedConversation.other_participant.id}`}
                    src={
                      selectedConversation.other_participant.profile_image ||
                      profilePicDefault
                    }
                    alt={selectedConversation.other_participant.username}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>
                      {selectedConversation.other_participant.full_name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#737373" }}>
                      {selectedConversation.other_participant.username}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  padding: "20px",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1em",
                  marginBottom: "0.5em",
                }}
              >
                <div
                  style={{
                    color: "#ED4956",
                    fontSize: "16px",
                    cursor: "pointer",
                    marginBottom: "12px",
                  }}
                >
                  Report
                </div>
                <div
                  style={{
                    color: "#ED4956",
                    fontSize: "16px",
                    cursor: "pointer",
                    marginBottom: "12px",
                  }}
                >
                  Block
                </div>
                <div
                  style={{
                    color: "#ED4956",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                  onClick={handleDeleteConversation}
                >
                  Delete Chat
                </div>
              </div>
            </div>
          )}

          {/* Context Menu */}
          {contextMenu.show &&
            (() => {
              const message = messages.find(
                (m) => m.id === contextMenu.messageId
              );
              const isOwnMessage = message?.sender.id === currentUser?.id;

              return (
                <div
                  style={{
                    position: "fixed",
                    top: contextMenu.y,
                    left: contextMenu.x,
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #dbdbdb",
                    zIndex: 1000,
                    minWidth: "200px",
                    padding: "8px 0",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isOwnMessage ? (
                    // Context menu za moje poruke
                    <>
                      {/* Timestamp */}
                      <div
                        style={{
                          padding: "8px 16px",
                          fontSize: "12px",
                          color: "#737373",
                          fontWeight: "600",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        {(() => {
                          let dateToUse = new Date();

                          if (message && message.created_at) {
                            try {
                              dateToUse = new Date(message.created_at);
                              if (isNaN(dateToUse.getTime())) {
                                dateToUse = new Date();
                              }
                            } catch (error) {
                              dateToUse = new Date();
                            }
                          } else if (message && message.timestamp) {
                            try {
                              dateToUse = new Date(message.timestamp);
                              if (isNaN(dateToUse.getTime())) {
                                dateToUse = new Date();
                              }
                            } catch (error) {
                              dateToUse = new Date();
                            }
                          }

                          return formatContextMenuTime(dateToUse);
                        })()}
                      </div>

                      {/* Forward option */}
                      <div
                        style={{
                          padding: "0.5em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          fontSize: "14px",
                          width: "100%",
                          color: "#262626",
                        }}
                        onClick={handleForward}
                      >
                        <div className="context-item">
                          <span>Forward</span>
                          <svg
                            aria-label="Forward"
                            fill="currentColor"
                            height="18"
                            role="img"
                            viewBox="0 0 24 24"
                            width="18"
                            style={{ color: "#262626" }}
                          >
                            <title>Forward</title>
                            <line
                              fill="none"
                              stroke="currentColor"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              x1="22"
                              x2="9.218"
                              y1="3"
                              y2="10.083"
                            ></line>
                            <polygon
                              fill="none"
                              points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
                              stroke="currentColor"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            ></polygon>
                          </svg>
                        </div>
                      </div>

                      {/* Copy option */}
                      <div
                        style={{
                          padding: "0.5em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#262626",
                          width: "100%",
                        }}
                        onClick={handleCopy}
                      >
                        <div className="context-item">
                          <span>Copy</span>
                          <svg
                            aria-label="Copy"
                            fill="currentColor"
                            height="18"
                            role="img"
                            viewBox="0 0 24 24"
                            width="18"
                            style={{ color: "#262626" }}
                          >
                            <title>Copy</title>
                            <path d="m20.12 4.707-2.826-2.828A3.026 3.026 0 0 0 15.17 1h-5.167A3.007 3.007 0 0 0 7 4.004V5h-.996A3.007 3.007 0 0 0 3 8.004v11.992A3.007 3.007 0 0 0 6.004 23h7.992A3.007 3.007 0 0 0 17 19.996V19h.996A3.007 3.007 0 0 0 21 15.996V6.83a2.98 2.98 0 0 0-.88-2.123ZM18.586 6 16 6.001V3.414L18.586 6ZM15 19.996C15 20.55 14.55 21 13.996 21H6.004C5.45 21 5 20.55 5 19.996V8.004C5 7.45 5.45 7 6.004 7H7v8.996A3.007 3.007 0 0 0 10.004 19H15v.996ZM17.996 17h-7.992C9.45 17 9 16.55 9 15.996V4.004C9 3.45 9.45 3 10.004 3H14v3.001A2 2 0 0 0 15.999 8H19v7.996C19 16.55 18.55 17 17.996 17Z"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Unsend option */}
                      <div
                        style={{
                          padding: "0.5em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#ED4956",
                          borderTop: "1px solid #f0f0f0",
                          width: "100%",
                        }}
                        onClick={handleUnsend}
                      >
                        <div className="context-item">
                          <span>Unsend</span>
                          <svg
                            aria-label="Unsend"
                            class="x1lliihq x1n2onr6 xkmlbd1"
                            fill="currentColor"
                            height="18"
                            role="img"
                            viewBox="0 0 24 24"
                            width="18"
                          >
                            <title>Unsend</title>
                            <path d="M12 .5C5.659.5.5 5.66.5 12S5.659 23.5 12 23.5c6.34 0 11.5-5.16 11.5-11.5S18.34.5 12 .5Zm0 21c-5.238 0-9.5-4.262-9.5-9.5S6.762 2.5 12 2.5s9.5 4.262 9.5 9.5-4.262 9.5-9.5 9.5Z"></path>
                            <path d="M14.5 10H9.414l1.293-1.293a1 1 0 1 0-1.414-1.414l-3 2.999a1 1 0 0 0 0 1.414l3 3.001a.997.997 0 0 0 1.414 0 1 1 0 0 0 0-1.414L9.415 12H14.5c.827 0 1.5.674 1.5 1.501 0 .395-.157.794-.431 1.096-.227.249-.508.403-.735.403L14 14.999a1 1 0 0 0-.001 2l.833.001h.002c.796 0 1.604-.386 2.215-1.059a3.625 3.625 0 0 0 .951-2.44C18 11.571 16.43 10 14.5 10Z"></path>
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Context menu za senderove poruke
                    <>
                      {/* Timestamp */}
                      <div
                        style={{
                          padding: "8px 16px",
                          fontSize: "12px",
                          color: "#737373",
                          fontWeight: "600",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        {(() => {
                          let dateToUse = new Date();

                          if (message && message.created_at) {
                            try {
                              dateToUse = new Date(message.created_at);
                              if (isNaN(dateToUse.getTime())) {
                                dateToUse = new Date();
                              }
                            } catch (error) {
                              dateToUse = new Date();
                            }
                          } else if (message && message.timestamp) {
                            try {
                              dateToUse = new Date(message.timestamp);
                              if (isNaN(dateToUse.getTime())) {
                                dateToUse = new Date();
                              }
                            } catch (error) {
                              dateToUse = new Date();
                            }
                          }

                          return formatContextMenuTime(dateToUse);
                        })()}
                      </div>

                      {/* Forward option */}
                      <div
                        style={{
                          padding: "0.5em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          fontSize: "14px",
                          width: "100%",
                          color: "#262626",
                        }}
                        onClick={handleForward}
                      >
                        <div className="context-item">
                          <span>Forward</span>
                          <svg
                            aria-label="Forward"
                            fill="currentColor"
                            height="18"
                            role="img"
                            viewBox="0 0 24 24"
                            width="18"
                            style={{ color: "#262626" }}
                          >
                            <title>Forward</title>
                            <line
                              fill="none"
                              stroke="currentColor"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              x1="22"
                              x2="9.218"
                              y1="3"
                              y2="10.083"
                            ></line>
                            <polygon
                              fill="none"
                              points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
                              stroke="currentColor"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            ></polygon>
                          </svg>
                        </div>
                      </div>

                      {/* Copy option */}
                      <div
                        style={{
                          padding: "0.5em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#262626",
                          width: "100%",
                        }}
                        onClick={handleCopy}
                      >
                        <div className="context-item">
                          <span>Copy</span>
                          <svg
                            aria-label="Copy"
                            fill="currentColor"
                            height="18"
                            role="img"
                            viewBox="0 0 24 24"
                            width="18"
                            style={{ color: "#262626" }}
                          >
                            <title>Copy</title>
                            <path d="m20.12 4.707-2.826-2.828A3.026 3.026 0 0 0 15.17 1h-5.167A3.007 3.007 0 0 0 7 4.004V5h-.996A3.007 3.007 0 0 0 3 8.004v11.992A3.007 3.007 0 0 0 6.004 23h7.992A3.007 3.007 0 0 0 17 19.996V19h.996A3.007 3.007 0 0 0 21 15.996V6.83a2.98 2.98 0 0 0-.88-2.123ZM18.586 6 16 6.001V3.414L18.586 6ZM15 19.996C15 20.55 14.55 21 13.996 21H6.004C5.45 21 5 20.55 5 19.996V8.004C5 7.45 5.45 7 6.004 7H7v8.996A3.007 3.007 0 0 0 10.004 19H15v.996ZM17.996 17h-7.992C9.45 17 9 16.55 9 15.996V4.004C9 3.45 9.45 3 10.004 3H14v3.001A2 2 0 0 0 15.999 8H19v7.996C19 16.55 18.55 17 17.996 17Z"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Report option */}
                      <div
                        style={{
                          padding: "0.5em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#ED4956",
                          borderTop: "1px solid #f0f0f0",
                          width: "100%",
                        }}
                        onClick={() => {
                          console.log("Report message:", contextMenu.messageId);
                          closeContextMenu();
                        }}
                      >
                        <div className="context-item">
                          <span>Report</span>
                          <svg
                            aria-label="Report"
                            fill="currentColor"
                            height="18"
                            role="img"
                            viewBox="0 0 24 24"
                            width="18"
                            style={{ color: "#ED4956" }}
                          >
                            <title>Report</title>
                            <path d="M18.001 1h-12a5.006 5.006 0 0 0-5 5v9.005a5.006 5.006 0 0 0 5 5h2.514l2.789 2.712a1 1 0 0 0 1.394 0l2.787-2.712h2.516a5.006 5.006 0 0 0 5-5V6a5.006 5.006 0 0 0-5-5Zm3 14.005a3.003 3.003 0 0 1-3 3h-2.936a1 1 0 0 0-.79.387l-2.274 2.212-2.276-2.212a1 1 0 0 0-.79-.387H6a3.003 3.003 0 0 1-3-3V6a3.003 3.003 0 0 1 3-3h12a3.003 3.003 0 0 1 3 3Zm-9-1.66a1.229 1.229 0 1 0 1.228 1.228A1.23 1.23 0 0 0 12 13.344Zm0-8.117a1.274 1.274 0 0 0-.933.396 1.108 1.108 0 0 0-.3.838l.347 4.861a.892.892 0 0 0 1.77 0l.348-4.86a1.106 1.106 0 0 0-.3-.838A1.272 1.272 0 0 0 12 5.228Z"></path>
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

          {/* Unsend Message Dialog */}
          {showUnsendDialog && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
              }}
              onClick={() => {
                setShowUnsendDialog(false);
                setMessageToDelete(null);
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "25px",
                  padding: "24px",
                  maxWidth: "555px",
                  width: "90%",
                  textAlign: "center",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "500",
                    margin: "0 0 16px 0",
                    color: "#262626",
                  }}
                >
                  Unsend message?
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#737373",
                    margin: "0 0 24px 0",
                    lineHeight: "1.4",
                  }}
                >
                  This will remove the message for everyone, but people may have
                  seen it already.
                  <br />
                  Unsent messages may still be included if the conversation is
                  reported.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <hr
                    style={{
                      border: "none",
                      height: "1px",
                      backgroundColor: "#dbdbdb",
                      margin: "0 0 8px 0",
                      width: "109.5%",
                      marginLeft: "-1.5em",
                    }}
                  />
                  <button
                    onClick={confirmUnsend}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#ED4956",
                      fontSize: "14px",
                      fontWeight: "600",
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: "8px",
                    }}
                  >
                    Unsend
                  </button>
                  <hr
                    style={{
                      border: "none",
                      height: "1px",
                      backgroundColor: "#dbdbdb",
                      margin: "8px 0",
                      width: "109.5%",
                      marginLeft: "-1.5em",
                    }}
                  />
                  <button
                    onClick={() => {
                      setShowUnsendDialog(false);
                      setMessageToDelete(null);
                    }}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#262626",
                      fontSize: "14px",
                      fontWeight: "500",
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: "8px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Chat Dialog */}
          {showDeleteChatDialog && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
              }}
              onClick={() => setShowDeleteChatDialog(false)}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "25px",
                  padding: "24px",
                  maxWidth: "555px",
                  width: "90%",
                  textAlign: "center",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "500",
                    margin: "0 0 16px 0",
                    color: "#262626",
                  }}
                >
                  Delete chat from inbox?
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#737373",
                    margin: "0 0 24px 0",
                    lineHeight: "1.4",
                  }}
                >
                  This will remove the chat from your inbox and erase the chat
                  history. To stop receiving new messages from this account,
                  first block the account then delete the chat.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <hr
                    style={{
                      border: "none",
                      height: "1px",
                      backgroundColor: "#dbdbdb",
                      margin: "0 0 8px 0",
                      width: "109.5%",
                      marginLeft: "-1.5em",
                    }}
                  />
                  <button
                    onClick={confirmDeleteConversation}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#ED4956",
                      fontSize: "14px",
                      fontWeight: "600",
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: "8px",
                    }}
                  >
                    Delete
                  </button>
                  <hr
                    style={{
                      border: "none",
                      height: "1px",
                      backgroundColor: "#dbdbdb",
                      margin: "8px 0",
                      width: "109.5%",
                      marginLeft: "-1.5em",
                    }}
                  />
                  <button
                    onClick={() => setShowDeleteChatDialog(false)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#262626",
                      fontSize: "14px",
                      fontWeight: "500",
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: "8px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Copied Notification */}
          {showCopiedNotification && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10001,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(38, 38, 38, 0.6)",
                  borderRadius: "8px",
                  padding: "20px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  animation: "fadeInOut 2s ease-in-out",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "#262626" }}
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
                <span
                  style={{
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Copied
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessagesSidebar;
