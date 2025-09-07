const API_BASE_URL = 'http://localhost:8000';

// Dohvati trenutnog korisnika
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get_user_profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to fetch current user');
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// Dohvati sve razgovore za trenutnog korisnika
export const getConversations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to fetch conversations');
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

// Dohvati poruke za određeni razgovor
export const getConversationMessages = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to fetch messages');
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Kreiraj novi razgovor s korisnikom
export const createConversation = async (otherUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        other_user_id: otherUserId
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to create conversation');
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Označi poruke kao pročitane
export const markMessagesAsRead = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/mark-read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to mark messages as read');
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Pošalji poruku
export const sendMessage = async (conversationId, content, replyToMessage = null) => {
  try {
    const requestBody = {
      content: content
    };
    
    if (replyToMessage) {
      requestBody.reply_to = replyToMessage.id;
    }

    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/send-message/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Obriši razgovor
export const deleteConversation = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/delete/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// Obriši poruku
export const deleteMessage = async (conversationId, messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/${messageId}/delete/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to delete message');
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Block user
export const blockUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/block-user/${userId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to block user');
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

// Unblock user
export const unblockUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/unblock-user/${userId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to unblock user');
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

// Get blocked users
export const getBlockedUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blocked-users/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Failed to fetch blocked users');
    }
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    throw error;
  }
};
