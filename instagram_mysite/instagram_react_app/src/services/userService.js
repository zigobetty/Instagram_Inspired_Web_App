const API_URL = "http://localhost:8000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getUserProfile = async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("Korisnik nije prijavljen");
  }

  const response = await fetch(`${API_URL}/get_user_profile/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Greška prilikom dohvaćanja profila. Status: ${response.status}`
    );
  }

  return response.json();
};

export const getUserImages = async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("Korisnik nije prijavljen");
  }

  const response = await fetch(`${API_URL}/get-user-images/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Greška prilikom dohvaćanja slika. Status: ${response.status}`
    );
  }

  return response.json();
};

export const uploadProfileImage = async (base64Image) => {
  const response = await fetch(`${API_URL}/update-profile-image/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ picture: base64Image }),
  });

  if (!response.ok) {
    throw new Error(
      `Greška pri uploadu profilne slike. Status: ${response.status}`
    );
  }

  return response.json();
};

export const removeProfileImage = async () => {
  const response = await fetch(`${API_URL}/remove-profile-image/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Greška pri uklanjanju profilne slike. Status: ${response.status}`
    );
  }

  return response.json();
};

export const deleteUserImageById = async (imageId) => {
  const response = await fetch(`${API_URL}/delete-image/${imageId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška kod brisanja slike. Status: ${response.status}`);
  }

  return response.json();
};

export const getCommentsForImage = async (imageId) => {
  const response = await fetch(`${API_URL}/get-comments/${imageId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Greška kod dohvaćanja komentara. Status: ${response.status}`
    );
  }

  return response.json();
};

export const submitCommentForImage = async (postId, text) => {
  const response = await fetch(`${API_URL}/add-comment/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ post_id: postId, text }),
  });

  if (!response.ok) {
    throw new Error(
      `Greška kod dodavanja komentara. Status: ${response.status}`
    );
  }

  return response.json();
};
export const deleteCommentById = async (commentId) => {
  const response = await fetch(`${API_URL}/delete-comment/${commentId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Greška kod brisanja komentara. Status: ${response.status}`
    );
  }

  return response.json();
};

