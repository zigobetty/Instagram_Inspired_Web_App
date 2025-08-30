import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import InstagramLoading from "./components/InstagramLoading/InstagramLoading";
import Login from "./components/LogIn/logIn";
import LogInSecond from "./components/LogIn_second/logIn_second";
import SignIn from "./components/SignIn/signIn";
import Home from "./components/Home/Home";
import HomeSidebar from "./components/HomeSidebar/HomeSidebar";
import SearchSidebar from "./components/SearchSidebar/SearchSidebar";
import ExploreSidebar from "./components/ExploreSidebar/ExploreSidebar";
import ReelsSidebar from "./components/ReelsSidebar/ReelsSidebar";
import MessagesSidebar from "./components/MessagesSidebar/MessagesSidebar";
import CreateSidebar from "./components/CreateSidebar/CreateSidebar";
import ProfileSidebar from "./components/ProfileSidebar/ProfileSidebar";
import ThreadsSidebar from "./components/ThreadsSidebar/ThreadsSidebar";
import NotificationsSidebar from "./components/NotificationsSidebar/NotificationsSidebar";
import ListUsers from "./components/ListUsers";
import UserDetail from "./components/UserDetail";
import UserProfile from "./components/UserProfile/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Prikaži loading ekran na početku
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (showLoading) {
    return <InstagramLoading />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/main_login" />} />{" "}
        <Route path="/main_login" element={<Login />} />
        <Route path="/login" element={<LogInSecond />} />
        <Route path="/signup" element={<SignIn />} />
        {/* PROTECTED HOME */}
        <Route path="/home" element={<ProtectedRoute />}>
          <Route element={<Home />}>
            <Route index element={<HomeSidebar />} />
            <Route path="dashboard" element={<HomeSidebar />} />
            <Route path="search" element={<SearchSidebar />} />
            <Route path="explore" element={<ExploreSidebar />} />
            <Route path="reels" element={<ReelsSidebar />} />
            <Route path="messages" element={<MessagesSidebar />} />
            <Route path="notifications" element={<NotificationsSidebar />} />
            <Route path="create" element={<CreateSidebar />} />
            <Route path="profile" element={<ProfileSidebar />} />
            <Route path="threads" element={<ThreadsSidebar />} />
            <Route path="users/:userId/profile" element={<UserProfile />} />
          </Route>
        </Route>
        <Route path="/users" element={<ListUsers />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="*" element={<Navigate to="/main_login" />} />
      </Routes>
    </Router>
  );
}

export default App;
