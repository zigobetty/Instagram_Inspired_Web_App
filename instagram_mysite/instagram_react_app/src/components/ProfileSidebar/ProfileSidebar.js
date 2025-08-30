import "../ProfileSidebar/ProfileSidebar.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import "../HomeSidebar/HomeSidebar.css";
import newStory from "../../imgs/plus.png";
import multiPhotosIcon from "../../imgs/multi_photos.png";
import profilePicDefault from "../../imgs/profile-user (1).png";
import noCameraPic from "../../imgs/cameraCircle.png";
import morePic from "../../imgs/more.png";
import settings from "../../imgs/settingsProfile.png";
import { Button } from "primereact/button";
import { TabMenu } from "primereact/tabmenu";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import HeartPic from "../../imgs/instaHeart.png";
import HeartActivePic from "../../imgs/instaHeartFull.png";

import bookMarkPic from "../../imgs/instaBookMarkOutline.png";
import bookMarkPicActive from "../../imgs/instaBookMark.png";

import EmojiPicker from "emoji-picker-react";
import { InputTextarea } from "primereact/inputtextarea";
import { UserContext } from "../UserContext";
import {
  getUserProfile,
  getUserImages,
  uploadProfileImage,
  deleteCommentById,
  getCommentsForImage,
  deleteUserImageById,
  submitCommentForImage,
  likeComment,
  unlikeComment,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getSavedPosts,
  checkPostSaved,
  followUser,
  unfollowUser,
  getUserProfileById,
} from "../../services/userService";
import { removeProfileImage as removeProfileImageAPI } from "../../services/userService";

