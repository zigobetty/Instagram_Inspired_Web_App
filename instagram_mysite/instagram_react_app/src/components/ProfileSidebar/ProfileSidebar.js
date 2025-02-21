import "../ProfileSidebar/ProfileSidebar.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom"; // Import za dohvaćanje funkcije refreshImages
import "../HomeSidebar/HomeSidebar.css";
import newStory from "../../imgs/plus.png";
import profilePicDefault from "../../imgs/profile-user (1).png";
import noCameraPic from "../../imgs/cameraCircle.png";
import morePic from "../../imgs/more.png";
import settings from "../../imgs/settingsProfile.png";
import { Button } from "primereact/button";
import { TabMenu } from "primereact/tabmenu";
import { Dialog } from "primereact/dialog";
import HeartPic from "../../imgs/instaHeart.png";
import HeartActivePic from "../../imgs/instaHeartFull.png";

import bookMarkPic from "../../imgs/instaBookMarkOutline.png";
import bookMarkPicActive from "../../imgs/instaBookMark.png";

import EmojiPicker from "emoji-picker-react";
import { InputTextarea } from "primereact/inputtextarea";
import { UserContext } from "../UserContext";
import { ProgressSpinner } from "primereact/progressspinner";

const ProfileSidebar = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profileImage, setProfileImage } = useContext(UserContext);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);
  const [descValue, setDescValue] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [hoveredComment, setHoveredComment] = useState(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [activeTab, setActiveTab] = useState("POSTS");
  const [liked, setLiked] = useState(false);
  const [likedComment, setLikedComment] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const { refreshImages } = useOutletContext();
  const fileInputRef = useRef(null);
  

  const addEmoji = (emojiObject) => {
    setNewComment((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const toggleActive = () => {
    setIsActive(!isActive);
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
        if (data.success) {
          setUserData(data.data);

          // ✅ Postavi sliku SAMO ako nije već postavljena
          if (!data.data.profile_image_url) {
            setProfileImage(profilePicDefault); // 🟢 Postavi defaultnu sliku
          } else {
            // ✅ Forsira osvježavanje slike dodavanjem timestamp-a (izbjegava cache)
            setProfileImage(`${data.data.profile_image_url}?t=${Date.now()}`);
          }
        } else {
          console.error("Greška:", data.error);
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja korisničkog profila:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []); // ✅ Pokreće se SAMO JEDNOM, kad se komponenta mounta

  const fetchUserImages = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/get-user-images/",
        {
          method: "GET",
          credentials: "include",
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

  useEffect(() => {
    fetchUserImages();
  }, [refreshImages]);

  const items = [
    { label: "POSTS", icon: "pi pi-table" },
    { label: "SAVED", icon: "pi pi-save" },
    { label: "TAGGED", icon: "pi pi-tag" },
  ];

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const response = await fetch(
            "http://localhost:8000/api/update-profile-image/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({ picture: reader.result }),
            }
          );

          const data = await response.json();
          if (data.success) {
            console.log("✅ Profilna slika ažurirana:", data.profile_image_url);
            setProfileImage(`${data.profile_image_url}?t=${Date.now()}`); // 🔄 AUTOMATSKO AŽURIRANJE KONTEKSTA
          }
        } catch (error) {
          console.error("Greška pri ažuriranju slike:", error);
        }
      };
    }
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };
  const uploadProfileImage = async (base64Image) => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/update-profile-image/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          credentials: "include",
          body: JSON.stringify({ picture: base64Image }),
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Profilna slika uspješno ažurirana!");

        // 🚀 Ažuriraj samo profilnu sliku
        if (data.profile_image_url) {
          setProfileImage(`${data.profile_image_url}?t=${Date.now()}`);
          closeDialog();
        }
      } else {
        console.error("❌ Greška kod ažuriranja profilne slike:", data.error);
      }
    } catch (error) {
      console.error("❌ Greška prilikom slanja slike na server:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user-profile/", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Korisnik nije logiran.");
          setUserData(null);
          return;
        }
        throw new Error("Failed to fetch user profile.");
      }

      const data = await response.json();
      if (data.success) {
        setUserData(data.data);

        // ✅ Forsira osvežavanje slike dodavanjem timestamp-a
        if (data.data.profile_image_url) {
          setProfileImage(
            `${data.data.profile_image_url}?t=${new Date().getTime()}`
          );
        }
      } else {
        console.error("Greška:", data.error);
      }
    } catch (error) {
      console.error("Greška kod dohvaćanja korisničkog profila:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/remove-profile-image/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Profilna slika uspješno uklonjena!");

        // 🔄 Resetiraj sliku na defaultnu
        setProfileImage(profilePicDefault);
        closeDialog();
      } else {
        console.error("❌ Greška kod brisanja profilne slike:", data.error);
      }
    } catch (error) {
      console.error("❌ Greška prilikom brisanja slike na serveru:", error);
    }
  };

  const openImageDialog = async (image) => {
    setSelectedImage(image.image_url);
    setSelectedImageId(image.id);
    setIsImageDialogOpen(true);

    setLiked(image.liked || false);
    setBookmarked(image.bookmarked || false);

    try {
      const response = await fetch(
        `http://localhost:8000/api/get-comments/${image.id}/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      } else {
        console.error("Greška pri dohvaćanju komentara:", data.error);
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju komentara:", error);
    }
  };

  const closeImageDialog = () => {
    setIsImageDialogOpen(false);
    setSelectedImage(null);
  };

  const openMoreDialog = () => setIsMoreDialogOpen(true);
  const closeMoreDialog = () => setIsMoreDialogOpen(false);

  const deleteUserImage = async () => {
    if (!selectedImageId) {
      console.error("❌ Nema slike za brisanje!");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/delete-image/${selectedImageId}/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Slika uspješno obrisana!");

        // Ažuriraj UI uklanjanjem slike iz state-a
        setUserImages((prevImages) =>
          prevImages.filter((img) => img.id !== selectedImageId)
        );

        // Zatvori dijaloge
        setIsImageDialogOpen(false);
        setIsMoreDialogOpen(false);
        setSelectedImageId(null);
      } else {
        console.error("❌ Greška pri brisanju slike:", data.error);
      }
    } catch (error) {
      console.error(
        "❌ Greška prilikom slanja zahtjeva za brisanje slike:",
        error
      );
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/api/add-comment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: selectedImageId, text: newComment }),
      });

      const data = await response.json();
      if (data.success) {
        setComments((prevComments) => [
          { id: data.comment_id, user: userData.username, text: newComment },
          ...prevComments,
        ]);
        setNewComment(""); // Resetiraj polje unosa
      } else {
        console.error("Greška pri dodavanju komentara:", data.error);
      }
    } catch (error) {
      console.error("Greška pri dodavanju komentara:", error);
    }
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
      const response = await fetch(
        `http://localhost:8000/api/delete-comment/${selectedCommentId}/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== selectedCommentId)
        );
        closeCommentDialog();
      } else {
        console.error("Greška pri brisanju komentara:", data.error);
      }
    } catch (error) {
      console.error("Greška pri slanju zahtjeva za brisanje komentara:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    // Dodaj event listener za klik izvan
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Ukloni event listener kada se komponenta unmounta
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  const handleTabChange = (e) => {
    setLoadingTab(true);
    setActiveTab(e.value.label);

    setTimeout(() => {
      setLoadingTab(false);
    }, 500);
  };

  return (
    <>
      <div className="main-profile-container">
        <div className="header-profile-container">
          <div className="left-header-container">
            <div className="main-story-container-profile">
              {/* Vanjski veći krug */}
              <div
                className={`outer-circle-profile ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openDialog();
                  e.preventDefault();
                }}
              >
                {/* Srednji bijeli krug */}
                <div className="middle-circle-profile"></div>

                {/* Unutar njega manji krug sa slikom */}
                <div className="story-container-profile">
                  <img src={profileImage || profilePicDefault} alt="Profile" />
                </div>
              </div>
            </div>
          </div>
          <div className="right-header-container">
            <div className="right-inner-header-container">
              <p className="username-profile-text">
                {loading ? "Loading..." : userData?.username || "Unknown User"}
              </p>
              <Button className="editProfile-button" label="Edit Profile" />
              <Button className="editProfile-button" label="View archive" />
              <div className="tooltip-container">
                <img
                  className="settings-icon-profile"
                  src={settings}
                  alt="Settings"
                />
                <span className="tooltip-text">Options</span>
              </div>
            </div>
            <div className="right-inner-middle-container">
              <p className="middle-profile-text">
                <strong>{userImages.length}</strong> posts
              </p>
              <p className="middle-profile-text">
                <strong>{userData?.followers ?? 0}</strong> followers
              </p>
              <p className="middle-profile-text">
                <strong>{userData?.following ?? 0}</strong> following
              </p>
            </div>

            <div className="right-middle-header-container">
              <p className="bottom-profile-text">
                <strong>Opis...</strong>
              </p>
            </div>
          </div>
        </div>
        <div className="main-story-container-story-profile">
          {/* Vanjski veći krug */}
          <div
            className={`outer-circle-story-profile ${isActive ? "active" : ""}`}
            onClick={toggleActive}
          >
            {/* Srednji bijeli krug */}
            <div className="middle-circle-story-profile"></div>

            {/* Unutar njega manji krug sa slikom */}
            <div className="story-container-story-profile">
              <img src={newStory} alt="Story" />
            </div>
          </div>
          <div className="storyText-container">
            <p>New</p>
          </div>
        </div>
        <div className="line-profile">
          <TabMenu
            model={items}
            activeItem={items.find((item) => item.label === activeTab)}
            onTabChange={handleTabChange}
          />
          {loadingTab ? (
            <div className="loading-spinner">
              <ProgressSpinner
                style={{
                  width: "50px",
                  height: "50px",
                  color: "#000000",
                  position: "absolute",
                  bottom: "200px",
                  right: "50em",
                }}
                strokeWidth="4"
                fill="transparent"
                animationDuration=".5s"
              />
            </div>
          ) : (
            <>
              {activeTab === "POSTS" &&
                (userImages.length > 0 ? (
                  <div className="user-images-container">
                    {userImages.map((image) => (
                      <div
                        key={image.id}
                        className="user-image"
                        onClick={() => openImageDialog(image)}
                      >
                        <img
                          src={image.image_url}
                          alt="User Post"
                          className="uploaded-image"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="noPhoto-container">
                    <img
                      className="noCameraPic"
                      src={noCameraPic}
                      alt="No posts"
                    />
                    <p className="noPosts-text">No posts yet</p>
                  </div>
                ))}
              {activeTab === "SAVED" && (
                <div className="saved-container">
                  {savedImages.length > 0 ? (
                    <div className="user-images-container">
                      {savedImages.map((image, index) => (
                        <div key={index} className="user-image">
                          <img
                            src={image}
                            alt="Saved Post"
                            className="uploaded-image"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-saved-text">No post saved yet.</p>
                  )}
                </div>
              )}

              {activeTab === "TAGGED" && (
                <div className="tagged-container">
                  <p className="tagged-text">No tagged posts yet.</p>
                </div>
              )}
            </>
          )}
        </div>
        {/* Dialog prozor */}
        <Dialog
          header="Change profile photo"
          headerStyle={{ width: "38em", paddingTop: "2.5em" }}
          visible={isDialogOpen}
          className="custom-dialog"
          onHide={closeDialog}
          dismissableMask
          appendTo={document.body}
        >
          <div className="dialog-content">
            <div className="dialog-divider"></div>
            <div>
              <button
                className="custom-uploadPhoto-btn"
                onClick={() => fileInputRef.current.click()}
                style={{ cursor: "pointer" }}
              >
                Upload Photo
              </button>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onClick={(e) => e.stopPropagation()}
                onChange={handleFileChange}
              />
            </div>

            <div className="dialog-divider"></div>
            <p
              className="dialog-text-remove"
              onClick={removeProfileImage}
              style={{ cursor: "pointer" }}
            >
              Remove current photo
            </p>
            <div className="dialog-divider"></div>
            <p
              className="dialog-text-cancel"
              onClick={closeDialog}
              style={{ cursor: "pointer" }}
            >
              Cancel
            </p>
          </div>
        </Dialog>

        {/* Dialog prozor za pregled slike */}
        <Dialog
          visible={isImageDialogOpen}
          onHide={closeImageDialog}
          dismissableMask
          className="custom-image-dialog"
          style={{ width: "80vw", maxWidth: "1233px", marginTop: "2em" }}
        >
          <div className="image-dialog-container">
            <div className="left-image-container">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="full-image"
                />
              )}
            </div>
            <div className="right-empty-container">
              <div className="header_post_container">
                <div className="profile_picture_header_post_container">
                  <div className="right-container-username">
                    {/* Vanjski veći krug */}
                    <div className="outer-circle-create">
                      {/* Unutar njega manji krug sa slikom */}
                      <div className="story-container-create">
                        <img src={profileImage} alt="User Profile" />
                      </div>
                    </div>
                    <p className="create-username-text">
                      {userData?.username || "Unknown User"}
                    </p>
                  </div>
                  <p className="post-location-text">
                    {userData?.location || "Location"}
                  </p>
                </div>
                <div className="more_post_container" onClick={openMoreDialog}>
                  <img className="morePic" src={morePic} alt="More" />
                </div>
              </div>
              <div className="dialog-divider-second"></div>
              <div className="main_post_container">
                <div className="profile_picture_main_post_container">
                  <div className="right-container-username">
                    {/* Kombinirani kontejner za opis slike i komentare */}
                    <div className="comments-container">
                      {userImages.find((img) => img.id === selectedImageId)
                        ?.description && (
                        <div className="single_comment description">
                          <img
                            src={profileImage || profilePicDefault}
                            alt="User Profile"
                            className="comment_profile_pic"
                          />
                          <p className="comment_text">
                            <strong className="comment_username">
                              {userData?.username || "Unknown User"}
                            </strong>{" "}
                            {
                              userImages.find(
                                (img) => img.id === selectedImageId
                              )?.description
                            }
                          </p>
                        </div>
                      )}

                      {comments.map((comment, index) => (
                        <div
                          key={index}
                          className="single_comment"
                          onMouseEnter={() => setHoveredComment(index)}
                          onMouseLeave={() => setHoveredComment(null)}
                        >
                          <img
                            src={profileImage || profilePicDefault}
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
                              src={likedComment ? HeartActivePic : HeartPic}
                              alt="Fav"
                              onClick={() => setLikedComment((prev) => !prev)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                          {hoveredComment === index && (
                            <img
                              src={morePic}
                              alt="More Options"
                              className="comment_more_icon"
                              onClick={() => openCommentDialog(comment.id)}
                            />
                          )}
                        </div>
                      ))}

                      {!userImages.find((img) => img.id === selectedImageId)
                        ?.description &&
                        comments.length === 0 && (
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
              <div className="footer_post_container">
                <div className="first-footer-container">
                  <img
                    className="footerPicHeart"
                    src={liked ? HeartActivePic : HeartPic}
                    alt="Fav"
                    onClick={() => setLiked((prev) => !prev)}
                    style={{ cursor: "pointer" }}
                  />
                  <img
                    className="footerPicBookMark"
                    src={bookmarked ? bookMarkPicActive : bookMarkPic}
                    alt="Save"
                    onClick={() => {
                      // Toggle bookmark
                      setBookmarked((prev) => {
                        const newState = !prev;
                        if (newState) {
                          // Ako je postalo true, dodajemo sliku u savedImages
                          setSavedImages((prevSaved) => [
                            ...prevSaved,
                            selectedImage,
                          ]);
                        } else {
                          // Ako se poništi, uklonite tu sliku
                          setSavedImages((prevSaved) =>
                            prevSaved.filter((img) => img !== selectedImage)
                          );
                        }
                        return newState;
                      });
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </div>
                <div>
                  <p className="likedBy-text">Liked by</p>
                </div>
              </div>
              <div className="comment_post_container">
                <div className="comment-input-wrapper">
                  <div
                    className="emoji-container_second"
                    ref={emojiRef}
                    style={{ position: "relative" }}
                  >
                    <svg
                      aria-label="Emoji"
                      className="emoji-icon"
                      fill="currentColor"
                      height="32"
                      role="img"
                      viewBox="0 0 24 24"
                      width="32"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker((prev) => !prev); // Toggle emoji picker
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <title>Emoji</title>
                      <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                    </svg>

                    {showEmojiPicker && (
                      <div className="emoji-picker">
                        <EmojiPicker onEmojiClick={addEmoji} />
                      </div>
                    )}
                  </div>

                  <div className="add-comment-container">
                    <textarea
                      className="add-comment-textarea"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                    />
                  </div>
                  <div className="post_thePost_cont">
                    <p
                      className={`post_theComment_text ${
                        newComment.trim() ? "enabled" : "disabled"
                      }`}
                      onClick={newComment.trim() ? submitComment : null}
                      style={{
                        opacity: newComment.trim() ? "1" : "0.5",
                        cursor: newComment.trim() ? "pointer" : "default",
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

        {/* More Dialog */}
        <Dialog
          visible={isMoreDialogOpen}
          onHide={closeMoreDialog}
          className="custom-more-dialog"
          dismissableMask
          style={{ width: "35em", borderRadius: "12px", marginTop: "4em" }}
        >
          <div className="more-dialog-content">
            <p
              className="more-dialog-option delete-option"
              onClick={deleteUserImage}
            >
              Delete
            </p>
            <div className="dialog-divider-second"></div>
            <p className="more-dialog-option">Edit</p>
            <div className="dialog-divider-second"></div>
            <p className="more-dialog-option">Unhide like count to others</p>
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
          </div>
        </Dialog>

        {/* Dialog za opcije (Delete & Cancel) */}
        <Dialog
          visible={isCommentDialogOpen}
          onHide={closeCommentDialog}
          className="custom-comment-dialog"
          dismissableMask
          style={{
            width: "0em",
            borderRadius: "12px",
            marginTop: "-2em",
            marginLeft: "-30em",
          }}
        >
          <div className="comment-dialog-content">
            <p
              className="comment-dialog-option delete-option"
              onClick={deleteComment}
            >
              Delete
            </p>
            <div className="dialog-divider-second"></div>
            <p className="comment-dialog-option" onClick={closeCommentDialog}>
              Cancel
            </p>
          </div>
        </Dialog>
      </div>
    </>
  );
};

export default ProfileSidebar;
