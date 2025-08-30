import React, { useState, useEffect, useContext, useCallback } from "react";
import "../HomeSidebar/HomeSidebar.css";
import profilePicDefault from "../../imgs/profile-user (1).png";
import heartPhoto from "../../imgs/heart.png";
import morePic from "../../imgs/more.png";
import HeartPic from "../../imgs/instaHeart.png";
import HeartActivePic from "../../imgs/instaHeartFull.png";
import bookMarkPic from "../../imgs/instaBookMarkOutline.png";
import bookMarkPicActive from "../../imgs/instaBookMark.png";
import arrowBack from "../../imgs/arrow-back.png";
import arrowForward from "../../imgs/arrow-forward.png";
import { UserContext } from "../UserContext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import EmojiPicker from "emoji-picker-react";
import { useRef } from "react";
import {
  getFeedPosts,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  submitCommentForImage,
  getUserProfile,
  getCommentsForImage,
  checkPostSaved,
  likeComment,
  unlikeComment,
  deleteCommentById,
  getPostDetails,
  deleteUserImageById,
  followUser,
  unfollowUser,
  getSuggestedUsers,
} from "../../services/userService";

const HomeSidebar = () => {
  const [activeTab, setActiveTab] = useState("forYou");
  const [isActive, setIsActive] = useState(false);
  const [profileImage, setProfileImage] = useState(profilePicDefault);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComments, setNewComments] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [likesCount, setLikesCount] = useState({});
  const [currentFeedType, setCurrentFeedType] = useState("for_you");
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [showHeartAnimation, setShowHeartAnimation] = useState({});
  const [localComments, setLocalComments] = useState({});
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedGallery, setSelectedGallery] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [dialogComments, setDialogComments] = useState([]);
  const [dialogNewComment, setDialogNewComment] = useState("");
  const [dialogShowEmojiPicker, setDialogShowEmojiPicker] = useState(false);
  const [dialogLiked, setDialogLiked] = useState(false);
  const [dialogBookmarked, setDialogBookmarked] = useState(false);
  const [dialogLikesCount, setDialogLikesCount] = useState(0);
  const [dialogImageLoadingStates, setDialogImageLoadingStates] = useState({});
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [hoveredComment, setHoveredComment] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [feedMoreDialogOpen, setFeedMoreDialogOpen] = useState(false);
  const [selectedFeedPost, setSelectedFeedPost] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggestedUsers, setLoadingSuggestedUsers] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const { profileImage: currentUserProfileImage } = useContext(UserContext);
  const emojiRef = useRef(null);
  const dialogEmojiRef = useRef(null);

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const fetchPosts = useCallback(async (feedType = "for_you") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.log("Korisnik nije prijavljen, preskačem dohvaćanje objava.");
        return;
      }

      const data = await getFeedPosts(feedType);
      if (data.success) {
        setPosts(data.posts);
        setCurrentFeedType(feedType);
        setCurrentImageIndex({}); // Resetiraj indekse slika

        // Inicijaliziraj stanja za svaki post
        const initialLiked = {};
        const initialSaved = {};
        const initialLikesCount = {};

        data.posts.forEach((post) => {
          initialLiked[post.id] = post.user_liked || false;
          initialSaved[post.id] = post.user_saved || false;
          initialLikesCount[post.id] = post.likes_count || 0;
        });

        setLikedPosts(initialLiked);
        setSavedPosts(initialSaved);
        setLikesCount(initialLikesCount);
      }
    } catch (error) {
      console.error("Greška kod dohvaćanja objava:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const data = await getUserProfile();
        if (data.success && data.data.profile_image_url) {
          setProfileImage(`${data.data.profile_image_url}?t=${Date.now()}`);
        } else {
          setProfileImage(profilePicDefault);
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja profilne slike:", error);
        setProfileImage(profilePicDefault);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/get_user_profile/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.data);
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja trenutnog korisnika:", error);
      }
    };

    fetchProfileImage();
    fetchCurrentUser();
    fetchPosts();
    fetchSuggestedUsers();
  }, [fetchPosts]);

  // Event listener za osvježavanje feed-a nakon uploada nove slike
  useEffect(() => {
    const handleNewPostUploaded = () => {
      console.log("Nova slika uploadana, osvježavam feed...");
      fetchPosts(currentFeedType);
    };

    // Dodaj event listener za custom event
    window.addEventListener("newPostUploaded", handleNewPostUploaded);

    return () => {
      window.removeEventListener("newPostUploaded", handleNewPostUploaded);
    };
  }, [fetchPosts, currentFeedType]);

  // Dodaj useEffect za promjenu tab-a
  useEffect(() => {
    // Preskoči prvi load jer se već poziva u prvom useEffect
    if (posts.length === 0) return;

    const feedType = activeTab === "following" ? "following" : "for_you";

    // Provjeri da li se tip feed-a promijenio
    if (currentFeedType !== feedType) {
      // Prikaži progress bar i resetiraj stanje učitavanja slika
      setShowProgressBar(true);
      setImagesLoaded({});
      
      // Samo osvježavaj feed podatke, ne resetiraj cijelu komponentu
      const updateFeedOnly = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("authToken");

          if (!token) {
            console.log("Korisnik nije prijavljen, preskačem dohvaćanje objava.");
            return;
          }

          const data = await getFeedPosts(feedType);
          if (data.success) {
            setPosts(data.posts);
            setCurrentFeedType(feedType);
            setCurrentImageIndex({}); // Resetiraj indekse slika

            // Inicijaliziraj stanja za svaki post
            const initialLiked = {};
            const initialSaved = {};
            const initialLikesCount = {};

            data.posts.forEach((post) => {
              initialLiked[post.id] = post.user_liked || false;
              initialSaved[post.id] = post.user_saved || false;
              initialLikesCount[post.id] = post.likes_count || 0;
            });

            setLikedPosts(initialLiked);
            setSavedPosts(initialSaved);
            setLikesCount(initialLikesCount);

            // Fallback: prikaži slike nakon 2 sekunde čak i ako se ne učitaju
            setTimeout(() => {
              const fallbackImagesLoaded = {};
              data.posts.forEach(post => {
                fallbackImagesLoaded[post.id] = true;
              });
              setImagesLoaded(fallbackImagesLoaded);
            }, 2000);
          }
        } catch (error) {
          console.error("Greška kod dohvaćanja objava:", error);
        } finally {
          setLoading(false);
        }
      };

      updateFeedOnly();
    }
  }, [activeTab]);

  // Sakrij progress bar kada se sve slike učitaju ili nakon timeout-a
  useEffect(() => {
    if (showProgressBar && posts.length > 0) {
      const allImagesLoaded = posts.every(post => imagesLoaded[post.id]);
      if (allImagesLoaded) {
        setTimeout(() => {
          setShowProgressBar(false);
        }, 200); // Kratka pauza za bolji UX
      } else {
        // Timeout za slučaj da se slike ne učitaju
        const timeout = setTimeout(() => {
          setShowProgressBar(false);
          // Označi sve slike kao učitanu ako se ne učitaju u 5 sekundi
          const timeoutImagesLoaded = {};
          posts.forEach(post => {
            timeoutImagesLoaded[post.id] = true;
          });
          setImagesLoaded(timeoutImagesLoaded);
        }, 5000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [imagesLoaded, posts, showProgressBar]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ne zatvaraj ako se klikne na emoji picker ili emoji button
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target) &&
        !event.target.closest(".instagram-emoji-picker") &&
        !event.target.closest(".EmojiPickerReact")
      ) {
        setShowEmojiPicker({});
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setShowEmojiPicker({});
      }
    };

    const handleScroll = () => {
      setShowEmojiPicker({});
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Dialog emoji picker click outside handler
  useEffect(() => {
    const handleDialogClickOutside = (event) => {
      if (
        dialogEmojiRef.current &&
        !dialogEmojiRef.current.contains(event.target)
      ) {
        setDialogShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleDialogClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleDialogClickOutside);
    };
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);

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

  const handleLike = async (postId) => {
    try {
      const isLiked = likedPosts[postId];

      if (isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: !isLiked,
      }));

      setLikesCount((prev) => ({
        ...prev,
        [postId]: isLiked ? Math.max(0, prev[postId] - 1) : prev[postId] + 1,
      }));
    } catch (error) {
      console.error("Greška pri lajkanju objave:", error);
    }
  };

  const handleSave = async (postId) => {
    try {
      const isSaved = savedPosts[postId];

      if (isSaved) {
        await unsavePost(postId);
      } else {
        await savePost(postId);
      }

      setSavedPosts((prev) => ({
        ...prev,
        [postId]: !isSaved,
      }));
    } catch (error) {
      console.error("Greška pri spremanju objave:", error);
    }
  };

  const addEmoji = (emojiObject, postId) => {
    setNewComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || "") + emojiObject.emoji,
    }));
    // Ne zatvaraj emoji picker odmah - korisnik može dodati više emojia
    // setShowEmojiPicker((prev) => ({ ...prev, [postId]: false }));
  };

  const handleEmojiClick = (postId, event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    setShowEmojiPicker((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    // Postavi poziciju emoji pickera
    setTimeout(() => {
      const emojiPicker = document.querySelector(".instagram-emoji-picker");
      if (emojiPicker) {
        let top = rect.top - 360; // 420px iznad gumba (malo iznad ikonice)
        let left = rect.left; // 100px lijevo od gumba (više desno)

        // Provjeri da li se izlazi izvan ekrana
        if (top < 10) {
          top = rect.bottom + 10; // Postavi ispod gumba ako nema mjesta iznad
        }

        if (left < 10) {
          left = 10; // Minimalno 10px od lijevog ruba
        }

        // Odredi širinu emoji pickera na temelju veličine ekrana
        const pickerWidth =
          window.innerWidth <= 480 ? 280 : window.innerWidth <= 768 ? 300 : 350;

        if (left + pickerWidth > window.innerWidth) {
          left = window.innerWidth - pickerWidth - 10; // 10px margin
        }

        // Provjeri donju granicu ekrana
        const pickerHeight = 400; // maksimalna visina emoji pickera
        if (top + pickerHeight > window.innerHeight) {
          top = window.innerHeight - pickerHeight - 10; // 10px margin od donjeg ruba
        }

        emojiPicker.style.top = `${top}px`;
        emojiPicker.style.left = `${left}px`;
      }
    }, 0);
  };

  const nextImage = (postId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % totalImages,
    }));
  };

  const prevImage = (postId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  const submitComment = async (postId) => {
    const comment = newComments[postId];
    if (!comment || !comment.trim()) return;

    try {
      const data = await submitCommentForImage(postId, comment);

      if (data.success) {
        // Dodaj komentar u lokalni state
        const currentLocalComments = localComments[postId] || [];
        const newComment = {
          id: data.comment_id, // Koristi stvarni ID s backenda
          text: comment,
          username: currentUser?.username || "You",
          created_at: data.created_at || new Date().toISOString(),
          user_profile_image: currentUserProfileImage || profilePicDefault,
          likes_count: 0,
          user_liked: false,
        };

        setLocalComments((prev) => ({
          ...prev,
          [postId]: [...currentLocalComments, newComment],
        }));

        // Ako je dialog otvoren za ovaj post, ažuriraj i dialog komentare
        if (isImageDialogOpen && selectedImageId === postId) {
          setDialogComments((prevComments) => [newComment, ...prevComments]);
        }

      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      } else {
        console.error("Greška pri dodavanju komentara:", data.error);
      }
    } catch (error) {
      console.error("Greška pri dodavanju komentara:", error);
    }
  };

  const openImageDialog = async (post) => {
    const gallery =
      post.images && post.images.length > 0 ? post.images : [post.image_url];
    setSelectedGallery(gallery);
    setSelectedIndex(0);
    setSelectedImage(gallery[0]);
    setSelectedImageId(post.id);
    setSelectedPost(post);
    setIsImageDialogOpen(true);

    // Postavi like status
    setDialogLiked(likedPosts[post.id] || false);
    setDialogLikesCount(likesCount[post.id] || post.likes_count || 0);

    // Dohvati detalje o postu s likers podacima
    try {
      const postDetails = await getPostDetails(post.id);
      if (postDetails.success) {
        console.log("Post details with likers:", postDetails);
        // Ažuriraj selectedPost s likers podacima
        const updatedPost = {
          ...post,
          likers: postDetails.likers || [],
        };
        setSelectedPost(updatedPost);
        setDialogLikesCount(postDetails.likes_count || 0);

        // Koristi is_following iz post-a umjesto provjere likers
        if (post.username !== currentUser?.username) {
          console.log("Post is_following:", post.is_following);
          setIsFollowingUser(post.is_following || false);
        } else {
          setIsFollowingUser(false);
        }
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju detalja o postu:", error);
      setIsFollowingUser(false);
    }

    // Provjeri saved status
    try {
      const savedData = await checkPostSaved(post.id);
      if (savedData.success) {
        setDialogBookmarked(savedData.user_saved);
      }
    } catch (error) {
      console.error("Greška pri provjeri spremanja slike:", error);
    }

    // Dohvati komentare
    try {
      const data = await getCommentsForImage(post.id);
      if (data.success) {
        setDialogComments(data.comments);
      } else {
        console.error("Greška pri dohvaćanju komentara:", data.error);
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju komentara:", error.message);
    }
  };

  const closeImageDialog = () => {
    setIsImageDialogOpen(false);
    setSelectedImage(null);
    setSelectedPost(null);
    setDialogComments([]);
    setDialogNewComment("");
    setDialogShowEmojiPicker(false);
  };

  const dialogAddEmoji = (emojiObject) => {
    setDialogNewComment((prev) => prev + emojiObject.emoji);
    setDialogShowEmojiPicker(false);
  };

  const dialogSubmitComment = async () => {
    if (!dialogNewComment.trim()) return;

    try {
      const data = await submitCommentForImage(
        selectedImageId,
        dialogNewComment
      );
      if (data.success) {
        const newComment = {
          id: data.comment_id,
          user: currentUser?.username || "You",
          text: dialogNewComment,
          created_at: data.created_at,
          likes_count: 0,
          user_liked: false,
          user_profile_image: currentUserProfileImage || profilePicDefault,
        };

        // Ažuriraj dialog komentare
        setDialogComments((prevComments) => [newComment, ...prevComments]);

        // Ažuriraj lokalne komentare u feed-u
        setLocalComments((prev) => {
          const currentLocalComments = prev[selectedImageId] || [];
          return {
            ...prev,
            [selectedImageId]: [newComment, ...currentLocalComments],
          };
        });

        setDialogNewComment("");
      } else {
        console.error("Greška pri dodavanju komentara:", data.error);
      }
    } catch (error) {
      console.error("Greška pri dodavanju komentara:", error);
    }
  };

  const handleDialogImageLoad = (imageId) => {
    setDialogImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
  };

  const handleDialogImageError = (imageId) => {
    setDialogImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
  };

  const openCommentDialog = (commentId) => {
    setSelectedCommentId(commentId);
    setIsCommentDialogOpen(true);
  };

  const closeCommentDialog = () => {
    setIsCommentDialogOpen(false);
    setSelectedCommentId(null);
  };

  const deleteComment = async () => {
    if (!selectedCommentId) return;

    try {
      const data = await deleteCommentById(selectedCommentId);
      if (data.success) {
        // Ažuriraj komentare u dialog-u
        setDialogComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== selectedCommentId)
        );

        // Ažuriraj lokalne komentare u feed-u
        setLocalComments((prevLocalComments) => {
          const updatedLocalComments = { ...prevLocalComments };
          Object.keys(updatedLocalComments).forEach((postId) => {
            if (updatedLocalComments[postId]) {
              updatedLocalComments[postId] = updatedLocalComments[
                postId
              ].filter((comment) => comment.id !== selectedCommentId);
            }
          });
          return updatedLocalComments;
        });

        closeCommentDialog();
      } else {
        console.error("Greška pri brisanju komentara:", data.error);
      }
    } catch (error) {
      console.error("Greška pri slanju zahtjeva za brisanje komentara:", error);
    }
  };

  const openMoreDialog = () => setIsMoreDialogOpen(true);
  const closeMoreDialog = () => setIsMoreDialogOpen(false);

  const deleteUserImage = async () => {
    if (!selectedImageId) {
      console.error("Nema slike za brisanje!");
      return;
    }

    try {
      const data = await deleteUserImageById(selectedImageId);

      if (data.success) {
        console.log("Slika uspješno obrisana!");

        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== selectedImageId)
        );

        closeImageDialog();
        closeMoreDialog();
      } else {
        console.error("Greška pri brisanju slike:", data.error);
      }
    } catch (error) {
      console.error(
        "Greška prilikom slanja zahtjeva za brisanje slike:",
        error
      );
    }
  };

  const handleUnfollow = async () => {
    try {
      // Koristimo user_id koji je sada dostupan u selectedPost
      console.log("Attempting to unfollow user ID:", selectedPost?.user_id);
      const data = await unfollowUser(selectedPost?.user_id);
      if (data.success) {
        setIsFollowingUser(false);
        closeMoreDialog();
      } else {
        console.error("Greška pri otprati korisnika:", data.error);
      }
    } catch (error) {
      console.error("Greška pri otprati korisnika:", error);
    }
  };

  const openFeedMoreDialog = (post) => {
    setSelectedFeedPost(post);
    setFeedMoreDialogOpen(true);
  };

  const closeFeedMoreDialog = () => {
    setFeedMoreDialogOpen(false);
    setSelectedFeedPost(null);
  };

  const handleFeedUnfollow = async () => {
    try {
      console.log("Attempting to unfollow user ID:", selectedFeedPost?.user_id);
      const data = await unfollowUser(selectedFeedPost?.user_id);
      if (data.success) {
        // Ažuriraj posts array da reflektira promjenu
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === selectedFeedPost.id ? { ...p, is_following: false } : p
          )
        );
        closeFeedMoreDialog();
      } else {
        console.error("Greška pri otprati korisnika:", data.error);
      }
    } catch (error) {
      console.error("Greška pri otprati korisnika:", error);
    }
  };

  const handleFeedDeletePost = async () => {
    try {
      console.log("Attempting to delete post ID:", selectedFeedPost?.id);
      const data = await deleteUserImageById(selectedFeedPost?.id);
      if (data.success) {
        // Ukloni post iz posts array-a
        setPosts((prevPosts) =>
          prevPosts.filter((p) => p.id !== selectedFeedPost.id)
        );
        closeFeedMoreDialog();
      } else {
        console.error("Greška pri brisanju post-a:", data.error);
      }
    } catch (error) {
      console.error("Greška pri brisanju post-a:", error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      setLoadingSuggestedUsers(true);
      const data = await getSuggestedUsers();
      if (data.success) {
        setSuggestedUsers(data.users || []);
      } else {
        console.error('Greška pri dohvaćanju suggested korisnika');
      }
    } catch (error) {
      console.error('Greška pri dohvaćanju suggested korisnika:', error);
    } finally {
      setLoadingSuggestedUsers(false);
    }
  };

  const handleFollowSuggestedUser = async (userId) => {
    try {
      const user = suggestedUsers.find(u => u.id === userId);
      const isCurrentlyFollowing = user?.is_following;
      
      console.log('Kliknuo na korisnika:', userId);
      console.log('Trenutno stanje is_following:', isCurrentlyFollowing);
      
      const action = isCurrentlyFollowing ? unfollowUser : followUser;
      console.log('Pozivam funkciju:', isCurrentlyFollowing ? 'unfollowUser' : 'followUser');
      
      const data = await action(userId);
      console.log('Odgovor od servera:', data);

      if (data.success) {
        console.log('Operacija uspjela, ažuriram stanje...');
        setSuggestedUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => 
            user.id === userId 
              ? { ...user, is_following: !isCurrentlyFollowing }
              : user
          );
          console.log('Novo stanje korisnika:', updatedUsers.find(u => u.id === userId));
          return updatedUsers;
        });
      } else {
        console.error('Greška pri prati/otprati korisnika:', data.error);
      }
    } catch (error) {
      console.error('Greška pri prati/otprati korisnika:', error);
    }
  };

  const handleImageLoad = (postId) => {
    console.log(`Slika učitanu za post ${postId}`);
    setImagesLoaded((prev) => ({
      ...prev,
      [postId]: true,
    }));
  };

  const handleImageError = (postId) => {
    console.log(`Greška pri učitavanju slike za post ${postId}`);
    setImagesLoaded((prev) => ({
      ...prev,
      [postId]: true, // Označi kao učitanu i u slučaju greške
    }));
  };

  const handleDoubleClick = async (postId) => {
    // Ako već nije lajkano, lajkaj
    if (!likedPosts[postId]) {
      try {
        await likePost(postId);
        setLikedPosts((prev) => ({
          ...prev,
          [postId]: true,
        }));
        setLikesCount((prev) => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1,
        }));
      } catch (error) {
        console.error("Greška pri lajkanju objave:", error);
      }
    }

    // Prikaži animaciju srca
    setShowHeartAnimation((prev) => ({
      ...prev,
      [postId]: true,
    }));

    // Sakrij animaciju nakon 1 sekunde
    setTimeout(() => {
      setShowHeartAnimation((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }, 1000);
  };

  if (loading && posts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Instagram Progress Bar */}
      {showProgressBar && (
        <div className="instagram-progress-bar">
          <div className="progress-bar-fill"></div>
        </div>
      )}
      
      <div className="main-homeSidebar-container">
        <div className="left-homeSidebar-container">
      <div className="homeSidebar-header">
        <h2
              className={`forYou-text ${
                activeTab === "forYou" ? "active" : ""
              }`}
          onClick={() => setActiveTab("forYou")}
        >
          For you
        </h2>

        <h2
          className={`following-text ${
            activeTab === "following" ? "active" : ""
          }`}
          onClick={() => setActiveTab("following")}
        >
          Following
        </h2>
        <img src={heartPhoto} className="heart-photo-mobile"></img>
      </div>

      {(activeTab === "forYou" || activeTab === "following") && (
        <div className="main-story-container">
          <div className={`outer-circle ${isActive ? "active" : ""}`}>
            <div className="middle-circle"></div>

            <div className="story-container">
              <img src={profileImage} alt="Story" />{" "}
            </div>
          </div>
        </div>
      )}

      {/* Feed objava */}
      <div className="posts-feed">
        {posts.map((post) => (
          <div key={post.id} className="post-container">
            {/* Post header */}
            <div className="post-header">
              {!imagesLoaded[post.id] ? (
                <div className="post-header-skeleton">
                  <div className="skeleton-profile-pic"></div>
                  <div className="skeleton-text-lines">
                    <div className="skeleton-text-line short"></div>
                    <div className="skeleton-text-line medium"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="post-user-info">
                    <div className="post-profile-pic">
                      <img
                        src={post.user_profile_image || profilePicDefault}
                        alt="Profile"
                      />
                    </div>
                    <div className="post-user-details">
                      <div className="post-user-main">
                        <span className="post-username">{post.username}</span>
                        <span className="post-dot">•</span>
                        <span className="post-time">
                          {formatTimeAgo(post.created_at)}
                        </span>
                      </div>
                      {post.location && (
                        <div className="post-location">{post.location}</div>
                      )}
                    </div>
                  </div>
                  <div className="post-options">
                        <img
                          src={morePic}
                          alt="More options"
                          onClick={() => openFeedMoreDialog(post)}
                          style={{ cursor: "pointer" }}
                        />
                  </div>
                </>
              )}
            </div>

            {/* Post image */}
            <div className="post-image-container">
              {!imagesLoaded[post.id] && (
                <div className="image-skeleton">
                  <div className="skeleton-shimmer"></div>
                </div>
              )}
              {post.images && post.images.length > 1 ? (
                <div className="post-gallery">
                  {!imagesLoaded[post.id] && (
                    <div className="image-skeleton">
                      <div className="skeleton-shimmer"></div>
                    </div>
                  )}
                  <img
                    src={post.images[currentImageIndex[post.id] || 0]}
                    alt="Post"
                    className="post-image"
                    style={{
                      display: imagesLoaded[post.id] ? "block" : "none"
                    }}
                    onLoad={() => handleImageLoad(post.id)}
                    onError={() => handleImageError(post.id)}
                    onDoubleClick={() => handleDoubleClick(post.id)}
                    crossOrigin="anonymous"
                  />
                  {showHeartAnimation[post.id] && (
                    <div className="double-click-heart">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  )}
                  {post.images.length > 1 && (
                    <>
                      <div className="gallery-indicator">
                        <span className="gallery-dots">
                          {post.images.map((_, index) => (
                            <span
                              key={index}
                              className={`gallery-dot ${
                                index === (currentImageIndex[post.id] || 0)
                                  ? "active"
                                  : ""
                              }`}
                            />
                          ))}
                        </span>
                      </div>
                                             {(currentImageIndex[post.id] || 0) > 0 && (
                         <button
                           className="gallery-nav gallery-prev"
                           onClick={() =>
                             prevImage(post.id, post.images.length)
                           }
                         >
                           <img src={arrowBack} alt="Previous" />
                         </button>
                       )}
                       {(currentImageIndex[post.id] || 0) <
                         post.images.length - 1 && (
                         <button
                           className="gallery-nav gallery-next"
                           onClick={() =>
                             nextImage(post.id, post.images.length)
                           }
                         >
                           <img src={arrowForward} alt="Next" />
                         </button>
                       )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {!imagesLoaded[post.id] && (
                    <div className="image-skeleton">
                      <div className="skeleton-shimmer"></div>
                    </div>
                  )}
                  <img
                    src={
                      post.images && post.images.length > 0
                        ? post.images[0]
                        : post.image_url
                    }
                    alt="Post"
                    className="post-image"
                    style={{
                      display: imagesLoaded[post.id] ? "block" : "none"
                    }}
                    onLoad={() => handleImageLoad(post.id)}
                    onError={() => handleImageError(post.id)}
                    onDoubleClick={() => handleDoubleClick(post.id)}
                    crossOrigin="anonymous"
                  />
                  {showHeartAnimation[post.id] && (
                    <div className="double-click-heart">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Post actions */}
            <div className="post-actions">
              <div className="post-actions-left">
                <img
                  src={likedPosts[post.id] ? HeartActivePic : HeartPic}
                  alt="Like"
                  onClick={() => handleLike(post.id)}
                  className="action-icon"
                />
                <svg
                      aria-label="Comment"
                  className="action-icon"
                  fill="currentColor"
                      height="24"
                      role="img"
                  viewBox="0 0 24 24"
                      width="24"
                      style={{ color: "#262626", cursor: "pointer" }}
                      onClick={() => openImageDialog(post)}
                    >
                      <title>Comment</title>
                      <path
                        d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                </svg>
                <svg
                      aria-label="Share"
                  className="action-icon"
                  fill="currentColor"
                      height="24"
                      role="img"
                  viewBox="0 0 24 24"
                      width="24"
                  style={{ color: "#262626" }}
                >
                      <title>Share</title>
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
              <div className="post-actions-right">
                <img
                      src={
                        savedPosts[post.id] ? bookMarkPicActive : bookMarkPic
                      }
                  alt="Save"
                  onClick={() => handleSave(post.id)}
                  className="action-icon"
                />
              </div>
            </div>

            {/* Likes count */}
            <div className="post-likes">
              {likesCount[post.id] > 0 && (
                    <span className="likes-count">
                      {likesCount[post.id]} likes
                    </span>
              )}
            </div>

            {/* Post caption */}
            <div className="post-caption">
              <span className="caption-username">{post.username}</span>
              <span className="caption-text">{post.description}</span>
            </div>

            {/* Comments section */}
            <div className="post-comments">
                  {(post.comments && post.comments.length > 0) ||
                  (localComments[post.id] &&
                    localComments[post.id].length > 0) ? (
                <div className="comments-preview">
                      <span
                        className="view-all-comments"
                        onClick={() => openImageDialog(post)}
                        style={{ cursor: "pointer" }}
                      >
                        View{" "}
                        {(post.comments ? post.comments.length : 0) +
                          (localComments[post.id]
                            ? localComments[post.id].length
                            : 0)}{" "}
                        comment
                        {(post.comments ? post.comments.length : 0) +
                          (localComments[post.id]
                            ? localComments[post.id].length
                            : 0) !==
                        1
                          ? "s"
                          : ""}
                  </span>
                </div>
                  ) : null}
            </div>

            {/* Add comment */}
            <div className="add-comment-section">
              <InputTextarea
                value={newComments[post.id] || ""}
                onChange={(e) =>
                  setNewComments((prev) => ({
                    ...prev,
                    [post.id]: e.target.value,
                  }))
                }
                placeholder="Add a comment..."
                className="comment-input"
                autoResize
              />
              {newComments[post.id]?.trim() && (
                <button
                  className="post-comment-btn active"
                  onClick={() => submitComment(post.id)}
                >
                  Post
                </button>
              )}
                  <div className="instagram-emoji-container" ref={emojiRef}>
                    <button
                      className="instagram-emoji-button"
                      onClick={(e) => handleEmojiClick(post.id, e)}
                      type="button"
                    >
                      <svg viewBox="0 0 24 24">
                  <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z" />
                </svg>
                    </button>
                {showEmojiPicker[post.id] && (
                      <div
                        className="instagram-emoji-picker"
                        onClick={(e) => e.stopPropagation()}
                      >
                    <EmojiPicker
                      onEmojiClick={(emoji) => addEmoji(emoji, post.id)}
                          searchPlaceholder="Search emoji..."
                          width="100%"
                          height="350px"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
        </div>
        <div className="right-homeSidebar-container">
          <div className="suggested-users-container">
            {/* Current User Profile */}
            <div className="current-user-profile">
              <div className="current-user-info">
                <div className="current-user-avatar">
                  <img src={profileImage || profilePicDefault} alt="Profile" />
                </div>
                <div className="current-user-details">
                  <div className="current-user-username">
                    {currentUser?.username || "bettyzigo"}
                  </div>
                  <div className="current-user-description">Betty Žigo</div>
                </div>
              </div>
              <button className="switch-button">Switch</button>
            </div>
            <div className="suggested-users-list">
              <div className="suggested-users-header">
                <p style={{fontWeight:"600", fontSize:"14px", color:"#737373"}}>Suggested for you</p>
                <p className="see-all-text">See all</p>
              </div>
              
              {loadingSuggestedUsers ? null : (
                <div className="suggested-users-items">
                  {suggestedUsers.map((user) => (
                    <div key={user.id} className="suggested-user-item">
                      <div className="suggested-user-info">
                        <div className="suggested-user-avatar">
                          <img 
                            src={user.profile_image_url || profilePicDefault} 
                            alt={user.username} 
                          />
                        </div>
                        <div className="suggested-user-details">
                          <div className="suggested-user-username">
                            {user.username}
                          </div>
                          {user.mutual_followers && user.mutual_followers.length > 0 && (
                            <div className="suggested-user-mutual">
                              {user.mutual_followers.length === 1 
                                ? `Followed by ${user.mutual_followers[0]}`
                                : `Followed by ${user.mutual_followers[0]} + ${user.mutual_followers.length - 1} more`
                              }
                            </div>
                          )}
                        </div>
                      </div>
                      <button 
                        className={`follow-button ${user.is_following ? 'following' : ''}`}
                        onClick={() => handleFollowSuggestedUser(user.id)}
                      >
                        {user.is_following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Footer */}
              <div className="suggested-users-footer">
                <div className="footer-links">
                  <span>About</span>
                  <span>·</span>
                  <span>Help</span>
                  <span>·</span>
                  <span>Press</span>
                  <span>·</span>
                  <span>API</span>
                  <span>·</span>
                  <span>Jobs</span>
                  <span>·</span>
                  <span>Privacy</span>
                  <span>·</span>
                  <span>Terms</span>
                  <span>·</span>
                  <span>Locations</span>
                  <span>·</span>
                  <span>Language</span>
                  <span>·</span>
                  <span>Meta Verified</span>
                </div>
                <div className="footer-copyright">
                  © 2025 INSTAGRAM FROM META
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog
        visible={isImageDialogOpen}
        onHide={closeImageDialog}
        dismissableMask
        className="custom-image-dialog"
        style={{ borderRadius: "25px" }}
      >
        <div className="image-dialog-container">
          {/* X ikona za zatvaranje */}
          {isImageDialogOpen && (
            <button
              className="close-dialog-button"
              onClick={closeImageDialog}
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                background: "transparent",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 9999,
                color: "white",
              }}
            >
              <svg
                aria-label="Close"
                fill="currentColor"
                height="16"
                role="img"
                viewBox="0 0 24 24"
                width="16"
              >
                <polyline
                  fill="none"
                  points="20.643 3.357 3.357 20.643"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></polyline>
                <polyline
                  fill="none"
                  points="3.357 3.357 20.643 20.643"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></polyline>
              </svg>
            </button>
          )}
          <div
            className="left-image-container"
            style={{ position: "relative" }}
          >
            {selectedImage && (
              <>
                {dialogImageLoadingStates["dialog"] !== false && (
                  <div className="image-skeleton-dialog">
                    <div className="skeleton-shimmer"></div>
                  </div>
                )}
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="full-image"
                  style={{
                    display:
                      dialogImageLoadingStates["dialog"] === false
                        ? "block"
                        : "none",
                  }}
                  onLoad={() => handleDialogImageLoad("dialog")}
                  onError={() => handleDialogImageError("dialog")}
                />
                {selectedGallery.length > 1 && selectedIndex > 0 && (
                  <button
                    aria-label="Previous"
                    onClick={() => {
                      const nextIndex = Math.max(0, selectedIndex - 1);
                      setSelectedIndex(nextIndex);
                      setSelectedImage(selectedGallery[nextIndex]);
                    }}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 18l-6-6 6-6"
                        stroke="#000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                {selectedGallery.length > 1 &&
                  selectedIndex < selectedGallery.length - 1 && (
                    <button
                      aria-label="Next"
                      onClick={() => {
                        const nextIndex = Math.min(
                          selectedGallery.length - 1,
                          selectedIndex + 1
                        );
                        setSelectedIndex(nextIndex);
                        setSelectedImage(selectedGallery[nextIndex]);
                      }}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,0.95)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="#000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                {/* dots */}
                {selectedGallery.length > 1 && (
                  <div className="up-dots">
                    {selectedGallery.map((_, i) => (
                      <span
                        key={i}
                        className={`up-dot ${
                          i === selectedIndex ? "active" : ""
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="right-empty-container">
            <div className="header_post_container">
              <div className="profile_picture_header_post_container">
                <div className="outer-circle-create">
                  <div className="story-container-create">
                    <img
                      src={
                        selectedPost?.user_profile_image || profilePicDefault
                      }
                      alt="User Profile"
                    />
                  </div>
                </div>
                <div className="right-container-username_second">
                  <p className="create-username-text">
                    {selectedPost?.username || "Unknown User"}
                  </p>
                  {selectedPost?.location && (
                    <p className="post-location-text">
                      {selectedPost.location}
                    </p>
                  )}
                </div>
              </div>
              <div
                className="more_post_container"
                onClick={() => setIsMoreDialogOpen(true)}
              >
                <img className="morePic" src={morePic} alt="More" />
              </div>
            </div>
            <div className="dialog-divider-second"></div>
            <div className="main_post_container">
              <div className="profile_picture_main_post_container">
                <div className="right-container-username">
                  <div className="comments-container">
                    {selectedPost?.description && (
                      <div className="single_comment description">
                        <img
                          src={
                            selectedPost?.user_profile_image ||
                            profilePicDefault
                          }
                          alt="User Profile"
                          className="comment_profile_pic"
                        />
                        <p className="description_text">
                          <strong className="comment_username">
                            {selectedPost?.username}
                          </strong>{" "}
                          {selectedPost?.description}
                        </p>
                      </div>
                    )}

                    {dialogComments.map((comment, index) => (
                      <div key={comment.id}>
                        <div className="single_comment">
                          <img
                            src={
                              comment.user_profile_image || profilePicDefault
                            }
                            alt="User Profile"
                            className="comment_profile_pic"
                          />
                          <p className="comment_text">
                            <strong className="comment_username">
                              {comment.user}
                            </strong>{" "}
                            {comment.text}
                          </p>
                          <div className="heart_container_comments">
                            <img
                              className="commentsPicHeart"
                              src={
                                comment.user_liked ? HeartActivePic : HeartPic
                              }
                              alt="Fav"
                              onClick={async () => {
                                try {
                                  if (comment.user_liked) {
                                    await unlikeComment(comment.id);
                                  } else {
                                    await likeComment(comment.id);
                                  }

                                  // Osvježi komentare
                                  const data = await getCommentsForImage(
                                    selectedImageId
                                  );
                                  if (data.success) {
                                    setDialogComments(data.comments);
                                  }
                                } catch (error) {
                                  console.error(
                                    "Greška pri lajkanju komentara:",
                                    error
                                  );
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                        <div
                          className="comment_meta_row"
                          onMouseEnter={() => setHoveredComment(index)}
                          onMouseLeave={() => setHoveredComment(null)}
                        >
                          <span className="comment_time">
                            {comment.created_at
                              ? formatTimeAgo(comment.created_at)
                              : "2h"}
                          </span>
                          <span className="comment_likes">
                            {comment.likes_count > 0
                              ? `${comment.likes_count} likes`
                              : ""}
                          </span>
                          <span className="comment_reply">Reply</span>
                          {hoveredComment === index && (
                            <img
                              src={morePic}
                              alt="More Options"
                              className="comment_more_icon"
                              onClick={() => openCommentDialog(comment.id)}
                              style={{ cursor: "pointer" }}
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    {!selectedPost?.description &&
                      dialogComments.length === 0 && (
                        <div className="no-comment-container">
                          <p className="no-comment-text">No comments yet.</p>
                          <p className="start-conv-text">
                            Start the conversation.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
            <div className="dialog-divider-second"></div>
            <div
              className="footer_post_container"
              style={{ display: "flex", flexDirection: "column", gap: "0em" }}
            >
              <div
                className="first-footer-container"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <img
                    className="footerPicHeart"
                    src={dialogLiked ? HeartActivePic : HeartPic}
                    alt="Fav"
                    onClick={async () => {
                      try {
                        if (dialogLiked) {
                          await unlikePost(selectedImageId);
                          setDialogLikesCount((prev) => Math.max(0, prev - 1));
                        } else {
                          await likePost(selectedImageId);
                          setDialogLikesCount((prev) => prev + 1);
                        }
                        setDialogLiked((prev) => !prev);

                        // Ažuriraj podatke u listi slika
                        setPosts((prevPosts) =>
                          prevPosts.map((post) =>
                            post.id === selectedImageId
                              ? {
                                  ...post,
                                  user_liked: !dialogLiked,
                                  likes_count: dialogLiked
                                    ? Math.max(0, post.likes_count - 1)
                                    : post.likes_count + 1,
                                  // Ažuriraj likers array
                                  likers: dialogLiked
                                    ? post.likers.filter(
                                        (liker) =>
                                          liker.username !==
                                          currentUser?.username
                                      )
                                    : [
                                        {
                                          username: currentUser?.username,
                                          created_at: new Date().toISOString(),
                                        },
                                        ...post.likers,
                                      ],
                                }
                              : post
                          )
                        );
                      } catch (error) {
                        console.error("Greška pri lajkanju slike:", error);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <svg
                    aria-label="Comment"
                    className="x1lliihq x1n2onr6 x5n08af"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    style={{ cursor: "pointer" }}
                  >
                    <title>Comment</title>
                    <path
                      d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                  <svg
                    aria-label="Share"
                    className="x1lliihq x1n2onr6 xyb1xck"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    style={{ cursor: "pointer" }}
                  >
                    <title>Share</title>
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
                <img
                  className="footerPicBookMark"
                  src={dialogBookmarked ? bookMarkPicActive : bookMarkPic}
                  alt="Save"
                  onClick={async () => {
                    try {
                      if (dialogBookmarked) {
                        await unsavePost(selectedImageId);
                        setDialogBookmarked(false);
                      } else {
                        await savePost(selectedImageId);
                        setDialogBookmarked(true);
                      }
                    } catch (error) {
                      console.error("Greška pri spremanju slike:", error);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
              </div>
              <div>
                <p className="likedBy-text">
                  {dialogLikesCount > 0
                    ? (() => {
                        // Koristi podatke iz selectedPost koji sadrži likers
                        const likers = selectedPost?.likers || [];

                        if (likers.length === 0) {
                          // Ako nema likers podataka, prikaži samo broj lajkova
                          return `${dialogLikesCount} likes`;
                        }

                        // Provjeri je li trenutni korisnik prvi u listi (zadnji lajkao)
                        const firstLiker = likers[0];
                        const isCurrentUserFirst =
                          firstLiker.username === currentUser?.username;

                        if (likers.length === 1) {
                          // Samo jedan lajk
                          if (isCurrentUserFirst) {
                            return "Liked by me";
                          } else {
                            return `Liked by ${firstLiker.username}`;
                          }
                        } else {
                          // Više lajkova
                          if (isCurrentUserFirst) {
                            return `Liked by me and ${
                              likers.length - 1
                            } others`;
                          } else {
                            return `Liked by ${firstLiker.username} and ${
                              likers.length - 1
                            } others`;
                          }
                        }
                      })()
                    : ""}
                </p>
                {selectedPost?.created_at && (
                  <p
                    className="post-time-text"
                    style={{
                      fontSize: "12px",
                      color: "#737373",
                      marginLeft: "1.2em",
                      marginTop: "-1em",
                    }}
                  >
                    {formatTimeAgo(selectedPost.created_at)}
                  </p>
                )}
              </div>
            </div>
            <div className="comment_post_container">
              <div className="comment-input-wrapper">
                <div
                  className="emoji-container_second"
                  ref={dialogEmojiRef}
                  style={{ position: "relative" }}
                >
                  <svg
                    aria-label="Emoji"
                    className="emoji-icon"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialogShowEmojiPicker((prev) => !prev);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <title>Emoji</title>
                    <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                  </svg>

                  {dialogShowEmojiPicker && (
                    <div className="emoji-picker">
                      <EmojiPicker onEmojiClick={dialogAddEmoji} />
                    </div>
                  )}
                </div>

                <div className="add-comment-container">
                  <textarea
                    className="add-comment-textarea"
                    value={dialogNewComment}
                    onChange={(e) => setDialogNewComment(e.target.value)}
                    placeholder="Add a comment..."
                  />
                </div>
                <div className="post_thePost_cont">
                  <p
                    className={`post_theComment_text ${
                      dialogNewComment.trim() ? "enabled" : "disabled"
                    }`}
                    onClick={
                      dialogNewComment.trim() ? dialogSubmitComment : null
                    }
                    style={{
                      opacity: dialogNewComment.trim() ? "1" : "0.5",
                      cursor: dialogNewComment.trim() ? "pointer" : "default",
                    }}
                  >
                    Post
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        visible={isCommentDialogOpen}
        onHide={closeCommentDialog}
        className="custom-comment-dialog"
        dismissableMask
        style={{
          width: "0em",
          borderRadius: "25px",
          marginTop: "-2em",
          marginLeft: "-30em",
        }}
      >
        <div className="comment-dialog-content">
          {(() => {
            // Provjeri je li komentar od trenutnog korisnika
            const selectedComment = dialogComments.find(
              (comment) => comment.id === selectedCommentId
            );
            const isOwnComment =
              selectedComment?.user === currentUser?.username;

            if (isOwnComment) {
              // Za vlastite komentare - prikaži Report i Delete
              return (
                <>
                  <p className="comment-dialog-option delete-option">Report</p>
                  <p
                    className="comment-dialog-option delete-option"
                    onClick={deleteComment}
                  >
                    Delete
                  </p>
                  <p
                    className="comment-dialog-option"
                    onClick={closeCommentDialog}
                  >
                    Cancel
                  </p>
                </>
              );
            } else {
              // Za komentare drugih korisnika - prikaži Report i Cancel
              return (
                <>
                  <p className="comment-dialog-option delete-option">Report</p>
                  <p
                    className="comment-dialog-option"
                    onClick={closeCommentDialog}
                  >
                    Cancel
                  </p>
                </>
              );
            }
          })()}
        </div>
      </Dialog>

      {/* Feed More Dialog */}
      <Dialog
        visible={feedMoreDialogOpen}
        onHide={closeFeedMoreDialog}
        className="custom-more-dialog"
        dismissableMask
        style={{ width: "25em", borderRadius: "25px" }}
      >
        <div className="more-dialog-content">
          {(() => {
            // Provjeri je li slika od trenutnog korisnika
            const isOwnPost =
              selectedFeedPost?.username === currentUser?.username;

            if (isOwnPost) {
              // Za vlastite slike - prikaži opcije kao u ProfileSidebar.js
              return (
                <>
                  <p
                    className="more-dialog-option delete-option"
                    onClick={handleFeedDeletePost}
                  >
                    Delete
                  </p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Edit</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">
                    Unhide like count to others
                  </p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Turn on commenting</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Go to post</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Share to...</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Copy link</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Embed</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">About this account</p>
                  <div className="dialog-divider-second"></div>
                  <p
                    className="more-dialog-option cancel-option"
                    onClick={closeFeedMoreDialog}
                  >
                    Cancel
                  </p>
                </>
              );
            } else {
              // Za tuđe slike - prikaži opcije ovisno o follow statusu
              if (selectedFeedPost?.is_following) {
                // Korisnika pratim - prikaži Unfollow opciju
                return (
                  <>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                    >
                      Report
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                      onClick={handleFeedUnfollow}
                    >
                      Unfollow
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Add to favourites</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Go to post</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Share to...</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Copy link</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Embed</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">About this account</p>
                    <div className="dialog-divider-second"></div>
                    <p
                      className="more-dialog-option"
                      onClick={closeFeedMoreDialog}
                    >
                      Cancel
                    </p>
                  </>
                );
              } else {
                // Korisnika ne pratim - prikaži Not interested opciju
                return (
                  <>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                    >
                      Report
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Not interested</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Go to post</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Share to...</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Copy link</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Embed</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">About this account</p>
                    <div className="dialog-divider-second"></div>
                    <p
                      className="more-dialog-option"
                      onClick={closeFeedMoreDialog}
                    >
                      Cancel
                    </p>
                  </>
                );
              }
            }
          })()}
        </div>
      </Dialog>

      {/* More Dialog */}
      <Dialog
        visible={isMoreDialogOpen}
        onHide={closeMoreDialog}
        className="custom-more-dialog"
        dismissableMask
        style={{ width: "25em", borderRadius: "25px" }}
      >
        <div className="more-dialog-content">
          {(() => {
            // Provjeri je li slika od trenutnog korisnika
            const isOwnPost = selectedPost?.username === currentUser?.username;

            if (isOwnPost) {
              // Za vlastite slike - prikaži opcije kao u ProfileSidebar.js
              return (
                <>
                  <p
                    className="more-dialog-option delete-option"
                    onClick={deleteUserImage}
                  >
                    Delete
                  </p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Edit</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">
                    Unhide like count to others
                  </p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Turn on commenting</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Go to post</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Share to...</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Copy link</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">Embed</p>
                  <div className="dialog-divider-second"></div>
                  <p className="more-dialog-option">About this account</p>
                  <div className="dialog-divider-second"></div>
                  <p
                    className="more-dialog-option cancel-option"
                    onClick={closeMoreDialog}
                  >
                    Cancel
                  </p>
                </>
              );
            } else {
              // Za tuđe slike - prikaži opcije ovisno o follow statusu
              if (isFollowingUser) {
                // Korisnika pratim - prikaži opcije kao na slici
                return (
                  <>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                    >
                      Report
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                      onClick={handleUnfollow}
                    >
                      Unfollow
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Add to favourites</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Go to post</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Share to...</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Copy link</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Embed</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">About this account</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option" onClick={closeMoreDialog}>
                      Cancel
                    </p>
                  </>
                );
              } else {
                // Korisnika ne pratim - prikaži Not interested opciju
                return (
                  <>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                    >
                      Report
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Not interested</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Go to post</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Share to...</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Copy link</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Embed</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">About this account</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option" onClick={closeMoreDialog}>
                      Cancel
                    </p>
                  </>
                );
              }
            }
          })()}
        </div>
      </Dialog>
    </>
  );
};

export default HomeSidebar;
