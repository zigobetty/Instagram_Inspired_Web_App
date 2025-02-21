import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom"; // Dinamičke child rute
import "../Home/Home.css";
import SidebarCustom from "../SidebarCustom/SidebarCustom"; // Sidebar komponenta

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null); // Pohrana svih podataka korisnika

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/user-profile/",
          {
            method: "GET",
            credentials: "include", // Uključuje kolačiće za sesiju
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
          console.log("Podaci o korisniku:", data.data); // Logiraj sve podatke o korisniku
          setUserData(data.data); // Postavljamo podatke korisnika
        } else {
          console.error("Greška:", data.error);
        }
      } catch (error) {
        console.error("Greška kod dohvaćanja korisničkog profila:", error);
      } finally {
        setLoading(false); // Završeno učitavanje
      }
    };

    fetchUserProfile();
  }, []);

  // 🔹 Dodaj ovu funkciju za osvježavanje slika u ProfileSidebar
  const refreshImages = () => {
    console.log("Refreshing images...");
    setForceRefresh((prev) => !prev);
  };

  // Koristimo useState za forsiranje re-rendera
  const [forceRefresh, setForceRefresh] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflowX: "hidden" }}>
      <SidebarCustom
        onImageUploaded={refreshImages}
        onHide={() => {
        }}
      />
      <div
        style={{
          flex: 1,
          width: "119em",
          paddingLeft: "25em",
          paddingTop: "2.3em",
          overflowX: "hidden",
          backgroundColor:"white",
        }}
      >
        <Outlet context={{ refreshImages }} />
      </div>
    </div>
  );
};

export default Home;