const ProfileSidebar = () => {
  const toast = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profileImage, setProfileImage } = useContext(UserContext);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedGallery, setSelectedGallery] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [hoveredComment, setHoveredComment] = useState(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [activeTab, setActiveTab] = useState("POSTS");
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [likesCount, setLikesCount] = useState(0);
  const [likedByUsers, setLikedByUsers] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isFollowingCurrentUser, setIsFollowingCurrentUser] = useState(false);

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

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getUserImages();
        if (data.success) {
          setUserImages(data.images);
        } else {
          console.error("Server javio grešku:", data.error);
        }
      } catch (err) {
        console.error("Greška kod dohvaćanja slika:", err.message);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getUserImages();
        if (data.success) {
          setUserImages(data.images);
        } else {
          console.error("Server javio grešku:", data.error);
        }
      } catch (err) {
        console.error("Greška kod dohvaćanja slika:", err.message);
      }
    };

    fetchImages();
  }, [refreshImages]);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const data = await getSavedPosts();
        if (data.success) {
          setSavedPosts(data.saved_images);
        } else {
          console.error("Greška kod dohvaćanja spremanih slika:", data.error);
        }
      } catch (err) {
        console.error("Greška kod dohvaćanja spremanih slika:", err.message);
      }
    };

    fetchSavedPosts();
  }, []);

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

  const SaveIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      style={{ display: "block" }}
    >
      <title>Saved</title>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2px"
        d="M20 21 12 13.44 4 21 4 3 20 3 20 21z"
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
    { label: "SAVED", icon: <SaveIcon /> },
    { label: "TAGGED", icon: <TagIcon /> },
  ];

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      try {
        const base64Image = reader.result;
        const data = await uploadProfileImage(base64Image);

        if (data.success && data.profile_image_url) {
          console.log("Profilna slika ažurirana:", data.profile_image_url);
          setProfileImage(`${data.profile_image_url}?t=${Date.now()}`);

          toast.current.show({
            severity: "success",
            summary: "Profile Image Updated",
            detail: "Profilna slika je uspješno ažurirana!",
            life: 3000,
          });

          closeDialog();
        } else {
          console.error("Greška u odgovoru servera:", data.error);
          toast.current.show({
            severity: "error",
            summary: "Upload Failed",
            detail: data.error || "Greška pri ažuriranju profilne slike.",
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Greška pri uploadu slike:", error.message);
        toast.current.show({
          severity: "error",
          summary: "Upload Failed",
          detail:
            "Došlo je do greške pri uploadu slike. Molimo pokušajte kasnije.",
          life: 3000,
        });
      }
    };
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const removeProfileImage = async () => {
    try {
      const data = await removeProfileImageAPI();

      if (data.success) {
        console.log("Profilna slika uspješno uklonjena!");

        setProfileImage(profilePicDefault);

        toast.current.show({
          severity: "success",
          summary: "Profile Image Removed",
          detail: "Profilna slika je uspješno uklonjena!",
          life: 3000,
        });

        closeDialog();
      } else {
        console.error("Greška kod brisanja profilne slike:", data.error);
        toast.current.show({
          severity: "error",
          summary: "Remove Failed",
          detail: data.error || "Greška pri uklanjanju profilne slike.",
          life: 3000,
        });
      }
    } catch (error) {
      console.error(
        "Greška prilikom brisanja slike na serveru:",
        error.message
      );
      toast.current.show({
        severity: "error",
        summary: "Remove Failed",
        detail:
          "Došlo je do greške pri uklanjanju slike. Molimo pokušajte kasnije.",
        life: 3000,
      });
    }
  };

  const openImageDialog = async (image) => {
    const gallery =
      Array.isArray(image.images) && image.images.length > 0
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

    const currentSavedPost = savedPosts.find((post) => post.id === image.id);

    if (currentSavedPost && currentSavedPost.user.id !== userData?.id) {
      try {
        const userDataResponse = await getUserProfileById(
          currentSavedPost.user.id
        );
        if (userDataResponse.success) {
          const isFollowing = userDataResponse.data.is_following || false;
          setIsFollowingCurrentUser(isFollowing);
        } else {
          setIsFollowingCurrentUser(false);
        }
      } catch (error) {
        console.error("Greška pri provjeri follow statusa:", error);
        setIsFollowingCurrentUser(false);
      }
    } else {
      setIsFollowingCurrentUser(false);
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

  const handleFollow = async () => {
    try {
      const currentSavedPost = savedPosts.find(
        (post) => post.id === selectedImageId
      );
      if (!currentSavedPost) return;

      const action = isFollowingCurrentUser ? unfollowUser : followUser;
      const data = await action(currentSavedPost.user.id);

      if (data.success) {
        setIsFollowingCurrentUser(!isFollowingCurrentUser);

        setUserData((prevData) => ({
          ...prevData,
          following: isFollowingCurrentUser
            ? prevData.following - 1
            : prevData.following + 1,
        }));

        if (toast.current) {
          toast.current.show({
            severity: "success",
            summary: isFollowingCurrentUser ? "Unfollowed" : "Followed",
            detail: isFollowingCurrentUser
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

  const deleteUserImage = async () => {
    if (!selectedImageId) {
      console.error("Nema slike za brisanje!");
      return;
    }

    try {
      const data = await deleteUserImageById(selectedImageId);

      if (data.success) {
        console.log("Slika uspješno obrisana!");

        setUserImages((prevImages) =>
          prevImages.filter((img) => img.id !== selectedImageId)
        );

        toast.current.show({
          severity: "success",
          summary: "Image Deleted",
          detail: "Slika je uspješno obrisana!",
          life: 3000,
        });

        setIsImageDialogOpen(false);
        setIsMoreDialogOpen(false);
        setSelectedImageId(null);
      } else {
        console.error("Greška pri brisanju slike:", data.error);
        toast.current.show({
          severity: "error",
          summary: "Delete Failed",
          detail: data.error || "Greška pri brisanju slike.",
          life: 3000,
        });
      }
    } catch (error) {
      console.error(
        "Greška prilikom slanja zahtjeva za brisanje slike:",
        error
      );
      toast.current.show({
        severity: "error",
        summary: "Delete Failed",
        detail:
          "Došlo je do greške pri brisanju slike. Molimo pokušajte kasnije.",
        life: 3000,
      });
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const data = await submitCommentForImage(selectedImageId, newComment);

      if (data.success) {
        setComments((prevComments) => [
          {
            id: data.comment_id,
            user: userData.username,
            text: newComment,
            created_at: data.created_at, 
            likes_count: 0,
            user_liked: false,
            user_profile_image: profileImage || profilePicDefault,
          },
          ...prevComments,
        ]);
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
  }, [emojiRef]);

  const handleTabChange = (e) => {
    console.log(
      "Tab changed to index:",
      e.index,
      "label:",
      items[e.index].label
    );
    setLoadingTab(true);
    setActiveTab(items[e.index].label);

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
              <Button className="editProfile-button2" label="View archive" />
              <div className="tooltip-container">
                <svg
                  aria-label="Options"
                  className="settings-icon-profile x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title>Options</title>
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
                <strong>{userData?.full_name || "Loading..."}</strong>
              </p>
              {userData?.bio && (
                <p className="bottom-profile-text">{userData.bio}</p>
              )}
            </div>
          </div>
        </div>
        <div className="main-story-container-story-profile">
          {/* Vanjski veći krug */}
          <div
            className="story-wrapper"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              className={`outer-circle-story-profile ${
                isActive ? "active" : ""
              }`}
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
                          className="user-image"
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
                          {Array.isArray(image.images) &&
                            image.images.length > 1 && (
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
              {activeTab === "SAVED" && (
                <div
                  className="saved-container"
                  style={{ marginTop: "-0.2em" }}
                >
                  {savedPosts.length > 0 ? (
                    <>
                      <div style={{
                        textAlign: "left",
                        paddingLeft: "2em",
                        paddingTop: "2em",
                        paddingBottom: "1em",
                        display:"flex",
                        justifyContent:"space-between",
                        alignItems:"center",
                        width:"90%"
                      }}>
                        <p style={{
                          fontSize: "12px",
                          color: "#737373",
                          margin: 0
                        }}>
                          Only you can see what you've saved
                        </p>
                        <p style={{color:"#3143e3", fontSize:"14px", fontWeight:"500"}}>+ New Collection</p>
                      </div>
                      <div className="user-images-container">
                        {savedPosts.map((post) => (
                        <div
                          key={post.id}
                          className="user-image"
                          onClick={() => openImageDialog(post)}
                        >
                          {imageLoadingStates[`saved_${post.id}`] !== false && (
                            <div className="image-skeleton">
                              <div className="skeleton-shimmer"></div>
                            </div>
                          )}
                          <img
                            src={post.image_url}
                            alt="Saved Post"
                            className="uploaded-image"
                            style={{
                              display:
                                imageLoadingStates[`saved_${post.id}`] === false
                                  ? "block"
                                  : "none",
                            }}
                            onLoad={() => handleImageLoad(`saved_${post.id}`)}
                            onError={() => handleImageError(`saved_${post.id}`)}
                          />
                        </div>
                      ))}
                      </div>
                    </>
                  ) : (
                    <div className="noPhoto-container">
                      <svg
                        aria-label="Bookmark"
                        className="x1lliihq x1n2onr6 x5n08af"
                        fill="currentColor"
                        height="62"
                        role="img"
                        viewBox="0 0 96 96"
                        width="62"
                      >
                        <title>Bookmark</title>
                        <path d="M80 4H16c-3.314 0-6 2.686-6 6v76c0 1.105.895 2 2 2s2-.895 2-2V10c0-1.105.895-2 2-2h64c1.105 0 2 .895 2 2v76c0 1.105.895 2 2 2s2-.895 2-2V10c0-3.314-2.686-6-6-6z"></path>
                        <path d="M32 20h32c1.105 0 2-.895 2-2s-.895-2-2-2H32c-1.105 0-2 .895-2 2s.895 2 2 2z"></path>
                      </svg>
                      <p className="noPosts-text">No saved posts yet.</p>
                    </div>
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
        {/* Dialog prozor - profilna */}
        <Dialog
          header="Change profile photo"
          visible={isDialogOpen}
          className="custom-dialog"
          onHide={closeDialog}
          dismissableMask
          appendTo={document.body}
          style={{ borderRadius: "25px" }}
        >
          <div className="dialog-content">
            <div className="dialog-divider"></div>
            <div>
              <button
                className="custom-uploadPhoto-btn"
                onClick={() => fileInputRef.current.click()}
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
            >
              Remove current photo
            </p>
            <div className="dialog-divider"></div>
            <p
              className="dialog-text-cancel"
              onClick={closeDialog}
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
          style={{ borderRadius: "4px" }}
        >
          <div className="image-dialog-container">
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
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
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
                </>
              )}
              {/* dots */}
              {selectedGallery.length > 1 && (
                <div className="ps-dots">
                  {selectedGallery.map((_, i) => (
                    <span
                      key={i}
                      className={`ps-dot ${
                        i === selectedIndex ? "active" : ""
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="right-empty-container">
              <div className="header_post_container">
                <div className="profile_picture_header_post_container">
                  {/* left: profile pic */}
                  <div className="outer-circle-create">
                    <div className="story-container-create">
                      <img
                        src={(() => {
                          // Provjeri je li trenutno prikazana slika spremljena slika
                          const currentSavedPost = savedPosts.find(
                            (post) => post.id === selectedImageId
                          );
                          if (currentSavedPost) {
                            return (
                              currentSavedPost.user.profile_image_url ||
                              profilePicDefault
                            );
                          } else {
                            return profileImage;
                          }
                        })()}
                        alt="User Profile"
                      />
                    </div>
                  </div>

                  {/* right: username + location + follow */}
                  <div className="right-container-username_second">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <p
                        className="create-username-text"
                        style={{
                          marginTop: (() => {
                            // Provjeri je li trenutno prikazana slika spremljena slika
                            const currentSavedPost = savedPosts.find(
                              (post) => post.id === selectedImageId
                            );
                            if (currentSavedPost) {
                              return currentSavedPost.location ? "" : "1.5em";
                            } else {
                              return userImages.find(
                                (img) => img.id === selectedImageId
                              )?.location || userData?.location
                                ? ""
                                : "1.5em";
                            }
                          })(),
                        }}
                      >
                        {(() => {
                          // Provjeri je li trenutno prikazana slika spremljena slika
                          const currentSavedPost = savedPosts.find(
                            (post) => post.id === selectedImageId
                          );
                          if (currentSavedPost) {
                            return currentSavedPost.user.username;
                          } else {
                            return userData?.username || "Unknown User";
                          }
                        })()}
                      </p>

                      {/* Follow opcija za spremljene slike od drugog korisnika */}
                      {(() => {
                        const currentSavedPost = savedPosts.find(
                          (post) => post.id === selectedImageId
                        );
                        if (
                          currentSavedPost &&
                          currentSavedPost.user.id !== userData?.id &&
                          !isFollowingCurrentUser
                        ) {
                          return (
                            <>
                              <span
                                style={{
                                  color: "#262626",
                                  fontSize: "12px",
                                  marginTop: "0.55em",
                                }}
                              >
                                •
                              </span>
                              <button
                                onClick={handleFollow}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#4A5DF9",
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  padding: "0",
                                  margin: "0",
                                  marginTop: "0.55em",
                                }}
                              >
                                Follow
                              </button>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {(() => {
                      // Provjeri je li trenutno prikazana slika spremljena slika
                      const currentSavedPost = savedPosts.find(
                        (post) => post.id === selectedImageId
                      );
                      if (currentSavedPost && currentSavedPost.location) {
                        return (
                          <p className="post-location-text">
                            {currentSavedPost.location}
                          </p>
                        );
                      } else if (
                        userImages.find((img) => img.id === selectedImageId)
                          ?.location ||
                        userData?.location
                      ) {
                        return (
                          <p className="post-location-text">
                            {userImages.find(
                              (img) => img.id === selectedImageId
                            )?.location || userData?.location}
                          </p>
                        );
                      }
                      return null;
                    })()}
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
                    {/* Kombinirani div za opis slike i komentare */}
                    <div className="comments-container">
                      {(() => {
                        // Provjeri je li trenutno prikazana slika spremljena slika
                        const currentSavedPost = savedPosts.find(
                          (post) => post.id === selectedImageId
                        );
                        const description = currentSavedPost
                          ? currentSavedPost.description
                          : userImages.find((img) => img.id === selectedImageId)
                              ?.description;
                        const username = currentSavedPost
                          ? currentSavedPost.user.username
                          : userData?.username || "Unknown User";
                        const profileImageUrl = currentSavedPost
                          ? currentSavedPost.user.profile_image_url
                          : profileImage;

                        if (description) {
                          return (
                            <div className="single_comment description">
                              <img
                                src={profileImageUrl || profilePicDefault}
                                alt="User Profile"
                                className="comment_profile_pic"
                              />
                              <p className="description_text">
                                <strong className="comment_username">
                                  {username}
                                </strong>{" "}
                                {description}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {comments.map((comment, index) => (
                        <>
                          {" "}
                          <div className="single_comment" key={comment.id}>
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
                              {formatTimeAgo(comment.created_at || new Date())}
                            </span>
                            <span className="comment_likes">
                              {comment.likes_count > 0
                                ? `${comment.likes_count} likes`
                                : ""}
                            </span>
                            <span className="comment_reply">Reply</span>
                            {hoveredComment === index &&
                              (comment.user === userData?.username ||
                                comment.post_owner === userData?.username) && (
                                <img
                                  src={morePic}
                                  alt="More Options"
                                  className="comment_more_icon"
                                  onClick={() => openCommentDialog(comment.id)}
                                  style={{ cursor: "pointer" }}
                                />
                              )}
                          </div>
                        </>
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
                                          liker.username !== userData?.username
                                      )
                                    : [
                                        {
                                          username: userData?.username,
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

                          // Ažuriraj listu spremanih slika
                          setSavedPosts((prev) =>
                            prev.filter((post) => post.id !== selectedImageId)
                          );
                        } else {
                          // Dodaj u spremljene
                          await savePost(selectedImageId);
                          setBookmarked(true);

                          // Dohvati ažuriranu listu spremanih slika
                          const data = await getSavedPosts();
                          if (data.success) {
                            setSavedPosts(data.saved_images);
                          }
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
                            firstLiker.username === userData?.username;

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
          style={{ width: "25em", borderRadius: "25px" }}
        >
          <div className="more-dialog-content">
            {(() => {
              // Provjeri je li trenutno prikazana slika spremljena slika
              const currentSavedPost = savedPosts.find(
                (post) => post.id === selectedImageId
              );

              // Ako je spremljena slika i pripada drugom korisniku, prikaži opcije kao u UserProfile.js
              if (
                currentSavedPost &&
                currentSavedPost.user.id !== userData?.id
              ) {
                return (
                  <>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                    >
                      Block
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                    >
                      Restrict
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p
                      className="more-dialog-option"
                      style={{ color: "#ED4956" }}
                    >
                      Report
                    </p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">Share to...</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option">About this account</p>
                    <div className="dialog-divider-second"></div>
                    <p className="more-dialog-option" onClick={closeMoreDialog}>
                      Cancel
                    </p>
                  </>
                );
              } else {
                // Ako je vlastita slika ili vlastita spremljena slika, prikaži originalne opcije
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
              }
            })()}
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
            borderRadius: "4px",
            marginTop: "-2em",
            marginLeft: "-30em",
          }}
        >
          <div className="comment-dialog-content">
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
          </div>
        </Dialog>
      </div>
      <Toast ref={toast} />
    </>
  );
};

export default ProfileSidebar;
