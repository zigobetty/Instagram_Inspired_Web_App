import { createContext, useState, useEffect } from "react";
import { getUserProfile } from "../services/userService";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showMessagesOverlay, setShowMessagesOverlay] = useState(false);

  // Provjeri trenutnu rutu i postavi overlay stanje
  const checkCurrentRoute = () => {
    const currentPath = window.location.pathname;
    
    // Ako smo na Messages stranici ili u konverzaciji, aktiviraj Messages overlay
    if (currentPath === '/home/messages' || currentPath.includes('/home/messages/conversation/')) {
      setShowMessagesOverlay(true);
      setShowSearchOverlay(false);
    } else if (currentPath === '/home/search') {
      // Ako smo na Search stranici, aktiviraj Search overlay
      setShowSearchOverlay(true);
      setShowMessagesOverlay(false);
    } else {
      // Ako nismo na Messages ili Search stranici, deaktiviraj oba overlay-a
      setShowMessagesOverlay(false);
      setShowSearchOverlay(false);
    }
  };

  const fetchUserProfile = async () => {
    // Provjeri je li trenutna ruta jedna od stranica za prijavu
    const currentPath = window.location.pathname;
    const isAuthPage = ['/main_login', '/login', '/signup'].includes(currentPath);
    
    if (isAuthPage) {
      // Ako smo na stranici za prijavu, preskoči dohvaćanje profila
      setLoading(false);
      setUserData(null);
      setProfileImage(null);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      
      // Ako nema tokena, preskoči dohvaćanje profila
      if (!token) {
        setLoading(false);
        setUserData(null);
        setProfileImage(null);
        return;
      }

      const data = await getUserProfile();
      console.log("Dohvaćeni podaci:", data);
      
      if (data.success) {
        setUserData(data.data);
        setProfileImage(
          data.data.profile_image_url
            ? `${data.data.profile_image_url}?t=${Date.now()}`
            : null
        );
      }
    } catch (error) {
      console.error("Greška:", error);
      setUserData(null);
      setProfileImage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Provjeri trenutnu rutu prije pozivanja fetchUserProfile
    const currentPath = window.location.pathname;
    const isAuthPage = ['/main_login', '/login', '/signup'].includes(currentPath);
    
    if (!isAuthPage) {
      fetchUserProfile();
    } else {
      // Ako smo na auth stranici, postavi loading na false
      setLoading(false);
    }
    checkCurrentRoute(); // Provjeri trenutnu rutu pri učitavanju
  }, []); // Inicijalno dohvaćanje

  // Listener za promjene rute
  useEffect(() => {
    const handleRouteChange = () => {
      // Provjeri trenutnu rutu prije pozivanja fetchUserProfile
      const currentPath = window.location.pathname;
      const isAuthPage = ['/main_login', '/login', '/signup'].includes(currentPath);
      
      if (!isAuthPage) {
        fetchUserProfile();
      }
      checkCurrentRoute(); // Provjeri rutu kada se promijeni
    };

    // Dodaj listener za popstate event (navigacija kroz browser)
    window.addEventListener('popstate', handleRouteChange);
    
    // Dodaj listener za pushstate/replacestate (programska navigacija)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleRouteChange();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ 
        userData, 
        profileImage, 
        setProfileImage, 
        loading,
        showSearchOverlay,
        setShowSearchOverlay,
        showMessagesOverlay,
        setShowMessagesOverlay
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
