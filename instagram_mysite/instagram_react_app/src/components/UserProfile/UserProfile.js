import React, { useState, useEffect, useContext, useRef } from "react";
import multiPhotosIcon from "../../imgs/multi_photos.png";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { TabMenu } from "primereact/tabmenu";
import profilePicDefault from "../../imgs/profile-user (1).png";
import noCameraPic from "../../imgs/cameraCircle.png";
import morePic from "../../imgs/more.png";
import HeartPic from "../../imgs/instaHeart.png";
import HeartActivePic from "../../imgs/instaHeartFull.png";
import bookMarkPic from "../../imgs/instaBookMarkOutline.png";
import bookMarkPicActive from "../../imgs/instaBookMark.png";
import EmojiPicker from "emoji-picker-react";
import { InputTextarea } from "primereact/inputtextarea";
import "./UserProfile.css";
import {
  getUserProfileById,
  getUserImagesById,
  followUser,
  unfollowUser,
  getCommentsForImage,
  submitCommentForImage,
  deleteCommentById,
  likeComment,
  unlikeComment,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  checkPostSaved,
} from "../../services/userService";

const UserProfile = () => {
  const toast = useRef(null);
  const { userId } = useParams();
  const navigate = useNavigate();
  const { profileImage: currentUserProfileImage } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("POSTS");
  const [loadingTab, setLoadingTab] = useState(false);

  // Dialog states
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedGallery, setSelectedGallery] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [hoveredComment, setHoveredComment] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCounts, setCommentsCounts] = useState({});

  const emojiRef = useRef(null);

  // Resetiraj loading stanje kada se komponenta mounta
  useEffect(() => {
    setLoading(false);
  }, []);

  // Tab icons
  const PostsIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      style={{ display: "block" }}
    >
      <title>Posts</title>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
        d="M3 3H21V21H3z"
      ></path>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
        d="M9.01486 3 9.01486 21"
      ></path>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
        d="M14.98514 3 14.98514 21"
      ></path>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
        d="M21 9.01486 3 9.01486"
      ></path>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
        d="M21 14.98514 3 14.98514"
      ></path>
    </svg>
  );

  const ReelsIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      style={{ display: "block" }}
    >
      <title>Reels</title>
      <g stroke="currentColor" strokeLinejoin="round" strokeWidth="2px">
        <path d="M2.0493 7.002 21.9503 7.002" fill="none"></path>
        <path
          strokeLinecap="round"
          d="M13.50427 2.001 16.36227 7.002"
          fill="none"
        ></path>
        <path
          strokeLinecap="round"
          d="M7.20677 2.1099 10.00177 7.0019"
          fill="none"
        ></path>
        <path
          d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552z"
          strokeLinecap="round"
          fill="none"
        ></path>
      </g>
      <path
        d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0z"
        fillRule="evenodd"
      ></path>
    </svg>
  );

  const TagIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      style={{ display: "block" }}
    >
      <title>Tagged</title>
      <path
        d="M10.201 3.797 12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h5.259A1.818 1.818 0 0 1 22 6.08v14.104a1.818 1.818 0 0 1-1.818 1.818H3.818A1.818 1.818 0 0 1 2 20.184V6.08a1.818 1.818 0 0 1 1.818-1.818h5.26a1.59 1.59 0 0 0 1.123-.465z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
      ></path>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
      >
        <path
          d="M18.598 22.002V21.4a3.949 3.949 0 0 0-3.948-3.949H9.495A3.949 3.949 0 0 0 5.546 21.4v.603"
          fill="none"
        ></path>
        <circle cx="12.07211" cy="11.07515" r="3.55556" fill="none"></circle>
      </g>
    </svg>
  );

  const items = [
    { label: "POSTS", icon: <PostsIcon /> },
    { label: "REELS", icon: <ReelsIcon /> },
    { label: "TAGGED", icon: <TagIcon /> },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserProfileById(userId);
        if (data.success) {
          setUserData(data.data);
          setIsFollowing(data.data.is_following || false);
        } else {
          console.error("Greška u dohvaćanju korisnika:", data.error);
          if (toast.current) {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: "Korisnik nije pronađen.",
              life: 3000,
            });
          }
          navigate("/home");
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja korisnika:", error);
        if (toast.current) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Došlo je do greške pri dohvaćanju korisnika.",
            life: 3000,
          });
        }
        navigate("/home");
      } finally {
        setLoading(false);
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

    if (userId) {
      fetchUserData();
      fetchCurrentUser();
    }
  }, [userId, navigate]);

  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        const data = await getUserImagesById(userId);
        if (data.success) {
          setUserImages(data.images);
          
          // Dohvati broj komentara za svaku sliku
          const commentsData = {};
          for (const image of data.images) {
            try {
              const commentsResponse = await getCommentsForImage(image.id);
              if (commentsResponse.success) {
                commentsData[image.id] = commentsResponse.comments.length;
              } else {
                commentsData[image.id] = 0;
              }
            } catch (error) {
              console.error(`Greška kod dohvaćanja komentara za sliku ${image.id}:`, error);
              commentsData[image.id] = 0;
            }
          }
          setCommentsCounts(commentsData);
        } else {
          console.error("Greška u dohvaćanju slika:", data.error);
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja slika:", error);
      }
    };

    if (userId) {
      fetchUserImages();
    }
  }, [userId]);

  const handleTabChange = (e) => {
    console.log(
      "Tab changed to index:",
      e.index,
      "label:",
      items[e.index].label
    );
    setLoadingTab(true);
    setActiveTab(items[e.index].label);

    // Resetiraj glavno loading stanje kada se mijenjaju tabovi
    setLoading(false);

    setTimeout(() => {
      setLoadingTab(false);
    }, 500);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - commentTime) / 1000);

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

  const handleImageLoad = (imageId) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
  };

  const handleImageError = (imageId) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
  };

  const handleFollow = async () => {
    try {
      const action = isFollowing ? unfollowUser : followUser;
      const data = await action(userId);

      if (data.success) {
        setIsFollowing(!isFollowing);

        setUserData((prevData) => ({
          ...prevData,
          followers: isFollowing
            ? prevData.followers - 1
            : prevData.followers + 1,
        }));

        if (toast.current) {
          toast.current.show({
            severity: "success",
            summary: isFollowing ? "Unfollowed" : "Followed",
            detail: isFollowing
              ? "Uspješno otpratili korisnika!"
              : "Uspješno zapratili korisnika!",
            life: 3000,
          });
        }
      } else {
        if (toast.current) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: data.error || "Greška pri prati korisnika.",
            life: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Greška pri prati korisnika:", error);
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Došlo je do greške pri prati korisnika.",
          life: 3000,
        });
      }
    }
  };

  const openImageDialog = async (image) => {
    const gallery = Array.isArray(image.images) && image.images.length > 0
      ? image.images
      : [image.image_url];
    setSelectedGallery(gallery);
    setSelectedIndex(0);
    setSelectedImage(gallery[0]);
    setSelectedImageId(image.id);
    setIsImageDialogOpen(true);

    const updatedImage = userImages.find((img) => img.id === image.id);
    if (updatedImage) {
      setLiked(updatedImage.user_liked || false);
      setLikesCount(updatedImage.likes_count || 0);
    } else {
      setLiked(image.user_liked || false);
      setLikesCount(image.likes_count || 0);
    }

    try {
      const savedData = await checkPostSaved(image.id);
      if (savedData.success) {
        setBookmarked(savedData.user_saved);
      }
    } catch (error) {
      console.error("Greška pri provjeri spremanja slike:", error);
    }

    try {
      const data = await getCommentsForImage(image.id);
      if (data.success) {
        setComments(data.comments);
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
  };

  const openMoreDialog = () => setIsMoreDialogOpen(true);
  const closeMoreDialog = () => setIsMoreDialogOpen(false);

  const addEmoji = (emojiObject) => {
    setNewComment((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const data = await submitCommentForImage(selectedImageId, newComment);
      if (data.success) {
        setComments((prevComments) => [
          {
            id: data.comment_id,
            user: currentUser?.username || "Unknown User",
            text: newComment,
            created_at: data.created_at,
            likes_count: 0,
            user_liked: false,
            user_profile_image:
              currentUser?.profile_image_url || profilePicDefault,
          },
          ...prevComments,
        ]);
        
        // Ažuriraj broj komentara u grid-u
        setCommentsCounts((prev) => ({
          ...prev,
          [selectedImageId]: (prev[selectedImageId] || 0) + 1,
        }));
        
        setNewComment("");
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
      const data = await deleteCommentById(selectedCommentId);
      if (data.success) {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== selectedCommentId)
        );
        
        // Ažuriraj broj komentara u grid-u
        setCommentsCounts((prev) => ({
          ...prev,
          [selectedImageId]: Math.max(0, (prev[selectedImageId] || 0) - 1),
        }));
        
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <>
      <div className="main-profile-container">
        <div className="header-profile-container">
          <div className="left-header-container">
            <div className="main-story-container-profile">
              <div className="outer-circle-profile">
                <div className="middle-circle-profile"></div>
                <div className="story-container-profile">
                  <img
                    src={userData.profile_image_url || profilePicDefault}
                    alt="Profile"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="right-header-container">
            <div className="right-inner-header-container">
              <p className="username-profile-text">
                {userData.username}
                {userData.is_verified && (
                  <span style={{ marginLeft: "8px", color: "#0095f6" }}>✓</span>
                )}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  className={isFollowing ? "unfollow-button" : "follow-button"}
                  label={isFollowing ? "Following" : "Follow"}
                  onClick={handleFollow}
                  style={{
                    backgroundColor: isFollowing ? "#F0F2F5" : "#4a5df9",
                    color: isFollowing ? "#262626" : "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "7px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                />
                <Button
                  className="message-button"
                  label="Message"
                  onClick={() =>
                    navigate("/home/messages", { state: { openWithUserId: userData.id } })
                  }
                  style={{
                    backgroundColor: "#F0F2F5",
                    color: "#262626",
                    border: "none",
                    borderRadius: "8px",
                    padding: "7px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                />
                <Button
                  className="addUser-button"
                  icon="pi pi-user-plus"
                  style={{
                    backgroundColor: "#F0F2F5",
                    color: "#262626",
                    border: "none",
                    borderRadius: "8px",
                    padding: "7px",
                    cursor: "pointer",
                  }}
                />
                <Button
                  icon="pi pi-ellipsis-h"
                  onClick={openMoreDialog}
                  style={{
                    backgroundColor: "transparent",
                    color: "#262626",
                    border: "none",
                    borderRadius: "8px",
                    padding: "7px",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
            <div className="right-inner-middle-container">
              <p className="middle-profile-text">
                <strong>{userImages.length}</strong> posts
              </p>
              <p className="middle-profile-text">
                <strong>{userData.followers || 0}</strong> followers
              </p>
              <p className="middle-profile-text">
                <strong>{userData.following || 0}</strong> following
              </p>
            </div>
            <div className="right-middle-header-container">
              <p className="bottom-profile-text">
                <strong>{userData.full_name}</strong>
              </p>
              {userData.bio && (
                <p className="bottom-profile-text">{userData.bio}</p>
              )}
              {userData.website && (
                <a
                  href={userData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#00376b", textDecoration: "none" }}
                >
                  {userData.website}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="line-profile">
          <TabMenu
            style={{
              display: "flex",
              width: "100%",
              height: "5em",
              overflow: "hidden",
            }}
            model={items}
            activeIndex={items.findIndex((item) => item.label === activeTab)}
            onTabChange={handleTabChange}
          />
          {loadingTab ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "300px",
                width: "95%",
              }}
            >
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {activeTab === "POSTS" &&
                (userImages.length > 0 ? (
                  <div className="user-images-wrapper">
                    <div className="user-images-container">
                      {userImages.map((image) => (
                        <div
                          key={image.id}
                          className="userProfile-image"
                          style={{ position: "relative" }}
                          onClick={() => openImageDialog(image)}
                        >
                          {imageLoadingStates[image.id] !== false && (
                            <div className="image-skeleton">
                              <div className="skeleton-shimmer"></div>
                            </div>
                          )}
                          <img
                            src={image.image_url}
                            alt="User Post"
                            className="uploaded-image"
                            style={{
                              display:
                                imageLoadingStates[image.id] === false
                                  ? "block"
                                  : "none",
                            }}
                            onLoad={() => handleImageLoad(image.id)}
                            onError={() => handleImageError(image.id)}
                          />
                          {Array.isArray(image.images) && image.images.length > 1 && (
                            <img
                              src={multiPhotosIcon}
                              alt="Multiple photos"
                              aria-label="Multiple images"
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                width: 18,
                                height: 18,
                              }}
                            />
                          )}
                          
                          {/* Image overlay with stats */}
                          <div className="image-overlay">
                            <div className="image-stats">
                              <div className="stat-item">
                                <svg className="stat-icon" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 1.29-.35 2.5-.95 3.5l-8.55 8.55a1 1 0 0 1-1.414 0l-8.55-8.55a4.989 4.989 0 0 1-.95-3.5 4.989 4.989 0 0 1 4.708-5.218A4.989 4.989 0 0 1 12 4.5a4.989 4.989 0 0 1 4.792-.596Z"/>
                                </svg>
                                <span>{image.likes_count || image.likers?.length || 0}</span>
                              </div>
                              <div className="stat-item">
                                <svg className="stat-icon" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"/>
                                </svg>
                                <span>{commentsCounts[image.id] || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="noPhoto-container">
                    <svg
                      aria-label="Camera"
                      className="x1lliihq x1n2onr6 x5n08af"
                      fill="currentColor"
                      height="62"
                      role="img"
                      viewBox="0 0 96 96"
                      width="62"
                    >
                      <title>Camera</title>
                      <circle
                        cx="48"
                        cy="48"
                        fill="none"
                        r="47"
                        stroke="currentColor"
                        strokeMiterlimit="10"
                        strokeWidth="2"
                      ></circle>
                      <ellipse
                        cx="48.002"
                        cy="49.524"
                        fill="none"
                        rx="10.444"
                        ry="10.476"
                        stroke="currentColor"
                        strokeLinejoin="round"
                        strokeWidth="2.095"
                      ></ellipse>
                      <path
                        d="M63.994 69A8.02 8.02 0 0 0 72 60.968V39.456a8.023 8.023 0 0 0-8.01-8.035h-1.749a4.953 4.953 0 0 1-4.591-3.242C56.61 25.696 54.859 25 52.469 25h-8.983c-2.39 0-4.141.695-5.181 3.178a4.954 4.954 0 0 1-4.592 3.242H32.01a8.024 8.024 0 0 0-8.012 8.035v21.512A8.02 8.02 0 0 0 32.007 69Z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                    <p className="noPosts-text">No posts yet</p>
                  </div>
                ))}
              {activeTab === "REELS" && (
                <div className="reels-container">
                  <p className="reels-text">No reels yet.</p>
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

        {/* Image Dialog */}
        <Dialog
          visible={isImageDialogOpen}
          onHide={closeImageDialog}
          dismissableMask
          className="custom-image-dialog"
          style={{ borderRadius: "4px" }}
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
            <div className="left-image-container" style={{ position: "relative" }}>
              {selectedImage && (
                <>
                  {imageLoadingStates["dialog"] !== false && (
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
                        imageLoadingStates["dialog"] === false
                          ? "block"
                          : "none",
                    }}
                    onLoad={() => handleImageLoad("dialog")}
                    onError={() => handleImageError("dialog")}
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
                        <path d="M15 18l-6-6 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  {selectedGallery.length > 1 && selectedIndex < selectedGallery.length - 1 && (
                    <button
                      aria-label="Next"
                      onClick={() => {
                        const nextIndex = Math.min(selectedGallery.length - 1, selectedIndex + 1);
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 6l6 6-6 6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  {/* dots */}
                  {selectedGallery.length > 1 && (
                    <div className="up-dots">
                      {selectedGallery.map((_, i) => (
                        <span key={i} className={`up-dot ${i === selectedIndex ? 'active' : ''}`} />
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
                        src={userData.profile_image_url || profilePicDefault}
                        alt="User Profile"
                      />
                    </div>
                  </div>
                  <div className="right-container-username_second">
                    <p
                      className="create-username-text"
                      style={{
                        marginTop:
                          userImages.find((img) => img.id === selectedImageId)
                            ?.location || userData.location
                            ? ""
                            : "1.5em",
                      }}
                    >
                      {userData.username}
                    </p>
                    {(userImages.find((img) => img.id === selectedImageId)
                      ?.location ||
                      userData.location) && (
                      <p className="post-location-text">
                        {userImages.find((img) => img.id === selectedImageId)
                          ?.location || userData.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="more_post_container" onClick={openMoreDialog}>
                  <img className="morePic" src={morePic} alt="More" />
                </div>
              </div>
              <div className="dialog-divider-second"></div>
              <div className="main_post_container">
                <div className="profile_picture_main_post_container">
                  <div className="right-container-username">
                    <div className="comments-container">
                      {userImages.find((img) => img.id === selectedImageId)
                        ?.description && (
                        <div className="single_comment description">
                          <img
                            src={
                              userData.profile_image_url || profilePicDefault
                            }
                            alt="User Profile"
                            className="comment_profile_pic"
                          />
                          <p className="comment_text">
                            <strong className="comment_username">
                              {userData.username}
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
                                      setComments(data.comments);
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
                    onClick={async () => {
                      try {
                        if (liked) {
                          await unlikePost(selectedImageId);
                          setLikesCount((prev) => Math.max(0, prev - 1));
                        } else {
                          await likePost(selectedImageId);
                          setLikesCount((prev) => prev + 1);
                        }
                        setLiked((prev) => !prev);

                        // Ažuriraj podatke u listi slika
                        setUserImages((prevImages) =>
                          prevImages.map((img) =>
                            img.id === selectedImageId
                              ? {
                                  ...img,
                                  user_liked: !liked,
                                  likes_count: liked
                                    ? Math.max(0, img.likes_count - 1)
                                    : img.likes_count + 1,
                                  // Ažuriraj likers array
                                  likers: liked
                                    ? img.likers.filter(
                                        (liker) =>
                                          liker.username !==
                                          currentUser?.username
                                      )
                                    : [
                                        {
                                          username: currentUser?.username,
                                          created_at: new Date().toISOString(),
                                        },
                                        ...img.likers,
                                      ],
                                }
                              : img
                          )
                        );
                      } catch (error) {
                        console.error("Greška pri lajkanju slike:", error);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <img
                    className="footerPicBookMark"
                    src={bookmarked ? bookMarkPicActive : bookMarkPic}
                    alt="Save"
                    onClick={async () => {
                      try {
                        if (bookmarked) {
                          // Ukloni iz spremanih
                          await unsavePost(selectedImageId);
                          setBookmarked(false);
                        } else {
                          // Dodaj u spremljene
                          await savePost(selectedImageId);
                          setBookmarked(true);
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
                    {likesCount > 0
                      ? (() => {
                          // Dohvati podatke o slici iz liste slika
                          const currentImage = userImages.find(
                            (img) => img.id === selectedImageId
                          );
                          const likers = currentImage?.likers || [];

                          if (likers.length === 0) return "";

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
                      height="24"
                      role="img"
                      viewBox="0 0 24 24"
                      width="24"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker((prev) => !prev);
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
          style={{ width: "25em", borderRadius: "4px" }}
        >
          <div className="more-dialog-content">
            <p className="more-dialog-option" style={{ color: "#ED4956" }}>
              Block
            </p>
            <div className="dialog-divider-second"></div>

            <p className="more-dialog-option" style={{ color: "#ED4956" }}>
              Restrict
            </p>
            <div className="dialog-divider-second"></div>

            <p className="more-dialog-option" style={{ color: "#ED4956" }}>
              Report
            </p>
            <div className="dialog-divider-second"></div>

            <p className="more-dialog-option">Share to...</p>
            <div className="dialog-divider-second"></div>

            <p className="more-dialog-option">About this account</p>
            <div className="dialog-divider-second"></div>
            <p className="more-dialog-option">Cancel</p>
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
            borderRadius: "4px",
            marginTop: "-2em",
            marginLeft: "-30em",
          }}
        >
          <div className="comment-dialog-content">
            {(() => {
              // Provjeri je li komentar od trenutnog korisnika
              const selectedComment = comments.find(comment => comment.id === selectedCommentId);
              const isOwnComment = selectedComment?.user === currentUser?.username;
              
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
                    <p className="comment-dialog-option" onClick={closeCommentDialog}>
                      Cancel
                    </p>
                  </>
                );
              } else {
                // Za komentare drugih korisnika - prikaži Report i Cancel
                return (
                  <>
                    <p className="comment-dialog-option delete-option">Report</p>
                    <p className="comment-dialog-option" onClick={closeCommentDialog}>
                      Cancel
                    </p>
                  </>
                );
              }
            })()}
          </div>
        </Dialog>
      </div>
      <Toast ref={toast} />
    </>
  );
};

export default UserProfile;
