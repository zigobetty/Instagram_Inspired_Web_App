import React, { useState, useEffect } from "react";
import "../HomeSidebar/HomeSidebar.css";
import profilePicDefault from "../../imgs/profile-user (1).png"; // Default slika

const HomeSidebar = () => {
  const [activeTab, setActiveTab] = useState("forYou"); // Početno aktivan tab je "For You"
  const [isActive, setIsActive] = useState(false);
  const [profileImage, setProfileImage] = useState(profilePicDefault); // Stanje za profilnu sliku

  const toggleActive = () => {
    setIsActive(!isActive); // Toggle aktivnog stanja kruga
  };

  // ✅ Fetch korisničke profilne slike
  useEffect(() => {
    const fetchProfileImage = async () => {
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
            return;
          }
          throw new Error("Failed to fetch user profile.");
        }

        const data = await response.json();
        if (data.success && data.data.profile_image_url) {
          setProfileImage(`${data.data.profile_image_url}?t=${Date.now()}`); // ✅ Forsira reload slike
        } else {
          setProfileImage(profilePicDefault); // Ako nema slike, postavi default
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja profilne slike:", error);
        setProfileImage(profilePicDefault); // Ako dođe do greške, koristi default
      }
    };

    fetchProfileImage();
  }, []); // 🔄 Fetch samo kad se komponenta mounta

  return (
    <>
      <div className="homeSidebar-header">
        <h2
          className={`forYou-text ${activeTab === "forYou" ? "active" : ""}`}
          onClick={() => setActiveTab("forYou")} // Klik na For You tab
        >
          For you
        </h2>

        <h2
          className={`following-text ${
            activeTab === "following" ? "active" : ""
          }`}
          onClick={() => setActiveTab("following")} // Klik na Following tab
        >
          Following
        </h2>
      </div>

      <div className="line"></div>

      {/* Prikazivanje krugova samo kad je aktivan tab 'For You' */}
      {activeTab === "forYou" && (
        <div className="main-story-container">
          {/* Vanjski veći krug */}
          <div
            className={`outer-circle ${isActive ? "active" : ""}`}
            onClick={toggleActive}
          >
            {/* Srednji bijeli krug */}
            <div className="middle-circle"></div>

            {/* Unutar njega manji krug sa slikom */}
            <div className="story-container">
              <img src={profileImage} alt="Story" />{" "}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeSidebar;