export const logoutUser = async () => {
  const token = localStorage.getItem("authToken");
  const refresh = localStorage.getItem("refreshToken");

  const response = await fetch(`${API_URL}/logout/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh })
  });

  if (!response.ok) {
    throw new Error(`Greška pri odjavi. Status: ${response.status}`);
  }

  return response.json();
};


export const uploadUserImage = async (postData) => {
  const requestBody = {
    images: Array.isArray(postData.images) ? postData.images : (postData.image ? [postData.image] : []),
    description: postData.description || "",
    location: postData.location || null,
    alt_text: postData.alt_text || null,
    options: postData.options || {},
  };

  const response = await fetch(`${API_URL}/upload-image/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(requestBody),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Greška pri kreiranju objave. Status: ${response.status}`);
  }

  return response.json();
};

export const searchUsers = async (query) => {
  const response = await fetch(`${API_URL}/search-users/?query=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom pretrage korisnika. Status: ${response.status}`);
  }

  return response.json();
};

export const getUserProfileById = async (userId) => {
  const response = await fetch(`${API_URL}/get-user-profile/${userId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom dohvaćanja korisnika. Status: ${response.status}`);
  }

  return response.json();
};

export const getUserImagesById = async (userId) => {
  const response = await fetch(`${API_URL}/get-user-images/${userId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom dohvaćanja slika korisnika. Status: ${response.status}`);
  }

  return response.json();
};

export const followUser = async (userId) => {
  const response = await fetch(`${API_URL}/follow-user/${userId}/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom prati korisnika. Status: ${response.status}`);
  }

  return response.json();
};

export const unfollowUser = async (userId) => {
  const response = await fetch(`${API_URL}/unfollow-user/${userId}/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom otprati korisnika. Status: ${response.status}`);
  }

  return response.json();
};

export const likeComment = async (commentId) => {
  const response = await fetch(`${API_URL}/like-comment/${commentId}/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom lajkanja komentara. Status: ${response.status}`);
  }

  return response.json();
};

export const unlikeComment = async (commentId) => {
  const response = await fetch(`${API_URL}/unlike-comment/${commentId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom uklanjanja lajka. Status: ${response.status}`);
  }

  return response.json();
};

export const getCommentLikes = async (commentId) => {
  const response = await fetch(`${API_URL}/get-comment-likes/${commentId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom dohvaćanja lajkova. Status: ${response.status}`);
  }

  return response.json();
};


export const likePost = async (postId) => {
  const response = await fetch(`${API_URL}/like-post/${postId}/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom lajkanja slike. Status: ${response.status}`);
  }

  return response.json();
};

export const unlikePost = async (postId) => {
  const response = await fetch(`${API_URL}/unlike-post/${postId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom uklanjanja lajka s slike. Status: ${response.status}`);
  }

  return response.json();
};

export const getPostLikes = async (postId) => {
  const response = await fetch(`${API_URL}/get-post-likes/${postId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška prilikom dohvaćanja lajkova slike. Status: ${response.status}`);
  }

  return response.json();
};

export const deleteUser = async () => {
  const response = await fetch(`${API_URL}/delete-user`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška kod brisanja korisnika. Status: ${response.status}`);
  }

  return response.json();
};

export const savePost = async (postId) => {
  const response = await fetch(`${API_URL}/save-post/${postId}/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri spremanju slike. Status: ${response.status}`);
  }

  return response.json();
};

export const unsavePost = async (postId) => {
  const response = await fetch(`${API_URL}/unsave-post/${postId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri uklanjanju slike iz spremanih. Status: ${response.status}`);
  }

  return response.json();
};

export const getSavedPosts = async () => {
  const response = await fetch(`${API_URL}/get-saved-posts/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju spremanih slika. Status: ${response.status}`);
  }

  return response.json();
};

export const checkPostSaved = async (postId) => {
  const response = await fetch(`${API_URL}/check-post-saved/${postId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri provjeri spremanja slike. Status: ${response.status}`);
  }

  return response.json();
};

export const getFeedPosts = async (feedType = 'for_you') => {
  const response = await fetch(`${API_URL}/get-feed-posts/?type=${feedType}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju feed objava. Status: ${response.status}`);
  }

  return response.json();
};

export const getPostDetails = async (postId) => {
  const response = await fetch(`${API_URL}/get-post-likes/${postId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška kod dohvaćanja detalja o postu. Status: ${response.status}`);
  }

  return response.json();
};

export const getSuggestedUsers = async () => {
  const response = await fetch(`${API_URL}/suggested-users/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju suggested korisnika. Status: ${response.status}`);
  }

  return response.json();
};

export const getFollowingUsers = async () => {
  const response = await fetch(`${API_URL}/following-users/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju korisnika koje pratim. Status: ${response.status}`);
  }

  return response.json();
};

export const updateBioGender = async (bio, gender) => {
  const response = await fetch(`${API_URL}/update-bio-gender/`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bio, gender }),
  });

  if (!response.ok) {
    throw new Error(`Greška pri ažuriranju bio i gender. Status: ${response.status}`);
  }

  return response.json();
};

export const getUserFollowers = async () => {
  const response = await fetch(`${API_URL}/user/followers/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju followers-a. Status: ${response.status}`);
  }

  return response.json();
};

export const getUserFollowing = async () => {
  const response = await fetch(`${API_URL}/user/following/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju following-a. Status: ${response.status}`);
  }

  return response.json();
};

export const getUserFollowersById = async (userId) => {
  const response = await fetch(`${API_URL}/user/${userId}/followers/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju followers-a. Status: ${response.status}`);
  }

  return response.json();
};

export const getUserFollowingById = async (userId) => {
  const response = await fetch(`${API_URL}/user/${userId}/following/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri dohvaćanju following-a. Status: ${response.status}`);
  }

  return response.json();
};

export const removeFollower = async (followerId) => {
  const response = await fetch(`${API_URL}/user/followers/${followerId}/remove/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Greška pri uklanjanju follower-a. Status: ${response.status}`);
  }

  return response.json();
};

