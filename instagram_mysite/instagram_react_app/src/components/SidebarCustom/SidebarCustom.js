import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { UserContext } from "../UserContext";
import "../SidebarCustom/SidebarCustom.css";
import { Sidebar } from "primereact/sidebar";
import { Dialog } from "primereact/dialog";
import logoPhoto from "../../imgs/instagram-wordmark.svg";
import galleryPhoto from "../../imgs/gallery.png";
import zoomInPhoto from "../../imgs/zoom-in.png";
import homePhoto from "../../imgs/home.png";
import instaPhoto from "../../imgs/instagram.png";
import homePhotoOutline from "../../imgs/home_outline.png";
import searchPhotot from "../../imgs/search.png";
import profilePicDefault from "../../imgs/profile-user (1).png";
import searchPhotoBold from "../../imgs/search_outline.png";
import directionPhotot from "../../imgs/direction.png";
import BoldExplorePhoto from "../../imgs/directionBold.png";
import reelsPhoto from "../../imgs/reels.png";
import reelsPhotoBold from "../../imgs/reelBold.png";
import sendPhoto from "../../imgs/send.png";
import sendPhotoBold from "../../imgs/sendBold.png";
import heartPhoto from "../../imgs/heart.png";
import heartPhotoBold from "../../imgs/heartBold.png";
import createPhoto from "../../imgs/create.png";
import userPhoto from "../../imgs/user.png";
import userPhotoBold from "../../imgs/userBold.png";
import threadsPhoto from "../../imgs/threads.png";
import hamburgerPhoto from "../../imgs/hamburger.png";
import hamburgerPhotoBold from "../../imgs/hambBold.png";
import settingsPhoto from "../../imgs/settings.png";
import activityPhoto from "../../imgs/activity.png";
import savedPhoto from "../../imgs/saved.png";
import modePhoto from "../../imgs/mode.png";
import problemPhoto from "../../imgs/problem.png";
import { useNavigate, useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";

import profilePic from "../../imgs/profilna.jpg";
import { useAuth } from "../../contexts/AuthContext";

import { InputText } from "primereact/inputtext";
import { ListBox } from "primereact/listbox";
import { Skeleton } from "primereact/skeleton";
import {
  logoutUser,
  getUserProfile,
  getUserImages,
  searchUsers,
} from "../../services/userService";
import CreatePostDialog from "./CreatePostDialog/CreatePostDialog";

const SidebarCustom = ({ onHide, onImageUploaded }) => {
  const toast = useRef(null);
  const {
    profileImage,
    setProfileImage,
    showSearchOverlay,
    setShowSearchOverlay,
    showMessagesOverlay,
    setShowMessagesOverlay,
  } = useContext(UserContext);

  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  
  // State machine za popovere/dijaloge
  const [activePopover, setActivePopover] = useState(null); // 'create' | 'more' | 'meta' | null
  const togglePopover = useCallback((key) => {
    setActivePopover(prev => (prev === key ? null : key));
  }, []);

  const [userImages, setUserImages] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const [showSearchContainer, setShowSearchContainer] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();

      logout();
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      navigate("/login");
    } catch (err) {
      console.error("Greška prilikom odjave:", err);
    }
  };

  // Custom hook za mobile detection
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
    useEffect(() => {
      const mq = window.matchMedia('(max-width: 768px)');
      const onChange = () => setIsMobile(mq.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }, []);
    return isMobile;
  };

  const isMobile = useIsMobile();

  // Provjeri je li trenutna ruta Messages stranica
  const isMessagesPage = () => {
    return location.pathname === "/home/messages";
  };

  const isActive = (path) => location.pathname === path;

  const handleCreateClick = useCallback(() => {
    // Ako smo na Messages stranici, ne zatvaraj Messages overlay
    if (!isMessagesPage()) {
      setShowMessagesOverlay(false);
    }
    togglePopover('create');
  }, [isMessagesPage, togglePopover]);

  const handleMoreClick = useCallback(() => {
    // Ako smo na Messages stranici, ne zatvaraj Messages overlay
    if (!isMessagesPage()) {
      setShowMessagesOverlay(false);
    }
    togglePopover('more');
  }, [isMessagesPage, togglePopover]);

  const handleAlsoFromMetaClick = useCallback(() => {
    // Ako smo na Messages stranici, ne zatvaraj Messages overlay
    if (!isMessagesPage()) {
      setShowMessagesOverlay(false);
    }
    togglePopover('meta');
  }, [isMessagesPage, togglePopover]);

  const handlePostClick = () => {
    setActivePopover(null);
    setShowCreatePopup(true);
  };

  const handleAIClick = () => {
    setActivePopover(null);
    window.open(
      "https://aistudio.instagram.com/create/?utm_source=ig_web_nav_create",
      "_blank"
    );
  };

  const handleMetaAIClick = () => {
    setActivePopover(null);
    window.open("https://www.meta.ai/?utm_source=ig_web_nav", "_blank");
  };

  const handleThreadsClick = () => {
    setActivePopover(null);
    navigate("/home/threads");
  };

  const handleAIStudioClick = () => {
    setActivePopover(null);
    window.open(
      "https://aistudio.instagram.com/?utm_source=ig_web_nav",
      "_blank"
    );
  };
  const moreBtnRef = useRef(null);
  const createBtnRef = useRef(null);
  const alsoFromMetaBtnRef = useRef(null);

  // Custom hook za klik izvan
  const useOnClickOutside = (refs, handler, enabled) => {
    useEffect(() => {
      if (!enabled) return;
      const listener = (e) => {
        if (refs.some(r => r.current?.contains(e.target))) return;
        handler(e);
      };
      document.addEventListener('click', listener);
      return () => document.removeEventListener('click', listener);
    }, [refs, handler, enabled]);
  };

  // Korištenje custom hook-a
  useOnClickOutside(
    [moreBtnRef, createBtnRef, alsoFromMetaBtnRef], 
    () => setActivePopover(null), 
    !!activePopover
  );

  // ESC tipka za zatvaranje overlay-a
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowSearchOverlay(false);
        // Ako smo na Messages stranici, ne zatvaraj Messages overlay
        if (!isMessagesPage()) {
          setShowMessagesOverlay(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Klik izvan Search dialog-a za zatvaranje
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchOverlay) {
        const searchDialog = document.querySelector(".search-dialog");
        const sidebar = document.querySelector(".p-sidebar");

        // Provjeri je li klik izvan Search dialog-a i nije na sidebar-u
        if (
          searchDialog &&
          !searchDialog.contains(event.target) &&
          sidebar &&
          !sidebar.contains(event.target)
        ) {
          setShowSearchOverlay(false);
          setSearchTerm("");
        }
      }
    };

    if (showSearchOverlay) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchOverlay]);

  // Zatvaranje Messages overlay-a kada se promijeni ruta
  useEffect(() => {
    if (showMessagesOverlay && !isActive("/home/messages")) {
      setShowMessagesOverlay(false);
    }
    // Ako smo na Messages stranici, osiguraj da je Messages overlay aktivan
    if (isActive("/home/messages") && !showMessagesOverlay) {
      setShowMessagesOverlay(true);
    }
  }, [location.pathname, showMessagesOverlay]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getUserImages();

        if (data.success) {
          setUserImages(data.images);
        } else {
          console.error("Failed to load images:", data.error);
        }
      } catch (error) {
        console.error("Error fetching images:", error.message);
      }
    };

    fetchImages();
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const handleSidebarHide = (e) => {
    console.log("Sidebar onHide triggered, but keeping it visible.");

    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setIsSidebarVisible(true);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        if (data.success) {
          setUserData(data.data);

          if (!data.data.profile_image_url) {
            setProfileImage(profilePicDefault);
          } else {
            setProfileImage(`${data.data.profile_image_url}?t=${Date.now()}`);
          }
        } else {
          console.error("Greška u podatku:", data.error);
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja korisničkog profila:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!searchTerm) { 
      setUsers([]); 
      setLoading(false); 
      return; 
    }
    
    let cancelled = false;
    setLoading(true);
    
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

  const hasCustomProfileImage =
    profileImage &&
    profileImage !== "" &&
    profileImage !== "null" &&
    profileImage !== profilePicDefault;

  // Custom hook za recent searches
  const useRecentSearches = (userId, limit = 10) => {
    const storageKey = `recentSearches_${userId}`;
    const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'));
    
    const add = useCallback((user) => {
      setRecent(prev => {
        const next = [user, ...prev.filter(x => x.id !== user.id)].slice(0, limit);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    }, [limit, storageKey]);
    
    const clear = useCallback(() => {
      localStorage.removeItem(storageKey);
      setRecent([]);
    }, [storageKey]);
    
    const remove = useCallback((id) => {
      setRecent(prev => {
        const next = prev.filter(x => x.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    }, [storageKey]);

    // Ažuriraj recent searches kada se korisnik promijeni
    useEffect(() => {
      const saved = localStorage.getItem(storageKey);
      setRecent(saved ? JSON.parse(saved) : []);
    }, [userId, storageKey]);

    return { recent, add, remove, clear };
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser.id;
  const { recent: recentSearches, add: addToRecent, remove: removeFromRecent, clear: clearRecentSearches } = useRecentSearches(userId);

  return (
    <>
      <div className="card flex" style={{ height: "100vh" }}>
        <Sidebar
          visible={isSidebarVisible}
          style={{
            backgroundColor: "white",
            width: showSearchOverlay || showMessagesOverlay ? "5em" : "15em",
            transition: "width 0.3s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100vh",
            zIndex: 1500,
          }}
          modal={false}
          showCloseIcon={false}
          onHide={handleSidebarHide}
        >
          {showSearchOverlay || showMessagesOverlay ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "0.5em 0",
                paddingBottom: "2em",
                cursor: "pointer",
                borderRadius: "8px",
                height: "1em",
                margin: "0.5em",
                transition: "background-color 0.2s ease",
              }}
              onClick={() => {
                setShowMessagesOverlay(false);
                navigate("/home");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f2f2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg
                aria-label="Instagram"
                className="photo_sidebar_insta"
                fill="currentColor"
                height="24"
                role="img"
                viewBox="0 0 24 24"
                width="24"
                style={{ color: "#000000" }}
              >
                <path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.043-.379 3.408 3.408 0 0 1-1.264-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.511 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.638 1 9.013 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .511 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.638 22.988 9.013 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.511 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.362 23 14.987 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.511-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.362 1.012 14.987 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z"></path>
              </svg>
            </div>
          ) : (
            <div
              className="logo-instagram-cont"
              style={{
                cursor: "pointer",
                backgroundColor: "transparent",
              }}
              onClick={() => {
                setShowMessagesOverlay(false);
                navigate("/home");
                window.location.reload();
              }}
            >
              <img
                className="logo_sidebar"
                src={isMobile ? instaPhoto : logoPhoto}
                alt="Logo"
              />{" "}
            </div>
          )}

          <div
            className="sidebar-main-cont"
            style={{
              alignItems:
                showSearchOverlay || showMessagesOverlay
                  ? "center"
                  : "flex-start",
              width: "100%",
              marginTop: "1.5em",
              gap: "0.2em",
            }}
          >
            <div
              className={`home-cont ${isActive("/home") ? "active" : ""}`}
              onClick={() => {
                setShowMessagesOverlay(false);
                navigate("/home");
              }}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "2em 0 0 0",
              }}
            >
              {isActive("/home") &&
              !showSearchOverlay &&
              !showMessagesOverlay ? (
                <svg
                  aria-label="Home"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Home</title>
                  <path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l10-9.543a1.001 1.001 0 0 1 1.38 0l10 9.543a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z"></path>
                </svg>
              ) : (
                <svg
                  aria-label="Home"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Home</title>
                  <path
                    d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              )}
              {!showSearchOverlay && !showMessagesOverlay && (
                <p
                  className="sidebar-text"
                  style={{ fontWeight: isActive("/home") ? "bold" : "normal" }}
                >
                  Home
                </p>
              )}
            </div>

            {/* Search */}
            <div
              className="other-sidebar-cont"
              onClick={() => {
                // Ako je Search već otvoren, zatvori ga
                if (showSearchOverlay) {
                  setShowSearchOverlay(false);
                  setSearchTerm("");
                  return;
                }

                // Ako smo na Messages stranici, ne zatvaraj Messages overlay
                if (!isMessagesPage()) {
                  setShowMessagesOverlay(false);
                }
                setShowSearchOverlay(true);
              }}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              {showSearchOverlay ? (
                <svg
                  aria-label="Search"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Search</title>
                  <path
                    d="M18.5 10.5a8 8 0 1 1-8-8 8 8 0 0 1 8 8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  ></path>
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    x1="16.511"
                    x2="21.643"
                    y1="16.511"
                    y2="21.643"
                  ></line>
                </svg>
              ) : (
                <svg
                  aria-label="Search"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Search</title>
                  <path
                    d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z"
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
                    x1="16.511"
                    x2="22"
                    y1="16.511"
                    y2="22"
                  ></line>
                </svg>
              )}
              {!showSearchOverlay && !showMessagesOverlay && (
                <p className="sidebar-text">Search</p>
              )}
            </div>

            {/* Explore */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/explore") ? "active" : ""
              }`}
              onClick={() => {
                // Ako smo na Messages stranici, ne zatvaraj Messages overlay
                if (!isMessagesPage()) {
                  setShowMessagesOverlay(false);
                }
                navigate("/home/explore");
              }}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              {isActive("/home/explore") &&
              !showSearchOverlay &&
              !showMessagesOverlay ? (
                <svg
                  aria-label="Explore"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Explore</title>
                  <path d="m13.173 13.164 1.491-3.829-3.83 1.49ZM12.001.5a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12.001.5Zm5.35 7.443-2.478 6.369a1 1 0 0 1-.57.569l-6.36 2.47a1 1 0 0 1-1.294-1.294l2.48-6.369a1 1 0 0 1 .57-.569l6.359-2.47a1 1 0 0 1 1.294 1.294Z"></path>
                </svg>
              ) : (
                <svg
                  aria-label="Explore"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Explore</title>
                  <polygon
                    fill="none"
                    points="13.941 13.953 7.581 16.424 10.06 10.056 16.42 7.585 13.941 13.953"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></polygon>
                  <polygon
                    fillRule="evenodd"
                    points="10.06 10.056 13.949 13.945 7.581 16.424 10.06 10.056"
                  ></polygon>
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
                </svg>
              )}
              {!showSearchOverlay && !showMessagesOverlay && (
                <p className="sidebar-text">Explore</p>
              )}
            </div>

            {/* Reels */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/reels") ? "active" : ""
              }`}
              onClick={() => {
                // Ako smo na Messages stranici, ne zatvaraj Messages overlay
                if (!isMessagesPage()) {
                  setShowMessagesOverlay(false);
                }
                navigate("/home/reels");
              }}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              {isActive("/home/reels") &&
              !showSearchOverlay &&
              !showMessagesOverlay ? (
                <svg
                  aria-label="Reels"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Reels</title>
                  <path
                    d="m12.823 1 2.974 5.002h-5.58l-2.65-4.971c.206-.013.419-.022.642-.027L8.55 1Zm2.327 0h.298c3.06 0 4.468.754 5.64 1.887a6.007 6.007 0 0 1 1.596 2.82l.07.295h-4.629L15.15 1Zm-9.667.377L7.95 6.002H1.244a6.01 6.01 0 0 1 3.942-4.53Zm9.735 12.834-4.545-2.624a.909.909 0 0 0-1.356.668l-.008.12v5.248a.91.91 0 0 0 1.255.84l.109-.053 4.545-2.624a.909.909 0 0 0 .1-1.507l-.1-.068-4.545-2.624Zm-14.2-6.209h21.964l.015.36.003.189v6.899c0 3.061-.755 4.469-1.888 5.64-1.151 1.114-2.5 1.856-5.33 1.909l-.334.003H8.551c-3.06 0-4.467-.755-5.64-1.889-1.114-1.15-1.854-2.498-1.908-5.33L1 15.45V8.551l.003-.189Z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              ) : (
                <svg
                  aria-label="Reels"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Reels</title>
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    x1="2.049"
                    x2="21.95"
                    y1="7.002"
                    y2="7.002"
                  ></line>
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    x1="13.504"
                    x2="16.362"
                    y1="2.001"
                    y2="7.002"
                  ></line>
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    x1="7.207"
                    x2="10.002"
                    y1="2.11"
                    y2="7.002"
                  ></line>
                  <path
                    d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                  <path
                    d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0Z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              )}
              {!showSearchOverlay && !showMessagesOverlay && (
                <p className="sidebar-text">Reels</p>
              )}
            </div>

            {/* Messages */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/messages") ? "active" : ""
              }`}
              onClick={() => {
                setShowMessagesOverlay(true);
                navigate("/home/messages");
              }}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              {isActive("/home/messages") &&
              !showSearchOverlay &&
              !showMessagesOverlay ? (
                <svg
                  aria-label="Direct"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Direct</title>
                  <path
                    d="M22.91 2.388a.69.69 0 0 0-.597-.347l-20.625.002a.687.687 0 0 0-.482 1.178L7.26 9.16a.686.686 0 0 0 .778.128l7.612-3.657a.723.723 0 0 1 .937.248.688.688 0 0 1-.225.932l-7.144 4.52a.69.69 0 0 0-.3.743l2.102 8.692a.687.687 0 0 0 .566.518.655.655 0 0 0 .103.008.686.686 0 0 0 .59-.337L22.903 3.08a.688.688 0 0 0 .007-.692"
                    fillRule="evenodd"
                  ></path>
                </svg>
              ) : (
                <svg
                  aria-label="Direct"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Direct</title>
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
              )}
              {!showSearchOverlay && !showMessagesOverlay && (
                <p className="sidebar-text">Messages</p>
              )}
            </div>

            {/* Notifications */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/notifications") ? "active" : ""
              }`}
              onClick={() => {
                // Ako smo na Messages stranici, ne zatvaraj Messages overlay
                if (!isMessagesPage()) {
                  setShowMessagesOverlay(false);
                }
                navigate("/home/notifications");
              }}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              {isActive("/home/notifications") &&
              !showSearchOverlay &&
              !showMessagesOverlay ? (
                <svg
                  aria-label="Notifications"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Notifications</title>
                  <path d="M17.075 1.987a5.852 5.852 0 0 0-5.07 2.66l-.008.012-.01-.014a5.878 5.878 0 0 0-5.062-2.658A6.719 6.719 0 0 0 .5 8.952c0 3.514 2.581 5.757 5.077 7.927.302.262.607.527.91.797l1.089.973c2.112 1.89 3.149 2.813 3.642 3.133a1.438 1.438 0 0 0 1.564 0c.472-.306 1.334-1.07 3.755-3.234l.978-.874c.314-.28.631-.555.945-.827 2.478-2.15 5.04-4.372 5.04-7.895a6.719 6.719 0 0 0-6.425-6.965Z"></path>
                </svg>
              ) : (
                <svg
                  aria-label="Notifications"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Notifications</title>
                  <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path>
                </svg>
              )}
              {!showSearchOverlay && !showMessagesOverlay && (
                <p className="sidebar-text">Notifications</p>
              )}
            </div>

            {/* Create */}
            <div
              className={`other-sidebar-cont ${
                activePopover === 'create' ? "active" : ""
              }`}
              ref={createBtnRef}
              onClick={handleCreateClick}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              <svg
                aria-label="New post"
                className="photo_sidebar"
                fill="currentColor"
                height="24"
                role="img"
                viewBox="0 0 24 24"
                width="24"
                style={{
                  color: "#000000",
                }}
              >
                <title>New post</title>
                <path
                  d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z"
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
                  x1="6.545"
                  x2="17.455"
                  y1="12.001"
                  y2="12.001"
                ></line>
                <line
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  x1="12.003"
                  x2="12.003"
                  y1="6.545"
                  y2="17.455"
                ></line>
              </svg>
              {!showSearchOverlay && !showMessagesOverlay && (
                <p className="sidebar-text">Create</p>
              )}
            </div>

            {/* Profile */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/profile") ? "active" : ""
              }`}
              onClick={() => {
                // Ako smo na Messages stranici, ne zatvaraj Messages overlay
                if (!isMessagesPage()) {
                  setShowMessagesOverlay(false);
                }
                navigate("/home/profile");
              }}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              <img
                key={profileImage || "default"}
                className="photo_sidebar"
                style={{
                  borderRadius: "50%",
                  height: "2.5em",
                  width: "2.5em",
                  border:
                    isActive("/home/profile") && hasCustomProfileImage
                      ? "1.5px solid #000"
                      : "none",
                }}
                src={
                  hasCustomProfileImage
                    ? profileImage
                    : isActive("/home/profile") && !showSearchOverlay
                    ? userPhotoBold
                    : userPhoto
                }
                alt="Profile"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    isActive("/home/profile") && !showSearchOverlay
                      ? userPhotoBold
                      : userPhoto;
                }}
              />

              {!showSearchOverlay && !showMessagesOverlay && (
                <p className="sidebar-text">Profile</p>
              )}
            </div>
          </div>
          <div
            className="sidebar-footer-cont"
            style={{
              alignItems:
                showSearchOverlay || showMessagesOverlay
                  ? "center"
                  : "flex-start",
              paddingLeft:
                showSearchOverlay || showMessagesOverlay ? "0" : "1em",
            }}
          >
            {/* More */}
            <div>
              <Toast ref={toast} />
                              <div
                  ref={moreBtnRef}
                  className={`other-sidebar-cont ${activePopover === 'more' ? "active" : ""}`} // Aktivna klasa
                onClick={handleMoreClick}
                style={{
                  cursor: "pointer",
                  width:
                    showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                  justifyContent:
                    showSearchOverlay || showMessagesOverlay
                      ? "center"
                      : "flex-start",
                  paddingLeft:
                    showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                  margin:
                    showSearchOverlay || showMessagesOverlay
                      ? "0.5em 0"
                      : "0.7em 0 0 0",
                }}
              >
                {activePopover === 'more' ? (
                  <svg
                    aria-label="Settings"
                    className="photo_sidebar"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    style={{
                      color: "#000000",
                    }}
                  >
                    <title>Settings</title>
                    <path d="M3.5 6.5h17a1.5 1.5 0 0 0 0-3h-17a1.5 1.5 0 0 0 0 3Zm17 4h-17a1.5 1.5 0 0 0 0 3h17a1.5 1.5 0 0 0 0-3Zm0 7h-17a1.5 1.5 0 0 0 0 3h17a1.5 1.5 0 0 0 0-3Z"></path>
                  </svg>
                ) : (
                  <svg
                    aria-label="Settings"
                    className="photo_sidebar"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                    style={{
                      color: "#000000",
                    }}
                  >
                    <title>Settings</title>
                    <line
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      x1="3"
                      x2="21"
                      y1="4"
                      y2="4"
                    ></line>
                    <line
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      x1="3"
                      x2="21"
                      y1="12"
                      y2="12"
                    ></line>
                    <line
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      x1="3"
                      x2="21"
                      y1="20"
                      y2="20"
                    ></line>
                  </svg>
                )}
                {!showSearchOverlay && !showMessagesOverlay && (
                  <p
                    className="sidebar-text"
                    style={{
                      fontWeight: activePopover === 'more' ? "bold" : "normal", // Bold tekst kad je aktivan
                    }}
                  >
                    More
                  </p>
                )}
              </div>
            </div>

            {/* Also from Meta */}
            <div
              className={`other-sidebar-cont ${
                activePopover === 'meta' ? "active" : ""
              }`}
              ref={alsoFromMetaBtnRef}
              onClick={handleAlsoFromMetaClick}
              style={{
                cursor: "pointer",
                width:
                  showSearchOverlay || showMessagesOverlay ? "3em" : "19.5em",
                justifyContent:
                  showSearchOverlay || showMessagesOverlay
                    ? "center"
                    : "flex-start",
                paddingLeft:
                  showSearchOverlay || showMessagesOverlay ? "0" : "1em",
                margin:
                  showSearchOverlay || showMessagesOverlay
                    ? "0.5em 0"
                    : "0.7em 0 0 0",
              }}
            >
              {activePopover === 'meta' ? (
                <svg
                  aria-label="Also from Meta"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Also from Meta</title>
                  <path d="M14.5 11h-5A2.503 2.503 0 0 1 7 8.5v-5C7 2.122 8.121 1 9.5 1h5C15.879 1 17 2.122 17 3.5v5c0 1.378-1.121 2.5-2.5 2.5ZM8.499 23h-5a2.503 2.503 0 0 1-2.5-2.5v-5c0-1.378 1.12-2.5 2.5-2.5h5c1.379 0 2.5 1.122 2.5 2.5v5c0 1.378-1.121 2.5-2.5 2.5Zm12 0h-5a2.503 2.503 0 0 1-2.5-2.5v-5c0-1.378 1.12-2.5 2.5-2.5h5c1.379 0 2.5 1.122 2.5 2.5v5c0 1.378-1.121 2.5-2.5 2.5Z"></path>
                </svg>
              ) : (
                <svg
                  aria-label="Also from Meta"
                  className="photo_sidebar"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{
                    color: "#000000",
                  }}
                >
                  <title>Also from Meta</title>
                  <path d="M9.5 11h5c1.379 0 2.5-1.122 2.5-2.5v-5C17 2.122 15.879 1 14.5 1h-5A2.503 2.503 0 0 0 7 3.5v5C7 9.878 8.12 11 9.5 11ZM9 3.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-5ZM8.499 13h-5a2.503 2.503 0 0 0-2.5 2.5v5c0 1.378 1.12 2.5 2.5 2.5h5c1.379 0 2.5-1.122 2.5-2.5v-5c0-1.378-1.121-2.5-2.5-2.5Zm.5 7.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5Zm11.5-7.5h-5a2.503 2.503 0 0 0-2.5 2.5v5c0 1.378 1.12 2.5 2.5 2.5h5c1.379 0 2.5-1.122 2.5-2.5v-5c0-1.378-1.121-2.5-2.5-2.5Zm.5 7.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5Z"></path>
                </svg>
              )}
              {!showSearchOverlay && !showMessagesOverlay && (
                <p
                  className="sidebar-text"
                  style={{
                    fontWeight: activePopover === 'meta' ? "bold" : "normal",
                  }}
                >
                  Also from Meta
                </p>
              )}
            </div>
          </div>
        </Sidebar>
      </div>

      {/* Search Dialog */}
      {showSearchOverlay && (
        <Dialog
          className="search-dialog"
          maskClassName="search-dialog-mask"
          header="Search"
          headerClassName="search-header"
          visible={showSearchOverlay}
          style={{
            position: "fixed",
            top: 0,
            left: "5em",
            width: "415px",
            maxWidth: "415px",
            minHeight: "100vh",
            height: "100vh",
            boxSizing: "border-box",
            margin: 0,
            padding: 0,
            border: "none",
            zIndex: 1000,
            borderRadius: "4px",
          }}
          contentStyle={{
            width: "100%",
            minHeight: "100vh",
            height: "100vh",
            boxSizing: "border-box",
            margin: 0,
            padding: 0,
            pointerEvents: "auto",
          }}
          onHide={() => {
            setShowSearchOverlay(false);
            setShowMessagesOverlay(false);
            setSearchTerm("");
          }}
          dismissableMask
          maskStyle={{
            background: "rgba(0, 0, 0, 0)",
            pointerEvents: "none",
          }}
        >
          <>
            <div className="search-container" style={{ padding: "1em" }}>
              {/* Search input s ikonom */}
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  ref={inputRef}
                  className="search-input"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  style={{
                    width: "100%",
                    paddingLeft: isInputFocused ? "1em" : "2em",
                  }}
                />
                {!isInputFocused && (
                  <i
                    className="pi pi-search"
                    style={{
                      position: "absolute",
                      left: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#aaa",
                    }}
                  ></i>
                )}
                {isInputFocused &&
                  (loading ? (
                    <i
                      className="pi pi-spinner pi-spin"
                      style={{
                        position: "absolute",
                        right: "1em",
                        top: "34%",
                        transform: "translateY(-50%)",
                        color: "#aaa",
                      }}
                    ></i>
                  ) : (
                    <i
                      className="pi pi-times-circle"
                      style={{
                        position: "absolute",
                        right: "1em",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#aaa",
                        cursor: "pointer",
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchTerm("");
                        inputRef.current && inputRef.current.focus();
                      }}
                    ></i>
                  ))}
              </div>
              {/* Breaker linija ispod inputa */}
              <hr
                style={{
                  width: "27em",
                  border: 0,
                  borderTop: "1px solid #e0e0e0",
                  margin: "1.5em 0 1em 0",
                  marginLeft: "-2em",
                }}
              />

              {/* Recent sekcija - prikazuje se samo kad je searchTerm prazan */}
              {!searchTerm ? (
                <div
                  style={{
                    width: "99%",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1em",
                    }}
                  >
                    <h3
                      style={{ fontWeight: 600, fontSize: "15px", margin: 0 }}
                    >
                      Recent
                    </h3>
                    {recentSearches.length > 0 && (
                      <span
                        style={{
                          color: "#385185",
                          fontWeight: 500,
                          fontSize: "15px",
                          cursor: "pointer",
                          color: "#3143E3",
                        }}
                        onClick={() => {
                                                      clearRecentSearches();
                        }}
                      >
                        Clear All
                      </span>
                    )}
                  </div>
                  {recentSearches.length === 0 ? (
                    <div
                      style={{
                        color: "#888",
                        textAlign: "center",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "60vh",
                        fontWeight: "500",
                        width: "100%",
                      }}
                    >
                      No recent searches.
                    </div>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {recentSearches.map((user) => (
                        <li
                          key={user.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1em",
                            padding: "0.7em 2em",
                            cursor: "pointer",
                            position: "relative",
                            transition: "background-color 0.2s ease",
                            margin: "0 -2em",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#eeeeee";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                          }}
                          onClick={() => {
                            addToRecent(user);
                            setSearchTerm("");
                            setIsInputFocused(false);
                            setShowSearchOverlay(false);
                            setShowMessagesOverlay(false);
                            navigate(`/home/users/${user.id}/profile`);
                          }}
                        >
                          <img
                            src={user.profile_image || profilePicDefault}
                            alt={user.username}
                            style={{
                              width: "2.2em",
                              height: "2.2em",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = profilePicDefault;
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 500, backgroundColor: "transparent" }}>
                              {user.username}
                            </div>
                            <div style={{ color: "#888", fontSize: "0.95em" }}>
                              {user.full_name}
                            </div>
                          </div>
                          {/* X ikona za brisanje pojedinog usera */}
                          <i
                            className="pi pi-times"
                            style={{
                              position: "absolute",
                              right: "35px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#888",
                              fontSize: "1em",
                              cursor: "pointer",
                              padding: "0.2em",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentUser = JSON.parse(
                                localStorage.getItem("user") || "{}"
                              );
                              const userId = currentUser.id;
                              removeFromRecent(user.id);
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {/* Lista korisnika iz pretrage */}
              {searchTerm && loading && (
                <div style={{ marginTop: "2em" }}>
                  {[1, 2, 3].map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "1.2em",
                        gap: "1em",
                      }}
                    >
                      {/* Lijevo krug (profilna) */}
                      <Skeleton shape="circle" width="2.5em" height="2.5em" />
                      {/* Desno dva skeletona jedan ispod drugog */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5em",
                        }}
                      >
                        <Skeleton height="1.1em" width="70%" />
                        <Skeleton height="0.9em" width="40%" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && !loading && users.length > 0 && (
                <div className="main-list-search-cont">
                  <ul className="mt-2" style={{ listStyleType: "none" }}>
                    {users.map((user) => (
                      <li
                        key={user.id}
                        onClick={() => {
                          addToRecent(user);
                          setShowSearchOverlay(false);
                          setShowMessagesOverlay(false);
                          navigate(`/home/users/${user.id}/profile`);
                        }}
                        className="list-item"
                      >
                        <div className="left-list-search-container">
                          <img
                            src={
                              user.profile_image
                                ? user.profile_image
                                : profilePicDefault
                            }
                            alt={user.username}
                            className="w-8 h-8 rounded-full mr-2 profile-image-search"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = userPhoto;
                            }} // Ako slika ne postoji, koristi default sliku
                          />
                        </div>

                        <div className="right-list-search-container">
                          <span className="font-bold username-search-text">
                            {user.username}
                          </span>

                          <span className="text-sm  full-name-search-text">
                            {user.full_name}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ako nema rezultata */}
              {!loading && searchTerm.length > 0 && users.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "68vh",
                  }}
                >
                  <p
                    style={{
                      textAlign: "center",
                      color: "#666",
                      fontSize: "14px",
                      margin: 0,
                    }}
                  >
                    No results found.
                  </p>
                </div>
              )}
            </div>
          </>
        </Dialog>
      )}

      {/* Messages Dialog */}

      {window.innerWidth <= 768 && (
        <div className="mobile-bottom-bar">
          <div onClick={() => navigate("/home")}>
            <img src={homePhotoOutline} alt="Home" />
          </div>
          <div onClick={() => navigate("/home/explore")}>
            <img src={directionPhotot} alt="Explore" />
          </div>
          <div onClick={() => navigate("/home/reels")}>
            <img src={reelsPhoto} alt="Reels" />
          </div>
          <div onClick={() => togglePopover('create')}>
            <img src={createPhoto} alt="Create" />
          </div>
          <div onClick={() => navigate("/home/messages")}>
            <img src={sendPhoto} alt="Messages" />
          </div>
          <div onClick={() => navigate("/home/profile")}>
            <img
              src={hasCustomProfileImage ? profileImage : userPhoto}
              alt="Profile"
              style={{ borderRadius: "50%", height: "1.8em", width: "1.8em" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = userPhoto;
              }}
            />
          </div>
        </div>
      )}

      {/* Also from Meta Dialog */}
      <Dialog
        visible={activePopover === 'meta'}
        onHide={() => setActivePopover(null)}
        style={{
          width: "250px",
          maxWidth: "90vw",
          position: "fixed",
          bottom: "80px",
          left: "15px",
          borderRadius: "12px",
        }}
        contentStyle={{
          padding: "8px 5px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        headerStyle={{
          display: "none",
        }}
        footerStyle={{
          display: "none",
        }}
        maskStyle={{
          background: "transparent !important",
          pointerEvents: "none",
        }}
        dismissableMask={false}
        onMaskClick={() => setActivePopover(null)}
      >
        <div>
          {/* Meta AI Option */}
          <div
            className="more-options"
            onClick={handleMetaAIClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <svg
              aria-label=""
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title></title>
              <path d="M12,4c4.4184,0,8,3.5816,8,8,0,4.4176-3.5816,8-8,8s-8-3.5824-8-8c0-4.4184,3.5816-8,8-8M12,1C5.93458,1,1,5.93458,1,12s4.93458,11,11,11,11-4.93458,11-11S18.06542,1,12,1h0Z"></path>
            </svg>
            <span style={{ color: "#000000", fontSize: "14px" }}>Meta AI</span>
          </div>

          {/* AI Studio Option */}
          <div
            className="more-options"
            onClick={handleAIStudioClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "transparent",
            }}
          >
            <svg
              aria-label=""
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title></title>
              <path
                clipRule="evenodd"
                d="M3 17C3 19.2091 4.79086 21 7 21C9.20914 21 11 19.2091 11 17C11 14.7909 9.20914 13 7 13C4.79086 13 3 14.7909 3 17ZM7 19C5.89543 19 5 18.1046 5 17C5 15.8954 5.89543 15 7 15C8.10457 15 9 15.8954 9 17C9 18.1046 8.10457 19 7 19Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
              <path
                clipRrule="evenodd"
                d="M3 7C3 9.20914 4.79086 11 7 11C9.20914 11 11 9.20914 11 7C11 4.79086 9.20914 3 7 3C4.79086 3 3 4.79086 3 7ZM7 9C5.89543 9 5 8.10457 5 7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7C9 8.10457 8.10457 9 7 9Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
              <path
                clipRule="evenodd"
                d="M13 17C13 19.2091 14.7909 21 17 21C19.2091 21 21 19.2091 21 17C21 14.7909 19.2091 13 17 13C14.7909 13 13 14.7909 13 17ZM17 19C15.8954 19 15 18.1046 15 17C15 15.8954 15.8954 15 17 15C18.1046 15 19 15.8954 19 17C19 18.1046 18.1046 19 17 19Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
              <path
                d="M16.441 10.6266C16.6549 11.1245 17.3625 11.1245 17.5765 10.6266L18.3939 8.72443C18.4564 8.57898 18.5725 8.46316 18.7183 8.40081L20.6256 7.58558C21.1248 7.37223 21.1248 6.66646 20.6256 6.45313L18.7183 5.63788C18.5725 5.57554 18.4564 5.45972 18.3939 5.31427L17.5598 3.37331C17.3484 2.88143 16.6518 2.87387 16.4297 3.36107L15.5339 5.32659C15.471 5.46452 15.3594 5.57455 15.2203 5.63554L13.369 6.44802C12.8744 6.66499 12.8778 7.36588 13.3744 7.57819L15.299 8.40081C15.4449 8.46316 15.5611 8.57898 15.6235 8.72443L16.441 10.6266Z"
                fill="currentColor"
              ></path>
            </svg>
            <span style={{ color: "#000000", fontSize: "14px" }}>
              AI Studio
            </span>
          </div>
          {/* Threads Option */}
          <div
            className="more-options"
            onClick={handleThreadsClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <svg
              aria-label=""
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 192 192"
              width="24"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title></title>
              <path
                className="xcslo1z"
                d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"
              ></path>
            </svg>
            <span style={{ color: "#000000", fontSize: "14px" }}>Threads</span>
          </div>
        </div>
      </Dialog>

      {/* Create Options Dialog */}
      <Dialog
        visible={activePopover === 'create'}
        onHide={() => setActivePopover(null)}
        style={{
          width: "195px",
          maxWidth: "90vw",
          position: "fixed",
          bottom: showMessagesOverlay ? "158px" : "180px",
          left: "15px",
          borderRadius: "7px",
        }}
        contentStyle={{
          padding: "8px 11px",
          borderRadius: "7px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        headerStyle={{
          display: "none",
        }}
        footerStyle={{
          display: "none",
        }}
        maskStyle={{
          background: "transparent !important",
          pointerEvents: "none",
        }}
        dismissableMask={false}
        onMaskClick={() => setActivePopover(null)}
      >
        <div>
          {/* Post Option */}
          <div
            className="more-options"
            onClick={handlePostClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5em",
              cursor: "pointer",
              backgroundColor: "transparent",
              marginBottom: "5px",
            }}
          >
            <span style={{ color: "#000000", fontSize: "16px" }}>Post</span>
            <svg
              aria-label="Post"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
              style={{ color: "#000000" }}
            >
              <title>Post</title>
              <path d="m18.509 14.757-4.285-2.474a.857.857 0 0 0-1.286.743v4.948a.857.857 0 0 0 1.286.742l4.285-2.474a.857.857 0 0 0 0-1.485ZM5.225 3.977a1.25 1.25 0 1 0 1.25 1.25 1.25 1.25 0 0 0-1.25-1.25ZM19.5 7.5h-3v-3a4.004 4.004 0 0 0-4-4h-8a4.004 4.004 0 0 0-4 4v8a4.004 4.004 0 0 0 4 4h3v3a4.004 4.004 0 0 0 4 4h8a4.004 4.004 0 0 0 4-4v-8a4.004 4.004 0 0 0-4-4Zm-12 7h-3a1.997 1.997 0 0 1-1.882-1.349l2.607-2.607L7.5 12.819Zm.23-4.28L6.41 8.9a1.679 1.679 0 0 0-2.37 0L2.5 10.44V4.5a2.003 2.003 0 0 1 2-2h8a2.003 2.003 0 0 1 2 2v3h-3a3.992 3.992 0 0 0-3.77 2.72ZM21.5 19.5a2.003 2.003 0 0 1-2 2h-8a2.003 2.003 0 0 1-2-2v-8a2.003 2.003 0 0 1 2-2h8a2.003 2.003 0 0 1 2 2Z"></path>
            </svg>
          </div>
          <div
            style={{
              borderBottom: "1px solid #e0e0e0",
              marginLeft: "-1em",
              width: "200px",
            }}
          ></div>

          {/* AI Option */}
          <div
            className="more-options"
            onClick={handleAIClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5em",
              cursor: "pointer",
              backgroundColor: "transparent",
              marginTop: "5px",
            }}
          >
            <span style={{ color: "#000000", fontSize: "16px" }}>AI</span>
            <svg
              aria-label="AI"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
              style={{ color: "#000000" }}
            >
              <title>AI</title>
              <path
                clipRule="evenodd"
                d="M3 17a4 4 0 1 0 8 0 4 4 0 0 0-8 0Zm4 2a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM3 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0Zm4 2a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm6 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Zm4 2a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
              <path
                d="M16.441 10.627a.618.618 0 0 0 1.136 0l.817-1.903a.617.617 0 0 1 .324-.323l1.908-.815a.616.616 0 0 0 0-1.133l-1.908-.815a.617.617 0 0 1-.324-.324l-.834-1.94a.618.618 0 0 0-1.13-.013l-.896 1.966a.617.617 0 0 1-.314.309l-1.851.812a.615.615 0 0 0 .005 1.13l1.925.823a.616.616 0 0 1 .325.323l.817 1.903Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        </div>
      </Dialog>

      {/* More Dialog */}
      <Dialog
        visible={activePopover === 'more'}
        onHide={() => setActivePopover(null)}
        style={{
          width: "260px",
          maxWidth: "90vw",
          position: "fixed",
          bottom: "130px",
          left: "15px",
          borderRadius: "12px",
        }}
        contentStyle={{
          padding: "8px 8px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        headerStyle={{
          display: "none",
        }}
        footerStyle={{
          display: "none",
        }}
        maskStyle={{
          background: "transparent !important",
          pointerEvents: "none",
        }}
        dismissableMask={false}
        onMaskClick={() => setActivePopover(null)}
      >
        <div>
          {/* Settings Option */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
            className="more-options"
          >
            <svg
              aria-label="Settings"
              fill="currentColor"
              height="18"
              role="img"
              viewBox="0 0 24 24"
              width="18"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title>Settings</title>
              <circle
                cx="12"
                cy="12"
                fill="none"
                r="8.635"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></circle>
              <path
                d="M14.232 3.656a1.269 1.269 0 0 1-.796-.66L12.93 2h-1.86l-.505.996a1.269 1.269 0 0 1-.796.66m-.001 16.688a1.269 1.269 0 0 1 .796.66l.505.996h1.862l.505-.996a1.269 1.269 0 0 1 .796-.66M3.656 9.768a1.269 1.269 0 0 1-.66.796L2 11.07v1.862l.996.505a1.269 1.269 0 0 1 .66.796m16.688-.001a1.269 1.269 0 0 1 .66-.796L22 12.93v-1.86l-.996-.505a1.269 1.269 0 0 1-.66-.796M7.678 4.522a1.269 1.269 0 0 1-1.03.096l-1.06-.348L4.27 5.587l.348 1.062a1.269 1.269 0 0 1-.096 1.03m11.8 11.799a1.269 1.269 0 0 1 1.03-.096l1.06.348 1.318-1.317-.348-1.062a1.269 1.269 0 0 1 .096-1.03m-14.956.001a1.269 1.269 0 0 1 .096 1.03l-.348 1.06 1.317 1.318 1.062-.348a1.269 1.269 0 0 1 1.03.096m11.799-11.8a1.269 1.269 0 0 1-.096-1.03l.348-1.06-1.317-1.318-1.062.348a1.269 1.269 0 0 1-1.03-.096"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
            <span style={{ color: "#000000", fontSize: "14px" }}>Settings</span>
          </div>

          {/* Your Activity Option */}
          <div
            className="more-options"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <svg
              aria-label="Your Activity"
              fill="currentColor"
              height="18"
              role="img"
              viewBox="0 0 24 24"
              width="18"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title>Your Activity</title>
              <path d="M19 1H5C2.794 1 1 2.794 1 5v14c0 2.206 1.794 4 4 4h14c2.206 0 4-1.794 4-4V5c0-2.206-1.794-4-4-4ZM5 3h14c1.103 0 2 .897 2 2v6h-2.382l-2.723-5.447c-.34-.678-1.45-.678-1.79 0L9 15.764l-2.105-4.211A1 1 0 0 0 6 11H3V5c0-1.103.897-2 2-2Zm14 18H5c-1.103 0-2-.897-2-2v-6h2.382l2.723 5.447a1 1 0 0 0 1.79 0L15 8.236l2.105 4.211A1 1 0 0 0 18 13h3v6c0 1.103-.897 2-2 2Z"></path>
            </svg>
            <span
              style={{
                color: "#000000",
                fontSize: "14px",
                backgroundColor: "transparent",
              }}
            >
              Your Activity
            </span>
          </div>

          {/* Saved Option */}
          <div
            className="more-options"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <svg
              aria-label="Saved"
              fill="currentColor"
              height="18"
              role="img"
              viewBox="0 0 24 24"
              width="18"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title>Saved</title>
              <polygon
                fill="none"
                points="20 21 12 13.44 4 21 4 3 20 3 20 21"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></polygon>
            </svg>
            <span style={{ color: "#000000", fontSize: "14px" }}>Saved</span>
          </div>

          {/* Switch appearance Option */}
          <div
            className="more-options"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <svg
              aria-label="Theme icon"
              fill="currentColor"
              height="18"
              role="img"
              viewBox="0 0 24 24"
              width="18"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title>Theme icon</title>
              <path d="M12.00018,4.5a1,1,0,0,0,1-1V2a1,1,0,0,0-2,0V3.5A1.00005,1.00005,0,0,0,12.00018,4.5ZM5.28241,6.69678A.99989.99989,0,1,0,6.69647,5.28271l-1.06054-1.061A.99989.99989,0,0,0,4.22186,5.63574ZM4.50018,12a1,1,0,0,0-1-1h-1.5a1,1,0,0,0,0,2h1.5A1,1,0,0,0,4.50018,12Zm.78223,5.30322-1.06055,1.061a.99989.99989,0,1,0,1.41407,1.41406l1.06054-1.061a.99989.99989,0,0,0-1.41406-1.41407ZM12.00018,19.5a1.00005,1.00005,0,0,0-1,1V22a1,1,0,0,0,2,0V20.5A1,1,0,0,0,12.00018,19.5Zm6.71729-2.19678a.99989.99989,0,0,0-1.41406,1.41407l1.06054,1.061A.99989.99989,0,0,0,19.778,18.36426ZM22.00018,11h-1.5a1,1,0,0,0,0,2h1.5a1,1,0,0,0,0-2ZM18.01044,6.98975a.996.996,0,0,0,.707-.293l1.06055-1.061A.99989.99989,0,0,0,18.364,4.22168l-1.06054,1.061a1,1,0,0,0,.707,1.707ZM12.00018,6a6,6,0,1,0,6,6A6.00657,6.00657,0,0,0,12.00018,6Zm0,10a4,4,0,1,1,4-4A4.00458,4.00458,0,0,1,12.00018,16Z"></path>
            </svg>
            <span
              style={{
                color: "#000000",
                fontSize: "14px",
                backgroundColor: "transparent",
              }}
            >
              Switch appearance
            </span>
          </div>

          {/* Report a problem Option */}
          <div
            className="more-options"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <svg
              aria-label="Report a problem"
              fill="currentColor"
              height="18"
              role="img"
              viewBox="0 0 24 24"
              width="18"
              style={{ color: "#000000", marginRight: "12px" }}
            >
              <title>Report a problem</title>
              <path d="M18.001 1h-12a5.006 5.006 0 0 0-5 5v9.005a5.006 5.006 0 0 0 5 5h2.514l2.789 2.712a1 1 0 0 0 1.394 0l2.787-2.712h2.516a5.006 5.006 0 0 0 5-5V6a5.006 5.006 0 0 0-5-5Zm3 14.005a3.003 3.003 0 0 1-3 3h-2.936a1 1 0 0 0-.79.387l-2.274 2.212-2.276-2.212a1 1 0 0 0-.79-.387H6a3.003 3.003 0 0 1-3-3V6a3.003 3.003 0 0 1 3-3h12a3.003 3.003 0 0 1 3 3Zm-9-1.66a1.229 1.229 0 1 0 1.228 1.228A1.23 1.23 0 0 0 12 13.344Zm0-8.117a1.274 1.274 0 0 0-.933.396 1.108 1.108 0 0 0-.3.838l.347 4.861a.892.892 0 0 0 1.77 0l.348-4.86a1.106 1.106 0 0 0-.3-.838A1.272 1.272 0 0 0 12 5.228Z"></path>
            </svg>
            <span style={{ color: "#000000", fontSize: "14px" }}>
              Report a problem
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "4px",
              backgroundColor: "#dbdbdb4d",
              margin: "8px 0",
            }}
          ></div>

          {/* Switch accounts Option */}
          <div
            className="more-options"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "transparent",
            }}
          >
            <span style={{ color: "#000000", fontSize: "14px" }}>
              Switch accounts
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "#dbdbdb",
              margin: "8px 0",
            }}
          ></div>

          {/* Log out Option */}
          <div
            className="more-options"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <span style={{ color: "#000000", fontSize: "14px" }}>Log out</span>
          </div>

          {showLogoutPopup && (
            <div style={{ padding: "12px 16px", textAlign: "center" }}>
              <p style={{ color: "#666", fontSize: "14px" }}>Logging out...</p>
            </div>
          )}
        </div>
      </Dialog>

      <CreatePostDialog
        visible={showCreatePopup}
        onHide={() => setShowCreatePopup(false)}
        onImageUploaded={onImageUploaded}
        profileImage={profileImage}
        userData={userData}
      />
    </>
  );
};

export default SidebarCustom;
