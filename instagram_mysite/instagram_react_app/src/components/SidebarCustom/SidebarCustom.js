import React, { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "../UserContext";
import "../SidebarCustom/SidebarCustom.css";
import { Sidebar } from "primereact/sidebar";
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
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Slider } from "primereact/slider";
import profilePic from "../../imgs/profilna.jpg";
import { InputTextarea } from "primereact/inputtextarea";
import EmojiPicker from "emoji-picker-react";

import { InputText } from "primereact/inputtext";
import { ListBox } from "primereact/listbox";
import { Skeleton } from "primereact/skeleton";

const SidebarCustom = ({ onHide, onImageUploaded }) => {
  const toast = useRef(null);
  const { profileImage, setProfileImage } = useContext(UserContext);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dialogStep, setDialogStep] = useState(1);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [valueSlider, setValueSlider] = useState(50);
  const [isNextStep, setIsNextStep] = useState(false);
  const [isActivePic, setIsActivePic] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);

  const [userImages, setUserImages] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [userData, setUserData] = useState(null);

  const [isInputFocused, setIsInputFocused] = useState(false);

  const fileInputRef = useRef(null);
  const handleFileChange = (event) => {
    const file = event.target.files[0]; // Prva izabrana slika

    if (file) {
      console.log("Odabrana slika:", file);

      // Kreiramo privremeni URL slike za prikaz
      const imageUrl = URL.createObjectURL(file);

      setSelectedImage(imageUrl); // ✅ Postavlja sliku za prikaz
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  const [showSearchContainer, setShowSearchContainer] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  const toggleActive = () => {
    setIsActivePic(!isActivePic); // Toggle aktivnog stanja kruga
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/logout/", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        // Ako koristite useNavigate:
        navigate("/"); // Preusmjerava na login
        // Ili možete koristiti window.location.href:
        // window.location.href = "/";
      } else {
        console.error("Logout nije uspio:", data.error);
      }
    } catch (error) {
      console.error("Greška prilikom odjave:", error);
    }
  };

  const logoutUser = () => {
    // Resetirajte state prije odjave
    setUserData(null);
    setProfileImage(null);
    fetch("/api/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: 1 }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("User deleted successfully");
          setShowLogoutPopup(false);
          window.location.href = "/login";
        } else {
          console.error("Error deleting user:", data.error);
          setShowLogoutPopup(false);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setShowLogoutPopup(false);
      });
  };

  const [isMoreActive, setIsMoreActive] = useState(false);
  const [moreTarget, setMoreTarget] = useState(null);

  const popupMore = (event) => {
    if (isMoreActive) {
      setIsMoreActive(false);
    } else {
      setMoreTarget(event.currentTarget);
      setIsMoreActive(true);
    }
    confirmPopup({
      target: event.currentTarget,
      message: (
        <div className="sidebar-main-cont-popUp">
          <div className="settings-cont">
            <img
              className="photo_sidebar_popup"
              src={settingsPhoto}
              alt="Logo"
            />
            <p className="sidebar-text-popUp">Settings</p>
          </div>

          <div className="other-sidebar-cont-popUp">
            <img
              className="photo_sidebar_popup"
              src={activityPhoto}
              alt="Logo"
            />
            <p className="sidebar-text-popUp">Your Activity</p>
          </div>

          <div className="other-sidebar-cont-popUp">
            <img className="photo_sidebar_popup" src={savedPhoto} alt="Logo" />
            <p className="sidebar-text-popUp">Saved</p>
          </div>

          <div className="other-sidebar-cont-popUp">
            <img className="photo_sidebar_popup" src={modePhoto} alt="Logo" />
            <p className="sidebar-text-popUp">Switch appearance</p>
          </div>

          <div className="other-sidebar-cont-popUp">
            <img
              className="photo_sidebar_popup"
              src={problemPhoto}
              alt="Logout"
            />
            <p className="sidebar-text-popUp">Report a problem</p>
          </div>
          <div className="breaker_for_popup"></div>
          <div className="other-sidebar-cont-popUp-switch">
            <p className="sidebar-text-popUp">Switch accounts</p>
          </div>
          <div className="breaker-second"></div>

          <div
            className="other-sidebar-cont-popUp-logout"
            onClick={handleLogout}
          >
            <p className="sidebar-text-popUp">Log out</p>
          </div>

          {showLogoutPopup && (
            <div className="logout-popup">
              <p>Logging out...</p>
            </div>
          )}
        </div>
      ),
      onHide: () => setIsMoreActive(false),
      closable: true, // Omogućava zatvaranje klikom izvan
      showIcon: false, // Uklanja ikonu upozorenja
      footer: null, // Uklanja gumbe "Yes" i "No"
      style: { backgroundColor: "white", borderRadius: "20px" },
    });
  };

  const isActive = (path) => location.pathname === path;

  const openCreatePopup = () => {
    setShowCreatePopup(true);
    setIsNextStep(false); // Resetiraj stanje
  };

  const closeCreatePopup = () => {
    setShowCreatePopup(false);
    setSelectedImage(null);
    setIsNextStep(false); // Resetiraj stanje
  };

  const onImageSelect = (event) => {
    const file = event.files[0]; // Dohvati prvu datoteku
    if (file) {
      const imageUrl = URL.createObjectURL(file); // Generiraj privremeni URL
      setSelectedImage(imageUrl); // Postavi URL u stanje
    }
  };
  const onUploadImage = () => {
    toast.current.show({
      severity: "info",
      summary: "Success",
      detail: "File Uploaded",
    });
  };

  const handleBack = () => {
    if (isNextStep) {
      // Ako je korisnik na drugom koraku (Next Step), vratite ga na prvi
      setIsNextStep(false);
    } else {
      // Ako je korisnik na prvom koraku, resetujte sliku
      setSelectedImage(null);
    }
  };
  const checkUserSession = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user-profile/", {
        method: "GET",
        credentials: "include", // Osigurava da se kolačići šalju
      });

      if (response.status === 401) {
        console.error("User is not logged in.");
        return false;
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error checking user session:", error);
      return false;
    }
  };

  const handleShare = async () => {
    const isUserLoggedIn = await checkUserSession();
    if (!isUserLoggedIn) {
      alert("Please log in before sharing.");
      return;
    }
    if (!selectedImage) {
      alert("Please select an image.");
      return;
    }

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const base64Image = await convertToBase64(blob);

      const postData = {
        picture: base64Image,
        description: descValue,
      };

      const res = await fetch("http://localhost:8000/api/upload-image/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 📌 Ovo osigurava da se šalje sesijski kolačić
        body: JSON.stringify(postData),
      });

      if (res.status === 401) {
        console.error("Error: User is not logged in.");
        alert("You need to log in to post an image.");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error creating post:", errorData);
        alert(errorData.error || "Failed to create post.");
        return;
      }

      const data = await res.json();
      alert("Post created successfully!");
      setSelectedImage(null);
      setDescValue("");
      fetchUserImages(); // Osvježi slike
      if (onImageUploaded) {
        onImageUploaded(); // Osvježi slike u ProfileSidebar
      }

      closeCreatePopup();
    } catch (err) {
      console.error("Error sharing post:", err);
      alert("An error occurred while sharing the post.");
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const fetchUserImages = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/get-user-images/",
        {
          method: "GET",
          credentials: "include", // Važno za slanje sesije i kolačića
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        console.error("User is not logged in.");
        return;
      }

      if (data.success) {
        setUserImages(data.images);
      } else {
        console.error("Failed to load images:", data.error);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  // Pozivamo funkciju kada se komponenta učita
  useEffect(() => {
    fetchUserImages();
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
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/user-profile/",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            console.error("Korisnik nije logiran.");
            setUserData(null);
            return;
          }
          throw new Error("Failed to fetch user profile.");
        }

        const data = await response.json();
        console.log("📸 Dohvaćeni podaci o korisniku:", data);

        if (data.success) {
          setUserData(data.data);
          setProfileImage(
            data.data.profile_image_url
              ? `${data.data.profile_image_url}?t=${Date.now()}`
              : null
          );
        } else {
          console.error("Greška:", data.error);
          setProfileImage(null);
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja korisničkog profila:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const addEmoji = (emojiObject) => {
    setDescValue((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const maxCharLimit = 2200;

  const handleTextChange = (e) => {
    if (e.target.value.length <= maxCharLimit) {
      setDescValue(e.target.value);
    }
  };

  const [locationInput, setLocationInput] = useState("");
  const [allCities, setAllCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries")
      .then((response) => response.json())
      .then((data) => {
        if (!data.error && data.data) {
          // Kreiramo niz koji sadrži i nazive zemalja i gradova
          const countriesAndCities = data.data.reduce((acc, country) => {
            acc.push(country.country); // Dodajemo naziv zemlje
            if (Array.isArray(country.cities)) {
              return acc.concat(country.cities);
            }
            return acc;
          }, []);
          setAllCities(countriesAndCities);
        }
      })
      .catch((error) => console.error("Error fetching countries:", error));
  }, []);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    if (value.trim() !== "") {
      const filtered = allCities.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectCity = (city) => {
    setLocationInput(city);
    setShowDropdown(false);
  };

  // Na početku komponente, uz ostale useState i useRef
  const locationContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideLocation = (event) => {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideLocation);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideLocation);
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length > 0) {
      setLoading(true);

      const fetchUsers = setTimeout(() => {
        fetch(
          `http://localhost:8000/api/search-users/?query=${encodeURIComponent(
            searchTerm
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // 📌 Ako koristiš sesije u Django-u
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log("Fetched users:", data.users); // Provjera podataka
            if (data.success) {
              setUsers(data.users);
              data.users.forEach((user) => {});
            } else {
              setUsers([]);
            }
          })
          .catch((error) => console.error("Error fetching users:", error))
          .finally(() => setLoading(false));
      }, 500);

      return () => clearTimeout(fetchUsers);
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const hasCustomProfileImage =
    profileImage &&
    profileImage !== "" &&
    profileImage !== "null" &&
    profileImage !== profilePicDefault;

  return (
    <>
      <div className="card flex" style={{ height: "100vh" }}>
        <Sidebar
          visible={isSidebarVisible}
          style={{
            backgroundColor: "white",
            width: showSearchOverlay ? "8em" : "20em",
            transition: "width 0.3s ease",
          }}
          modal={false}
          showCloseIcon={false}
          onHide={handleSidebarHide}
        >
          {showSearchOverlay ? (
            <img
              className="photo_sidebar_insta"
              src={instaPhoto}
              alt="Logo"
              style={{ ...(showSearchOverlay ? { marginLeft: "1.6em" } : {}) }}
            />
          ) : (
            <div
              className="logo-instagram-cont"
              style={{
                cursor: "pointer",
              }}
            >
              <img className="logo_sidebar" src={logoPhoto} alt="Logo" />
            </div>
          )}

          <div className="sidebar-main-cont">
            <div
              className={`home-cont ${isActive("/home") ? "active" : ""}`}
              onClick={() => navigate("/home")}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={
                  isActive("/home") && !showSearchOverlay
                    ? homePhoto
                    : homePhotoOutline
                } // Dinamički mjenja sliku
                alt="Home"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && (
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
              onClick={() => setShowSearchOverlay(true)}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={showSearchOverlay ? searchPhotoBold : searchPhotot}
                alt="Search"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && <p className="sidebar-text">Search</p>}
            </div>

            {/* Explore */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/explore") ? "active" : ""
              }`}
              onClick={() => navigate("/home/explore")}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={
                  isActive("/home/explore") && !showSearchOverlay
                    ? BoldExplorePhoto
                    : directionPhotot
                }
                alt="Logo"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && <p className="sidebar-text">Explore</p>}
            </div>

            {/* Reels */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/reels") ? "active" : ""
              }`}
              onClick={() => navigate("/home/reels")}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={
                  isActive("/home/reels") && !showSearchOverlay
                    ? reelsPhotoBold
                    : reelsPhoto
                }
                alt="Logo"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && <p className="sidebar-text">Reels</p>}
            </div>

            {/* Messages */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/messages") ? "active" : ""
              }`}
              onClick={() => navigate("/home/messages")}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={
                  isActive("/home/messages") && !showSearchOverlay
                    ? sendPhotoBold
                    : sendPhoto
                }
                alt="Logo"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && <p className="sidebar-text">Messages</p>}
            </div>

            {/* Notifications */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/notifications") ? "active" : ""
              }`}
              onClick={() => navigate("/home/notifications")}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={
                  isActive("/home/notifications") && !showSearchOverlay
                    ? heartPhotoBold
                    : heartPhoto
                }
                alt="Logo"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && (
                <p className="sidebar-text">Notifications</p>
              )}
            </div>

            {/* Create */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/create") ? "active" : ""
              }`}
              onClick={openCreatePopup} // Otvara pop-up
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={createPhoto}
                alt="Logo"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && <p className="sidebar-text">Create</p>}
            </div>

            {/* Profile */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/profile") ? "active" : ""
              }`}
              onClick={() => navigate("/home/profile")}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                key={profileImage || "default"} // dodavanje key-ja može forsirati ponovno renderiranje
                className="photo_sidebar"
                style={{
                  borderRadius: "50%",
                  height: "2em",
                  width: "2em",
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
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

              {!showSearchOverlay && <p className="sidebar-text">Profile</p>}
            </div>
          </div>
          <div className="sidebar-footer-cont">
            {/* Threads */}
            <div
              className={`other-sidebar-cont ${
                isActive("/home/threads") ? "active" : ""
              }`}
              onClick={() => navigate("/home/threads")}
              style={{
                cursor: "pointer",
              }}
            >
              <img
                className="photo_sidebar"
                src={threadsPhoto}
                alt="Logo"
                style={{
                  ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                }}
              />
              {!showSearchOverlay && <p className="sidebar-text">Threads</p>}
            </div>

            {/* More */}
            <div>
              <Toast ref={toast} />
              <ConfirmPopup
                target={moreTarget}
                visible={isMoreActive}
                onHide={() => setIsMoreActive(false)}
                className="confirm-popup-more"
              />
              <div
                className={`other-sidebar-cont ${isMoreActive ? "active" : ""}`} // Aktivna klasa
                onClick={popupMore}
                style={{ cursor: "pointer" }}
              >
                <img
                  className="photo_sidebar"
                  style={{
                    ...(showSearchOverlay ? { marginLeft: "6.7em" } : {}),
                  }}
                  src={isMoreActive ? hamburgerPhotoBold : hamburgerPhoto} // Dinamička slika
                  alt="More"
                />
                {!showSearchOverlay && (
                  <p
                    className="sidebar-text"
                    style={{
                      fontWeight: isMoreActive ? "bold" : "normal", // Bold tekst kad je aktivan
                    }}
                  >
                    More
                  </p>
                )}
              </div>
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
            width: "33em",
            borderBottomLeftRadius: "unset",
            borderTopLeftRadius: "unset",
            border: "none",
            minHeight: "64.4em",
          }}
          contentStyle={{ width: "100%" }}
          onHide={() => setShowSearchOverlay(false)}
          dismissableMask
          maskStyle={{ background: "rgba(0, 0, 0, 0)" }}
        >
          <>
            <div className="search-container" style={{ padding: "1em" }}>
              {/* Input polje za pretragu */}

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full p-2 border rounded search-input"
                style={{
                  paddingLeft: !isInputFocused ? "2.5rem" : "1rem",
                  paddingRight: isInputFocused ? "2.5rem" : "1rem",
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  if (searchTerm === "") setIsInputFocused(false);
                }}
              />
              {!isInputFocused && (
                <i
                  className="pi pi-search"
                  style={{
                    position: "absolute",
                    left: "2.2rem",
                    top: "13%",
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
                      right: "3.2rem",
                      top: "12.5%",
                      zIndex: "1000",
                      transform: "translateY(-50%)",
                      color: "#aaa",
                    }}
                  ></i>
                ) : (
                  <i
                    className="pi pi-times-circle"
                    style={{
                      position: "absolute",
                      right: "3.2rem",
                      top: "13.3%",
                      zIndex: "1000",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#aaa",
                    }}
                    onClick={() => setSearchTerm("")}
                  ></i>
                ))}

              {/* Lista korisnika iz pretrage */}
              {!loading && users.length > 0 && (
                <div className="main-list-search-cont">
                  <ul className="mt-2" style={{ listStyleType: "none" }}>
                    {users.map((user) => (
                      <li
                        key={user.id}
                        onClick={() => {
                          setShowSearchOverlay(false);
                          navigate(`/home/profile/${user.id}`);
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
                <p>No users found.</p>
              )}
            </div>
          </>
        </Dialog>
      )}

      {/* Create Popup */}
      <Dialog
        header={isNextStep ? "Create new post" : null} // Promijeni heder ako je Next
        visible={showCreatePopup}
        style={{ width: "30vw", marginLeft: "-11em" }}
        onHide={closeCreatePopup}
        dismissableMask
      >
        {!isNextStep ? (
          <>
            <div className="dialog-header">
              {selectedImage ? (
                <>
                  <button className="back-arrow" onClick={handleBack}>
                    <svg
                      aria-label="Back"
                      class="x1lliihq x1n2onr6 x5n08af"
                      fill="currentColor"
                      height="24"
                      role="img"
                      viewBox="0 0 24 24"
                      width="24"
                    >
                      <title>Back</title>
                      <line
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        x1="2.909"
                        x2="22.001"
                        y1="12.004"
                        y2="12.004"
                      ></line>
                      <polyline
                        fill="none"
                        points="9.276 4.726 2.001 12.004 9.276 19.274"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></polyline>
                    </svg>
                  </button>
                  <h3 className="dialog-title">Crop</h3>
                  <button
                    className="next-button"
                    onClick={() => setIsNextStep(true)} // Postavi na Next korak
                  >
                    Next
                  </button>
                </>
              ) : (
                <h3 className="dialog-title">Create new post</h3>
              )}
            </div>

            <div className="line-dialog-create"></div>

            <div
              className="photo-create-container"
              onDragOver={(e) => e.preventDefault()} // Sprečava podrazumevano ponašanje
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0]; // Uzima prvi fajl
                if (file && file.type.startsWith("image/")) {
                  const imageUrl = URL.createObjectURL(file); // Generiše URL za pregled slike
                  setSelectedImage(imageUrl); // Postavlja odabranu sliku
                } else {
                  console.error("Please drop a valid image file.");
                }
              }}
            >
              {selectedImage ? (
                <>
                  <div className="image-preview-container">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="image-preview"
                      style={{
                        transform: `scale(${valueSlider / 50})`,
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </div>
                  <div className="footer-container-create">
                    <div
                      className="circle-zoomIn"
                      onClick={() => setIsZoomActive(!isZoomActive)}
                    >
                      <img
                        className="zoomIn-photo"
                        src={zoomInPhoto}
                        alt="Zoom In"
                      />
                    </div>
                    {isZoomActive && (
                      <div className="slider-container">
                        <Slider
                          value={valueSlider}
                          onChange={(e) => setValueSlider(e.value)}
                          className="w-14rem slider"
                          min={25}
                          max={100}
                          step={1}
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <svg
                    aria-label="Icon to represent media such as images or videos"
                    fill="currentColor"
                    height="120"
                    role="img"
                    viewBox="0 0 97.6 77.3"
                    width="120"
                  >
                    <title>
                      Icon to represent media such as images or videos
                    </title>
                    <path
                      d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M84.7 18.4 58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.7-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.8.3L7 49 5.2 17c-.2-2.3.6-4.5 2-6.2zm8.7 48c-4.3.2-8.1-2.8-8.8-7.1l9.4-10.5c.2-.3.6-.4 1-.5.4 0 .7.1 1 .4l7.8 7c.7.6 1.6.9 2.5.9.9 0 1.7-.5 2.3-1.1l7.8-8.8-1.1 18.6-21.9 1.1zm76.5-29.5-2 34c-.3 4.6-4.3 8.2-8.9 7.9l-34-2c-4.6-.3-8.2-4.3-7.9-8.9l2-34c.3-4.4 3.9-7.9 8.4-7.9h.5l34 2c4.7.3 8.2 4.3 7.9 8.9z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M78.2 41.6 61.3 30.5c-2.1-1.4-4.9-.8-6.2 1.3-.4.7-.7 1.4-.7 2.2l-1.2 20.1c-.1 2.5 1.7 4.6 4.2 4.8h.3c.7 0 1.4-.2 2-.5l18-9c2.2-1.1 3.1-3.8 2-6-.4-.7-.9-1.3-1.5-1.5-1.8zm-1.4 6-18 9c-.4.2-.8.3-1.3.3-.4 0-.9-.2-1.2-.4-.7-.5-1.2-1.3-1.1-2.2l1.2-20.1c.1-.9.6-1.7 1.4-2.1.8-.4 1.7-.3 2.5.1L77 43.3c1.2.8 1.5 2.3.7 3.4-.2.4-.5.7-.9.9z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  <p className="dragdrop-create-text">
                    Drag photos and videos here
                  </p>
                  <button
                    className="custom-choose-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Select From Computer{" "}
                  </button>{" "}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }} // ✅ Sakriven
                    ref={fileInputRef}
                    onClick={(e) => e.stopPropagation()}
                    onChange={handleFileChange} // ✅ Ažurira sliku nakon izbora
                  />
                  {/* <FileUpload
                    mode="basic"
                    name="demo[]"
                    accept="image/*"
                    maxFileSize={1000000}
                    customUpload
                    onSelect={onImageSelect}
                    onClick={(e) => e.stopPropagation()}
                    chooseOptions={{
                      label: "Select From Computer",
                      className: "custom-choose-btn",
                    }}
                  /> */}
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="photo-create-container">
              <div className="header-third-dialog">
                <button className="back-arrow" onClick={handleBack}>
                  <svg
                    aria-label="Back"
                    class="x1lliihq x1n2onr6 x5n08af"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <title>Back</title>
                    <line
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      x1="2.909"
                      x2="22.001"
                      y1="12.004"
                      y2="12.004"
                    ></line>
                    <polyline
                      fill="none"
                      points="9.276 4.726 2.001 12.004 9.276 19.274"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></polyline>
                  </svg>
                </button>
                <button className="next-button" onClick={handleShare}>
                  Share
                </button>
              </div>
              <div className="line-third"></div>
              <div className="main-content-post-photo">
                {/* Left Container */}
                <div className="main-content-post-photo-LEFT">
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="selected-image"
                      style={{
                        height: "auto",
                      }}
                    />
                  )}
                </div>
                {/* Right Container */}
                <div className="main-content-post-photo-RIGHT">
                  <div className="right-container-username">
                    <div className="main-story-container-create">
                      {/* Vanjski veći krug */}
                      <div
                        className="outer-circle-create
                        "
                      >
                        {/* Unutar njega manji krug sa slikom */}
                        <div className="story-container-create">
                          <img src={profileImage} alt="User Profile" />
                        </div>
                      </div>
                    </div>
                    <p className="create-username-text">
                      {userData?.username || "Unknown User"}
                    </p>
                  </div>
                  <div className="text-area-create-container">
                    <InputTextarea
                      className="custom-input-textarea"
                      autoResize
                      value={descValue}
                      onChange={handleTextChange}
                      rows={5}
                      cols={60}
                    />
                  </div>
                  <div className="footer-create-share-cont">
                    <div className="emoji-container" ref={emojiRef}>
                      <svg
                        aria-label="Emoji"
                        className="emoji-icon"
                        fill="currentColor"
                        height="28"
                        role="img"
                        viewBox="0 0 24 24"
                        width="28"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        style={{ cursor: "pointer" }}
                      >
                        <title>Emoji</title>
                        <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                      </svg>

                      {/* Emoji Picker - Show only when the picker is open */}
                      {showEmojiPicker && (
                        <div className="emoji-picker-second">
                          <EmojiPicker onEmojiClick={addEmoji} />
                        </div>
                      )}
                    </div>

                    <p className="letter-counter-text">
                      {descValue.length}/{maxCharLimit}
                    </p>
                  </div>
                  <div className="brfeaker-line-create"></div>
                  <div className="actions-container">
                    <div
                      className="inner-action-container"
                      style={{ position: "relative" }}
                      ref={locationContainerRef}
                    >
                      <input
                        type="text"
                        placeholder="Add Location"
                        value={locationInput}
                        onChange={handleLocationChange}
                        onFocus={() => setShowDropdown(true)}
                        className="actions-container-text"
                        style={{
                          color: "#000",
                          backgroundColor: "#fff",
                          padding: "0.5em",
                          border: "none",
                          marginLeft: "-0.5em",
                        }}
                      />
                      {showDropdown && filteredCities.length > 0 && (
                        <ul
                          className="location-dropdown"
                          style={{
                            color: "#000",
                            backgroundColor: "#fff",
                            border: "1px solid #ccc",
                            listStyle: "none",
                            margin: 0,
                            padding: "0.5em",
                            position: "absolute",
                            top: "100%", // odmah ispod inputa
                            left: "-0.5em",
                            marginTop: "0.5em",
                            zIndex: 1000,
                            width: "90%",
                            maxHeight: "100px",
                            overflowY: "auto",
                            borderRadius: "8px",
                          }}
                        >
                          {filteredCities.map((city, index) => (
                            <li
                              key={index}
                              onClick={() => selectCity(city)}
                              style={{ padding: "0.2em 0", cursor: "pointer" }}
                            >
                              {city}
                            </li>
                          ))}
                        </ul>
                      )}
                      <svg
                        aria-label="Add Location"
                        className="x1lliihq x1n2onr6 x1roi4f4"
                        fill="currentColor"
                        height="19"
                        role="img"
                        viewBox="0 0 24 24"
                        width="19"
                        style={{ marginLeft: "-5.8em" }}
                      >
                        <title>Add Location</title>
                        <path d="M12.053 8.105a1.604 1.604 0 1 0 1.604 1.604 1.604 1.604 0 0 0-1.604-1.604Zm0-7.105a8.684 8.684 0 0 0-8.708 8.66c0 5.699 6.14 11.495 8.108 13.123a.939.939 0 0 0 1.2 0c1.969-1.628 8.109-7.424 8.109-13.123A8.684 8.684 0 0 0 12.053 1Zm0 19.662C9.29 18.198 5.345 13.645 5.345 9.66a6.709 6.709 0 0 1 13.417 0c0 3.985-3.944 8.538-6.709 11.002Z"></path>
                      </svg>
                    </div>

                    <div className="inner-action-container-second">
                      <p className="actions-container-text">
                        Add collaborators
                      </p>
                      <svg
                        aria-label="Add collaborators"
                        class="x1lliihq x1n2onr6 x1roi4f4"
                        fill="currentColor"
                        height="19"
                        role="img"
                        viewBox="0 0 24 24"
                        width="19"
                      >
                        <title>Add collaborators</title>
                        <path d="M21 10a1 1 0 0 0-1 1v9c0 .932-.643 1.71-1.507 1.931C18.429 19.203 16.199 17 13.455 17H8.55c-2.745 0-4.974 2.204-5.037 4.933A1.999 1.999 0 0 1 2 20V6c0-1.103.897-2 2-2h9a1 1 0 1 0 0-2H4C1.794 2 0 3.794 0 6v14c0 2.206 1.794 4 4 4h14c2.206 0 4-1.794 4-4v-9a1 1 0 0 0-1-1zM8.549 19h4.906a3.05 3.05 0 0 1 3.045 3H5.505a3.05 3.05 0 0 1 3.044-3z"></path>
                        <path d="M6.51 11.002c0 2.481 2.02 4.5 4.502 4.5 2.48 0 4.499-2.019 4.499-4.5s-2.019-4.5-4.5-4.5a4.506 4.506 0 0 0-4.5 4.5zm7 0c0 1.378-1.12 2.5-2.498 2.5-1.38 0-2.501-1.122-2.501-2.5s1.122-2.5 2.5-2.5a2.502 2.502 0 0 1 2.5 2.5zM23.001 3.002h-2.004V1a1 1 0 1 0-2 0v2.002H17a1 1 0 1 0 0 2h1.998v2.003a1 1 0 1 0 2 0V5.002h2.004a1 1 0 1 0 0-2z"></path>
                      </svg>
                    </div>
                    <div className="inner-action-container-third">
                      <p className="actions-container-text">Accessibility</p>
                      <svg
                        aria-label="Down Chevron Icon"
                        class="x1lliihq x1n2onr6 x5n08af"
                        fill="currentColor"
                        height="19"
                        role="img"
                        viewBox="0 0 24 24"
                        width="19"
                        style={{ transform: "rotate(180deg)" }}
                      >
                        <title>Down Chevron Icon</title>
                        <path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"></path>
                      </svg>
                    </div>
                    <div className="inner-action-container-forth">
                      <p className="actions-container-text">
                        Advanced Settings
                      </p>
                      <svg
                        aria-label="Down Chevron Icon"
                        class="x1lliihq x1n2onr6 x5n08af"
                        fill="currentColor"
                        height="19"
                        role="img"
                        viewBox="0 0 24 24"
                        width="19"
                        style={{ transform: "rotate(180deg)" }}
                      >
                        <title>Down Chevron Icon</title>
                        <path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="brfeaker-line-create-second"></div>
                </div>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
};

export default SidebarCustom;
