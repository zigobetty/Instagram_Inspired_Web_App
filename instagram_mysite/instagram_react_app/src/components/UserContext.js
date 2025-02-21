import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true); // NOVO: loading state

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/user-profile/", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Greška kod dohvaćanja korisničkog profila.");
          setLoading(false);
          return;
        }

        const data = await response.json();
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
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <UserContext.Provider value={{ userData, profileImage, setProfileImage, loading }}>
      {children}
    </UserContext.Provider>
  );
};
