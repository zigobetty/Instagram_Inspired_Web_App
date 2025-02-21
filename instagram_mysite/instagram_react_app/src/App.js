import React from "react";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/LogIn/logIn";
import SignIn from "./components/SignIn/signIn";
import LogInSecond from "./components/LogIn_second/logIn_second";
import ListUsers from "./components/ListUsers";
import UserDetail from "./components/UserDetail";
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
import "primereact/resources/themes/lara-light-blue/theme.css"; // Ispravan import
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { UserProvider } from "./components/UserContext";


import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignIn />} />
            <Route path="/login" element={<LogInSecond />} />
            <Route path="/home" element={<ProtectedRoute element={<Home />} />}>
              <Route index element={<HomeSidebar />} />{" "}
              {/* Defaultni sadržaj */}
              <Route path="search" element={<SearchSidebar />} />
              <Route path="explore" element={<ExploreSidebar />} />
              <Route path="reels" element={<ReelsSidebar />} />
              <Route path="messages" element={<MessagesSidebar />} />
              <Route path="notifications" element={<NotificationsSidebar />} />
              <Route path="create" element={<CreateSidebar />} />
              <Route path="profile" element={<ProfileSidebar />} />
              <Route path="threads" element={<ThreadsSidebar />} />
            </Route>
            <Route path="/users" element={<ListUsers />} />
            <Route path="/users/:id" element={<UserDetail />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
