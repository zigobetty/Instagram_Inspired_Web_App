import React, { useState, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "../Home/Home.css";
import SidebarCustom from "../SidebarCustom/SidebarCustom";
import { UserContext } from "../UserContext";

const Home = () => {
  const [forceRefresh, setForceRefresh] = useState(false);
  const { showSearchOverlay, showMessagesOverlay } = useContext(UserContext);
  const location = useLocation();

  const refreshImages = () => {
    setForceRefresh((prev) => !prev);
  };
  const isMessagesPage = location.pathname === "/home/messages" || location.pathname.includes("/home/messages/conversation/");
  const isAccountEditPage = location.pathname === "/home/accounts/edit";

  const isSidebarCollapsed = showMessagesOverlay;
  const sidebarWidth = isAccountEditPage ? "15em" : (isSidebarCollapsed ? "5em" : "19em");

 

  return (
    <div
      className="app-wrapper"
      style={{ display: "flex", width: "100vw", minHeight: "100vh" }}
    >
      <div
        className="sidebar"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          transition: "width 0.3s ease",
        }}
      >
        <SidebarCustom onImageUploaded={refreshImages} onHide={() => {}} />
      </div>
      <div
        className="main-app-container"
        style={{
          paddingTop: isMessagesPage || isAccountEditPage ? "0" : undefined,
        }}
      >
        <Outlet context={{ refreshImages }} />
      </div>
    </div>
  );
};

export default Home;
