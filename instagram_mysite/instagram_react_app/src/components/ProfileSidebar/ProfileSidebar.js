import "../ProfileSidebar/ProfileSidebar.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
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
  getUserFollowers,
  getUserFollowing,
  removeFollower,
} from "../../services/userService";
import { removeProfileImage as removeProfileImageAPI } from "../../services/userService";

const ProfileSidebar = () => {
  const navigate = useNavigate();
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
  const [isFollowersDialogOpen, setIsFollowersDialogOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersSearchTerm, setFollowersSearchTerm] = useState("");
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [isFollowersInputFocused, setIsFollowersInputFocused] = useState(false);
  const followersInputRef = useRef(null);
  const [followersFollowStatus, setFollowersFollowStatus] = useState({});
  const [removeConfirmationDialog, setRemoveConfirmationDialog] = useState({
    visible: false,
    follower: null,
  });
  
  // Following dialog state
  const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false);
  const [following, setFollowing] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingSearchTerm, setFollowingSearchTerm] = useState("");
  const [filteredFollowing, setFilteredFollowing] = useState([]);
  const [isFollowingInputFocused, setIsFollowingInputFocused] = useState(false);
  const followingInputRef = useRef(null);
  const [unfollowConfirmationDialog, setUnfollowConfirmationDialog] = useState({
    visible: false,
    user: null,
  });
  const [followingFollowStatus, setFollowingFollowStatus] = useState({});

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

  // Ažuriraj follow status u real-time kada se dogodi promjena
  useEffect(() => {
    const handleFollowStatusChange = () => {
      // Ažuriraj follow status za trenutnog korisnika
      const fetchUpdatedProfile = async () => {
        try {
          const data = await getUserProfile();
          if (data.success) {
            setUserData(prevData => ({
              ...prevData,
              following: data.data.following,
              followers: data.data.followers
            }));
          }
        } catch (error) {
          console.error("Greška pri ažuriranju profila:", error);
        }
      };
      
      fetchUpdatedProfile();
    };

    // Slušaj custom event za promjenu follow statusa
    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
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

          closeDialog();
        } else {
          console.error("Greška u odgovoru servera:", data.error);
        }
      } catch (error) {
        console.error("Greška pri uploadu slike:", error.message);
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

        closeDialog();
      } else {
        console.error("Greška kod brisanja profilne slike:", data.error);
      }
    } catch (error) {
      console.error(
        "Greška prilikom brisanja slike na serveru:",
        error.message
      );
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

  const openFollowersDialog = async () => {
    setIsFollowersDialogOpen(true);
    setFollowersLoading(true);

    try {
      const data = await getUserFollowers();
      if (data.success) {
        setFollowers(data.followers);
        setFilteredFollowers(data.followers);

        // Dohvati follow status za svakog follower-a
        const followStatusMap = {};
        for (const follower of data.followers) {
          try {
            const userDataResponse = await getUserProfileById(follower.id);
            if (userDataResponse.success) {
              followStatusMap[follower.id] =
                userDataResponse.data.is_following || false;
            }
          } catch (error) {
            console.error("Greška pri provjeri follow statusa:", error);
            followStatusMap[follower.id] = false;
          }
        }
        setFollowersFollowStatus(followStatusMap);
      } else {
        console.error("Greška pri dohvaćanju followers-a:", data.error);
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju followers-a:", error);
    } finally {
      setFollowersLoading(false);
    }
  };

  const closeFollowersDialog = () => {
    setIsFollowersDialogOpen(false);
    setFollowers([]);
    setFilteredFollowers([]);
    setFollowersSearchTerm("");
    setIsFollowersInputFocused(false);
    setFollowersFollowStatus({});
  };

  const openFollowingDialog = async () => {
    setIsFollowingDialogOpen(true);
    setFollowingLoading(true);

    try {
      const data = await getUserFollowing();
      if (data.success) {
        setFollowing(data.following);
        setFilteredFollowing(data.following);

        // Postavi sve korisnike kao "following" (true)
        const followStatusMap = {};
        data.following.forEach((user) => {
          followStatusMap[user.id] = true;
        });
        setFollowingFollowStatus(followStatusMap);
      } else {
        console.error("Greška pri dohvaćanju following-a:", data.error);
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju following-a:", error);
    } finally {
      setFollowingLoading(false);
    }
  };

  const closeFollowingDialog = () => {
    setIsFollowingDialogOpen(false);
    setFollowing([]);
    setFilteredFollowing([]);
    setFollowingSearchTerm("");
    setIsFollowingInputFocused(false);
    setFollowingFollowStatus({});
  };

  // Search logika za followers s debounce
  useEffect(() => {
    if (!followersSearchTerm.trim()) {
      setFilteredFollowers(followers);
      return;
    }

    const timeoutId = setTimeout(() => {
      const filtered = followers.filter(
        (follower) =>
          follower.username
            .toLowerCase()
            .includes(followersSearchTerm.toLowerCase()) ||
          follower.full_name
            .toLowerCase()
            .includes(followersSearchTerm.toLowerCase())
      );
      setFilteredFollowers(filtered);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [followersSearchTerm, followers]);

  // Search logika za following s debounce
  useEffect(() => {
    if (!followingSearchTerm.trim()) {
      setFilteredFollowing(following);
      return;
    }

    const timeoutId = setTimeout(() => {
      const filtered = following.filter(
        (user) =>
          user.username
            .toLowerCase()
            .includes(followingSearchTerm.toLowerCase()) ||
          user.full_name
            .toLowerCase()
            .includes(followingSearchTerm.toLowerCase())
      );
      setFilteredFollowing(filtered);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [followingSearchTerm, following]);

  // Follow funkcionalnost za followers
  const handleFollowFollower = async (followerId) => {
    try {
      const data = await followUser(followerId);
      if (data.success) {
        setFollowersFollowStatus((prev) => ({
          ...prev,
          [followerId]: true,
        }));

        // Dispatch custom event za ažuriranje follow statusa u recent searches
        window.dispatchEvent(new CustomEvent('followStatusChanged'));
      } else {
      }
    } catch (error) {
      console.error("Greška pri prati korisnika:", error);
    }
  };

  // Remove funkcionalnost za followers
  const handleRemoveFollower = async (followerId) => {
    try {
      const data = await removeFollower(followerId);
      if (data.success) {
        // Označi follower-a kao removed umjesto uklanjanja iz liste
        setFollowers((prev) =>
          prev.map((f) =>
            f.id === followerId ? { ...f, is_removed: true } : f
          )
        );
        setFilteredFollowers((prev) =>
          prev.map((f) =>
            f.id === followerId ? { ...f, is_removed: true } : f
          )
        );

        // Ažuriraj broj followers-a u userData
        setUserData((prev) => ({
          ...prev,
          followers: prev.followers - 1,
        }));

        // Zatvori confirmation dialog
        setRemoveConfirmationDialog({ visible: false, follower: null });

        // Dispatch custom event za ažuriranje follow statusa u recent searches
        window.dispatchEvent(new CustomEvent('followStatusChanged'));
      } else {
      }
    } catch (error) {
      console.error("Greška pri uklanjanju follower-a:", error);
    }
  };

  // Unfollow funkcionalnost za following
  const handleUnfollowUser = async (userId) => {
    try {
      const data = await unfollowUser(userId);
      if (data.success) {
        // Promijeni status korisnika s "following" na "not following"
        setFollowingFollowStatus((prev) => ({
          ...prev,
          [userId]: false,
        }));

        // Ažuriraj broj following-a u userData
        setUserData((prev) => ({
          ...prev,
          following: prev.following - 1,
        }));

        // Zatvori confirmation dialog
        setUnfollowConfirmationDialog({ visible: false, user: null });

        // Dispatch custom event za ažuriranje follow statusa u recent searches
        window.dispatchEvent(new CustomEvent('followStatusChanged'));
      } else {
        console.error("Greška pri unfollow korisnika:", data.error);
      }
    } catch (error) {
      console.error("Greška pri unfollow korisnika:", error);
    }
  };

  // Follow funkcionalnost za following
  const handleFollowUser = async (userId) => {
    try {
      const data = await followUser(userId);
      if (data.success) {
        // Promijeni status korisnika s "not following" na "following"
        setFollowingFollowStatus((prev) => ({
          ...prev,
          [userId]: true,
        }));

        // Ažuriraj broj following-a u userData
        setUserData((prev) => ({
          ...prev,
          following: prev.following + 1,
        }));

        // Dispatch custom event za ažuriranje follow statusa u recent searches
        window.dispatchEvent(new CustomEvent('followStatusChanged'));
      } else {
        console.error("Greška pri follow korisnika:", data.error);
      }
    } catch (error) {
      console.error("Greška pri follow korisnika:", error);
    }
  };

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

        // Dispatch custom event za ažuriranje follow statusa u recent searches
        window.dispatchEvent(new CustomEvent('followStatusChanged'));
      } else {
      }
    } catch (error) {
      console.error("Greška pri prati korisnika:", error);
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

        setIsImageDialogOpen(false);
        setIsMoreDialogOpen(false);
        setSelectedImageId(null);
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
              <Button
                className="editProfile-button"
                label="Edit Profile"
                onClick={() => navigate("/home/accounts/edit")}
              />
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
                <strong style={{ color: "black" }}>{userImages.length}</strong>{" "}
                posts
              </p>
              <p
                className="middle-profile-text"
                onClick={openFollowersDialog}
                style={{ cursor: "pointer" }}
              >
                <strong style={{ color: "black" }}>
                  {userData?.followers ?? 0}
                </strong>{" "}
                followers
              </p>
              <p
                className="middle-profile-text"
                onClick={openFollowingDialog}
                style={{ cursor: "pointer" }}
              >
                <strong style={{ color: "black" }}>
                  {userData?.following ?? 0}
                </strong>{" "}
                following
              </p>
            </div>

            <div className="right-middle-header-container">
              <p className="bottom-profile-text">
                <strong>{userData?.full_name || "Loading..."}</strong>
              </p>
              {userData?.bio && (
                <p className="bottom-profile-text bio-text">{userData.bio}</p>
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
                      <div
                        style={{
                          textAlign: "left",
                          paddingLeft: "2em",
                          paddingTop: "2em",
                          paddingBottom: "1em",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "90%",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#737373",
                            margin: 0,
                          }}
                        >
                          Only you can see what you've saved
                        </p>
                        <p
                          style={{
                            color: "#3143e3",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          + New Collection
                        </p>
                      </div>
                      <div className="user-images-container">
                        {savedPosts.map((post) => (
                          <div
                            key={post.id}
                            className="user-image"
                            onClick={() => openImageDialog(post)}
                          >
                            {imageLoadingStates[`saved_${post.id}`] !==
                              false && (
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
                                  imageLoadingStates[`saved_${post.id}`] ===
                                  false
                                    ? "block"
                                    : "none",
                              }}
                              onLoad={() => handleImageLoad(`saved_${post.id}`)}
                              onError={() =>
                                handleImageError(`saved_${post.id}`)
                              }
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
            <p className="dialog-text-remove" onClick={removeProfileImage}>
              Remove current photo
            </p>
            <div className="dialog-divider"></div>
            <p className="dialog-text-cancel" onClick={closeDialog}>
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

        {/* Followers Dialog */}
        <Dialog
          visible={isFollowersDialogOpen}
          onHide={closeFollowersDialog}
          className="custom-followers-dialog"
          dismissableMask
          style={{
            width: "25em",
            borderRadius: "12px",
            maxHeight: "80vh",
          }}
        >
          <div className="followers-dialog-content">
            <div className="followers-dialog-header">
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  textAlign: "center",
                  color: "black",
                }}
              >
                Followers
              </h3>
              <button
                onClick={closeFollowersDialog}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "16px",
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#737373",
                }}
              >
                ×
              </button>
            </div>

            <div
              className="followers-search-container"
              style={{ padding: "16px 16px 0 16px" }}
            >
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  ref={followersInputRef}
                  className="search-input"
                  placeholder="Search"
                  value={followersSearchTerm}
                  onChange={(e) => setFollowersSearchTerm(e.target.value)}
                  onFocus={() => setIsFollowersInputFocused(true)}
                  onBlur={() => setIsFollowersInputFocused(false)}
                  style={{
                    width: "100%",
                    paddingLeft: isFollowersInputFocused ? "1em" : "2em",
                    paddingRight: "2.5em",
                    paddingTop: "0.75em",
                    paddingBottom: "0.75em",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#f5f5f5",
                  }}
                />
                {!isFollowersInputFocused && (
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
                {isFollowersInputFocused && followersSearchTerm && (
                  <i
                    className="pi pi-times-circle"
                    style={{
                      position: "absolute",
                      right: "0.5em",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#aaa",
                      cursor: "pointer",
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFollowersSearchTerm("");
                      followersInputRef.current &&
                        followersInputRef.current.focus();
                    }}
                  ></i>
                )}
              </div>
            </div>

            <div
              className="followers-list-container"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                marginTop: "1em",
                padding: "0 16px 16px 16px",
              }}
            >
              {followersLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100px",
                  }}
                >
                  <div className="spinner"></div>
                </div>
              ) : filteredFollowers.length > 0 ? (
                filteredFollowers.map((follower) => (
                  <div
                    key={follower.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        marginRight: "12px",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        closeFollowersDialog();
                        if (follower.id === userData?.id) {
                          navigate("/home/profile");
                        } else {
                          navigate(`/home/users/${follower.id}/profile`);
                        }
                      }}
                    >
                      <img
                        src={follower.profile_image_url || profilePicDefault}
                        alt={follower.username}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                                         <div style={{ flex: 1, minWidth: 0 }}>
                       <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                         <p
                           style={{
                             margin: 0,
                             fontSize: "14px",
                             fontWeight: "600",
                             color: "black",
                             whiteSpace: "nowrap",
                             overflow: "hidden",
                             textOverflow: "ellipsis",
                           }}
                         >
                            {follower.username}
                          </p>
                         
                         {/* Točkica i Follow gumb - prikazuju se samo ako ne pratim tog korisnika */}
                         {!followersFollowStatus[follower.id] && (
                           <>
                             <div 
                               className="html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu x18d9i69 x9f619 xjbqb8w x1rg5ohu x15mokao x1ga7v0g x16uus16 xbiv7yw x11lfxj5 x135b78x x1uhb9sk x1plvlek xryxfnj x1c4vz4f x2lah0s x1oa3qoh"
                               style={{
                                 color: "#8e8e8e",
                                 fontSize: "14px",
                                 fontWeight: "600"
                               }}
                             >
                               ·
                             </div>
                             
                             <button
                               onClick={() => handleFollowFollower(follower.id)}
                               style={{
                                 backgroundColor: "transparent",
                                 color: "#4150f7",
                                 border: "none",
                                 fontSize: "12px",
                                 fontWeight: "600",
                                 cursor: "pointer",
                                 padding: 0,
                                 margin: 0
                               }}
                             >
                               Follow
                             </button>
                           </>
                         )}
                       </div>
                       
                       <p
                         style={{
                           margin: 0,
                           fontSize: "12px",
                           color: "#737373",
                           whiteSpace: "nowrap",
                           overflow: "hidden",
                           textOverflow: "ellipsis",
                         }}
                       >
                          {follower.full_name}
                        </p>
                      </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {/* Remove/Removed gumb */}
                      {follower.is_removed ? (
                        <button
                        style={{
                          backgroundColor: "#f0f2f5",
                          color: "black",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          padding: "9px 12px",
                          width: "90px",
                        }}                      
                        >
                          Removed
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setRemoveConfirmationDialog({
                              visible: true,
                              follower: follower,
                            })
                          }
                          className="remove-follower-button"
                          style={{
                            backgroundColor: "#f0f2f5",
                            color: "black",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: "9px 12px",
                            width: "90px",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#8e8e8e",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    {followersSearchTerm
                      ? "No results found."
                      : "No followers yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Dialog>

        {/* Remove Follower Confirmation Dialog */}
        <Dialog
          visible={removeConfirmationDialog.visible}
          onHide={() =>
            setRemoveConfirmationDialog({ visible: false, follower: null })
          }
          className="remove-confirmation-dialog"
          dismissableMask
          style={{
            width: "35em",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              padding: "24px",
              textAlign: "center",
            }}
          >
            {/* Profile Picture */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <img
                src={
                  removeConfirmationDialog.follower?.profile_image_url ||
                  profilePicDefault
                }
                alt="Profile"
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Title */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#262626",
              }}
            >
              Remove follower?
            </h3>

            {/* Description */}
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "#8e8e8e",
                lineHeight: "1.4",
              }}
            >
              Instagram won't tell {removeConfirmationDialog.follower?.username}{" "}
              that they were removed from your followers.
            </p>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <button
                onClick={() =>
                  handleRemoveFollower(removeConfirmationDialog.follower?.id)
                }
                style={{
                  backgroundColor: "transparent",
                  color: "#ed4956",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                Remove
              </button>
              <button
                onClick={() =>
                  setRemoveConfirmationDialog({
                    visible: false,
                    follower: null,
                  })
                }
                style={{
                  backgroundColor: "transparent",
                  color: "#262626",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Dialog>

        {/* Following Dialog */}
        <Dialog
          visible={isFollowingDialogOpen}
          onHide={closeFollowingDialog}
          className="custom-following-dialog"
          dismissableMask
          style={{
            width: "25em",
            borderRadius: "12px",
            maxHeight: "80vh",
          }}
        >
          <div className="following-dialog-content">
            <div className="following-dialog-header">
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  textAlign: "center",
                  color: "black",
                }}
              >
                Following
              </h3>
              <button
                onClick={closeFollowingDialog}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "16px",
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#737373",
                }}
              >
                ×
              </button>
            </div>

            <div
              className="following-search-container"
              style={{ padding: "16px 16px 0 16px" }}
            >
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  ref={followingInputRef}
                  className="search-input"
                  placeholder="Search"
                  value={followingSearchTerm}
                  onChange={(e) => setFollowingSearchTerm(e.target.value)}
                  onFocus={() => setIsFollowingInputFocused(true)}
                  onBlur={() => setIsFollowingInputFocused(false)}
                  style={{
                    width: "100%",
                    paddingLeft: isFollowingInputFocused ? "1em" : "2em",
                    paddingRight: "2.5em",
                    paddingTop: "0.75em",
                    paddingBottom: "0.75em",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#f5f5f5",
                  }}
                />
                {!isFollowingInputFocused && (
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
                {isFollowingInputFocused && followingSearchTerm && (
                  <i
                    className="pi pi-times-circle"
                    style={{
                      position: "absolute",
                      right: "0.5em",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#aaa",
                      cursor: "pointer",
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFollowingSearchTerm("");
                      followingInputRef.current &&
                        followingInputRef.current.focus();
                    }}
                  ></i>
                )}
              </div>
            </div>

            <div
              className="following-list-container"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                marginTop: "1em",
                padding: "0 16px 16px 16px",
              }}
            >
              {followingLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100px",
                  }}
                >
                  <div className="spinner"></div>
                </div>
              ) : filteredFollowing.length > 0 ? (
                filteredFollowing.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        marginRight: "12px",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        closeFollowingDialog();
                        if (user.id === userData?.id) {
                          navigate("/home/profile");
                        } else {
                          navigate(`/home/users/${user.id}/profile`);
                        }
                      }}
                    >
                      <img
                        src={user.profile_image_url || profilePicDefault}
                        alt={user.username}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "black",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user.username}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#737373",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user.full_name}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {followingFollowStatus[user.id] ? (
                        <button
                          onClick={() =>
                            setUnfollowConfirmationDialog({
                              visible: true,
                              user: user,
                            })
                          }
                          className="following-list-button"
                          style={{
                            backgroundColor: "#f0f2f5",
                            color: "black",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: "9px 12px",
                            width: "90px",
                          }}
                        >
                          Following
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollowUser(user.id)}
                          style={{
                            backgroundColor: "#4150f7",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: "9px 12px",
                            width: "90px",
                          }}
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#8e8e8e",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    {followingSearchTerm
                      ? "No results found."
                      : "Not following anyone yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Dialog>

        {/* Unfollow Confirmation Dialog */}
        <Dialog
          visible={unfollowConfirmationDialog.visible}
          onHide={() =>
            setUnfollowConfirmationDialog({ visible: false, user: null })
          }
          className="remove-confirmation-dialog"
          dismissableMask
          style={{
            width: "35em",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              padding: "24px",
              textAlign: "center",
            }}
          >
            {/* Profile Picture */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <img
                src={
                  unfollowConfirmationDialog.user?.profile_image_url ||
                  profilePicDefault
                }
                alt="Profile"
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Title */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#262626",
              }}
            >
              Unfollow @{unfollowConfirmationDialog.user?.username}?
            </h3>

            {/* Description */}
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "#8e8e8e",
                lineHeight: "1.4",
              }}
            >
              If you change your mind, you'll have to request to follow @{unfollowConfirmationDialog.user?.username} again.
            </p>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <button
                onClick={() =>
                  handleUnfollowUser(unfollowConfirmationDialog.user?.id)
                }
                style={{
                  backgroundColor: "transparent",
                  color: "#ed4956",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                Unfollow
              </button>
              <button
                onClick={() =>
                  setUnfollowConfirmationDialog({
                    visible: false,
                    user: null,
                  })
                }
                style={{
                  backgroundColor: "transparent",
                  color: "#262626",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Dialog>
      </div>
      <Toast ref={toast} />
    </>
  );
};

export default ProfileSidebar;
