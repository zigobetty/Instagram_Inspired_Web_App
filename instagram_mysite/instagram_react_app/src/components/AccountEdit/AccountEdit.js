import React, { useContext, useEffect, useState, useRef } from "react";
import "./AccountEdit.css";
import { getUserProfile, updateBioGender } from "../../services/userService";
import profilePicDefault from "../../imgs/profile-user (1).png";
import { UserContext } from "../UserContext";
import { Dialog } from "primereact/dialog";
import { OverlayPanel } from "primereact/overlaypanel";
import { removeProfileImage as removeProfileImageAPI } from "../../services/userService";
import { uploadProfileImage } from "../../services/userService";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { RadioButton } from "primereact/radiobutton";

const AccountEdit = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { profileImage, setProfileImage } = useContext(UserContext);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [customGender, setCustomGender] = useState("");

  // Original values for comparison
  const [originalBio, setOriginalBio] = useState("");
  const [originalGender, setOriginalGender] = useState("Prefer not to say");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = React.useRef(null);
  const genderOverlayRef = React.useRef(null);

  const genderOptions = [
    { label: "Female", value: "female" },
    { label: "Male", value: "male" },
    { label: "Custom", value: "custom" },
    { label: "Prefer not to say", value: "none" },
  ];
  const handleSelect = (value) => {
    setGender(value);
    if (value !== "custom") {
      setCustomGender("");
      genderOverlayRef.current.hide();
    }
    // OverlayPanel se ne zatvara za "custom" opciju
  };

  // Check if there are any changes
  const hasChanges = () => {
    const currentGender = gender === "custom" ? customGender.trim() : gender;
    const originalGenderValue = originalGender === "custom" ? "" : originalGender;
    
    return bio !== originalBio || currentGender !== originalGenderValue;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!hasChanges()) return;

    try {
      const currentGender = gender === "custom" ? customGender.trim() : gender;
      
      const data = await updateBioGender(bio, currentGender);
      
      if (data.success) {
        // Update original values to current values
        setOriginalBio(bio);
        setOriginalGender(currentGender);
      } else {
        alert('Greška pri ažuriranju profila: ' + data.error);
      }
    } catch (error) {
      console.error('Greška pri slanju zahtjeva:', error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        if (data.success) {
          setProfile(data.data);
          setBio(data.data.bio || "");
          setGender(data.data.gender || "Prefer not to say");
          
          // Store original values for comparison
          setOriginalBio(data.data.bio || "");
          setOriginalGender(data.data.gender || "Prefer not to say");

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
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      if (data.success) {
        setProfile(data.data);
        setBio(data.data.bio || "");
        setGender(data.data.gender || "Prefer not to say");
        
        // Store original values for comparison
        setOriginalBio(data.data.bio || "");
        setOriginalGender(data.data.gender || "Prefer not to say");

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
      setProfile(null);
    }
  };
  const handleAccountsCentreClick = () => {
    window.open(
      "https://accountscenter.instagram.com/?entry_point=app_settings",
      "_blank"
    );
  };

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

          await fetchProfile();
        } else {
          console.error("Greška u odgovoru servera:", data.error);
        }
      } catch (error) {
        console.error("Greška pri uploadu slike:", error.message);
      }
    };
  };

  const removeProfileImage = async () => {
    try {
      const data = await removeProfileImageAPI();

      if (data.success) {
        console.log("Profilna slika uspješno uklonjena!");

        setProfileImage(profilePicDefault);
        await fetchProfile();

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

  return (
    <div className="account-edit-container">
      {/* Lijevi container - 20% širine */}
      <div className="left-sidebar">
        <div className="editAccount-settings-container">
          {" "}
          <p style={{ fontSize: "20px", fontWeight: "600", color: "black" }}>
            Settings
          </p>
        </div>

        {/* Meta kartica */}
        <div className="meta-card" onClick={handleAccountsCentreClick}>
          <div className="meta-header">
            <svg
              aria-label="Facebook wordmark and family of apps logo"
              className="meta-logo"
              fill="currentColor"
              height="12"
              role="img"
              viewBox="0 0 500 100"
              width="60"
              style={{
                color: "black",
              }}
            >
              <title>Facebook wordmark and family of apps logo</title>
              <defs>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="b"
                  x1="125"
                  x2="160.217"
                  y1="97"
                  y2="57.435"
                >
                  <stop offset=".21" stopColor="#0278F1"></stop>
                  <stop offset=".533" stopColor="#0180FA"></stop>
                </linearGradient>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="c"
                  x1="44"
                  x2="0"
                  y1="5"
                  y2="64"
                >
                  <stop offset=".427" stopColor="#0165E0"></stop>
                  <stop offset=".917" stopColor="#0180FA"></stop>
                </linearGradient>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="d"
                  x1="28.5"
                  x2="135"
                  y1="29"
                  y2="72"
                >
                  <stop stopColor="#0064E0"></stop>
                  <stop offset=".656" stopColor="#0066E2"></stop>
                  <stop offset="1" stopColor="#0278F1"></stop>
                </linearGradient>
                <clipPath id="a">
                  <path d="M0 0h496.236v100H0z" fill="#fff"></path>
                </clipPath>
              </defs>
              <g clipPath="url(#a)">
                <path
                  d="M182.141 3.213h18.808l31.98 57.849 31.979-57.849h18.401V98.27h-15.345V25.416l-28.042 50.448h-14.394l-28.042-50.448V98.27h-15.345V3.213ZM332.804 99.967c-7.107 0-13.353-1.573-18.739-4.718-5.387-3.146-9.586-7.504-12.595-13.07-3.011-5.569-4.515-11.95-4.515-19.148 0-7.287 1.47-13.738 4.413-19.35 2.942-5.613 7.027-10.004 12.255-13.173 5.229-3.168 11.238-4.753 18.027-4.753 6.744 0 12.55 1.596 17.416 4.787 4.865 3.191 8.611 7.661 11.237 13.41 2.624 5.749 3.938 12.492 3.938 20.233v4.21h-52.077c.95 5.794 3.292 10.354 7.027 13.68 3.735 3.328 8.453 4.991 14.157 4.991 4.571 0 8.509-.679 11.814-2.037 3.303-1.358 6.404-3.417 9.302-6.178l8.147 9.98c-8.103 7.425-18.038 11.136-29.807 11.136Zm11.204-56.389c-3.215-3.281-7.425-4.923-12.629-4.923-5.07 0-9.314 1.676-12.731 5.025-3.418 3.35-5.58 7.854-6.484 13.512h37.343c-.453-5.794-2.286-10.331-5.499-13.614ZM382.846 40.014h-14.123V27.453h14.123V6.676h14.802v20.777h21.455v12.561h-21.455v31.844c0 5.295.905 9.075 2.716 11.338 1.809 2.264 4.911 3.395 9.302 3.395 1.945 0 3.598-.078 4.956-.237a92.35 92.35 0 0 0 4.481-.646v12.425c-1.675.498-3.564.906-5.669 1.223a44.63 44.63 0 0 1-6.62.475c-15.979 0-23.968-8.735-23.968-26.208V40.014ZM496.236 98.27h-14.53v-9.913c-2.58 3.712-5.862 6.575-9.845 8.588-3.983 2.014-8.51 3.022-13.579 3.022-6.247 0-11.78-1.596-16.601-4.787s-8.612-7.581-11.373-13.172c-2.761-5.59-4.142-11.983-4.142-19.18 0-7.243 1.403-13.648 4.21-19.216 2.806-5.567 6.688-9.935 11.645-13.104 4.956-3.168 10.648-4.753 17.075-4.753 4.844 0 9.189.94 13.037 2.818a25.768 25.768 0 0 1 9.573 7.978v-9.098h14.53V98.27Zm-14.801-46.035c-1.585-4.028-4.085-7.207-7.503-9.54-3.418-2.33-7.367-3.496-11.848-3.496-6.338 0-11.384 2.128-15.141 6.382-3.758 4.255-5.635 10.004-5.635 17.246 0 7.289 1.809 13.06 5.431 17.314 3.621 4.255 8.532 6.382 14.734 6.382 4.571 0 8.645-1.176 12.222-3.53 3.575-2.353 6.155-5.522 7.74-9.506V52.235Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M108 0C95.66 0 86.015 9.294 77.284 21.1 65.284 5.821 55.25 0 43.24 0 18.76 0 0 31.862 0 65.586 0 86.69 10.21 100 27.31 100c12.308 0 21.16-5.803 36.897-33.31 0 0 6.56-11.584 11.072-19.564 1.582 2.553 3.243 5.3 4.997 8.253l7.38 12.414C102.03 91.848 110.038 100 124.551 100c16.659 0 25.931-13.492 25.931-35.034C150.483 29.656 131.301 0 108 0ZM52.207 59.241c-12.759 20-17.172 24.483-24.276 24.483-7.31 0-11.655-6.418-11.655-17.862 0-24.483 12.207-49.517 26.759-49.517 7.88 0 14.465 4.55 24.552 18.991-9.578 14.691-15.38 23.905-15.38 23.905Zm48.153-2.517-8.823-14.715a301.425 301.425 0 0 0-6.884-10.723c7.952-12.274 14.511-18.39 22.313-18.39 16.206 0 29.172 23.863 29.172 53.173 0 11.172-3.659 17.655-11.241 17.655-7.268 0-10.739-4.8-24.537-27Z"
                  fill="#0180FA"
                ></path>
                <path
                  d="M145.586 35H130.66c3.452 8.746 5.478 19.482 5.478 31.069 0 11.172-3.659 17.655-11.241 17.655-1.407 0-2.672-.18-3.897-.631V99.82c1.143.122 2.324.18 3.552.18 16.659 0 25.931-13.492 25.931-35.034 0-10.737-1.774-20.95-4.897-29.966Z"
                  fill="url(#b)"
                ></path>
                <path
                  d="M43.241 0c.254 0 .507.003.759.008v16.36c-.32-.015-.642-.023-.965-.023-14.183 0-26.139 23.782-26.736 47.655H.014C.59 30.87 19.143 0 43.24 0Z"
                  fill="url(#c)"
                ></path>
                <path
                  d="M43.241 0c11.152 0 20.601 5.02 31.502 17.971 3.065 3.828 6.761 8.805 10.716 14.557l.017.025.025-.003a311.041 311.425 0 0 1 6.036 9.459l8.823 14.715c13.798 22.2 17.269 27 24.537 27H125v16.273c-.149.002-.298.003-.448.003-14.513 0-22.522-8.152-36.897-32.207l-7.38-12.414a596.368 596.368 0 0 0-2.294-3.834L78 51.5c-5.5-9-9-14.5-12-18.5l-.05.038c-9.18-12.63-15.47-16.693-22.916-16.693H43V0L43.241 0Z"
                  fill="url(#d)"
                ></path>
              </g>
            </svg>
          </div>
          <h3 className="accounts-centre-title">Accounts Centre</h3>
          <p className="accounts-centre-description">
            Manage your connected experiences and account settings across Meta
            technologies.
          </p>
          <div className="accounts-centre-features">
            <div className="feature-item">
              <div className="feature-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x1roi4f4"
                  fill="currentColor"
                  height="16"
                  role="img"
                  viewBox="0 0 24 24"
                  width="16"
                  style={{ color: "#737373" }}
                >
                  <title></title>
                  <path
                    d="M2.667 22v-1.355a5.271 5.271 0 0 1 5.271-5.271h8.124a5.271 5.271 0 0 1 5.271 5.271V22"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                  ></path>
                  <circle
                    cx="12"
                    cy="7.268"
                    fill="none"
                    r="5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                  ></circle>
                </svg>
              </div>
              <span style={{ fontSize: "12px", color: "#737373" }}>
                Personal details
              </span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x1roi4f4"
                  fill="currentColor"
                  height="16"
                  role="img"
                  viewBox="0 0 24 24"
                  width="16"
                  style={{ color: "#737373" }}
                >
                  <title></title>
                  <polyline
                    fill="none"
                    points="16.723 8.93 10.498 15.155 7.277 11.933"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.978"
                  ></polyline>
                  <path
                    d="M3 13.5a9 9 0 0 0 18 0V4.488A17.848 17.848 0 0 1 12 1.5a17.848 17.848 0 0 1-9 2.988Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.978"
                  ></path>
                </svg>
              </div>
              <span style={{ fontSize: "12px", color: "#737373" }}>
                Password and security
              </span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x1roi4f4"
                  fill="currentColor"
                  height="16"
                  role="img"
                  viewBox="0 0 24 24"
                  width="16"
                  style={{ color: "#737373" }}
                >
                  <title></title>
                  <path d="M18.44 1H5.56A4.565 4.565 0 0 0 1 5.561v12.878A4.565 4.565 0 0 0 5.56 23h12.88A4.566 4.566 0 0 0 23 18.44V5.56A4.566 4.566 0 0 0 18.44 1ZM21 18.44A2.564 2.564 0 0 1 18.44 21H5.56A2.563 2.563 0 0 1 3 18.44V5.56A2.563 2.563 0 0 1 5.56 3h12.88A2.564 2.564 0 0 1 21 5.561Z"></path>
                  <path d="M12 16H6a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2Zm6-10H6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Zm-1 6H7V8h10Zm1 4h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z"></path>
                </svg>
              </div>
              <span style={{ fontSize: "12px", color: "#737373" }}>
                Ad preferences, including <br></br>subscription for no ads
              </span>
            </div>
          </div>
          <button className="see-more-button">
            See more in Accounts Centre
          </button>
        </div>

        {/* Navigacija */}
        <div className="settings-navigation">
          {/* How you use Instagram */}
          <div className="nav-section">
            <h4 className="section-title">How you use Instagram</h4>
            <div className="nav-item active">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <circle
                    cx="12.004"
                    cy="12.004"
                    fill="none"
                    r="10.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                  ></circle>
                  <path
                    d="M18.793 20.014a6.08 6.08 0 0 0-1.778-2.447 3.991 3.991 0 0 0-2.386-.791H9.38a3.994 3.994 0 0 0-2.386.791 6.09 6.09 0 0 0-1.779 2.447"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                  ></path>
                  <circle
                    cx="12.006"
                    cy="9.718"
                    fill="none"
                    r="4.109"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                  ></circle>
                </svg>
              </div>
              <span>Edit Profile</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="m21.306 14.019-.484-.852A6.358 6.358 0 0 1 20 9.997a7.953 7.953 0 0 0-4.745-7.302 3.971 3.971 0 0 0-6.51.002 7.95 7.95 0 0 0-4.74 7.323 6.337 6.337 0 0 1-.83 3.175l-.468.823a4.001 4.001 0 0 0 3.476 5.983h1.96a3.98 3.98 0 0 0 7.716 0h1.964a4.004 4.004 0 0 0 3.482-5.982Zm-9.304 6.983a1.993 1.993 0 0 1-1.722-1.001h3.444a1.993 1.993 0 0 1-1.722 1.001Zm7.554-3.997a1.986 1.986 0 0 1-1.732.996H6.184a2.002 2.002 0 0 1-1.74-2.993l.47-.822a8.337 8.337 0 0 0 1.093-4.174 5.962 5.962 0 0 1 3.781-5.584.996.996 0 0 0 .494-.426 1.976 1.976 0 0 1 3.439 0 1 1 0 0 0 .494.425 5.989 5.989 0 0 1 3.786 5.634 8.303 8.303 0 0 0 1.082 4.094l.483.852a1.984 1.984 0 0 1-.01 1.998Z"></path>
                </svg>
              </div>
              <span>Notifications</span>
            </div>
          </div>

          {/* Who can see your content */}
          <div className="nav-section">
            <h4 className="section-title">Who can see your content</h4>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path
                    d="M6.71 9.555h10.581a2.044 2.044 0 0 1 2.044 2.044v8.357a2.044 2.044 0 0 1-2.043 2.043H6.71a2.044 2.044 0 0 1-2.044-2.044V11.6A2.044 2.044 0 0 1 6.71 9.555Zm1.07 0V6.222a4.222 4.222 0 0 1 8.444 0v3.333"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <span>Account privacy</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path
                    d="M12.001.504a11.5 11.5 0 1 0 11.5 11.5 11.513 11.513 0 0 0-11.5-11.5Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Zm4.691-11.82L13.91 9.35l-1.08-2.537a.893.893 0 0 0-1.66 0L10.086 9.35l-2.783.334a.963.963 0 0 0-.493 1.662l2.095 1.905-.606 2.837a.918.918 0 0 0 1.363 1.018l2.335-1.504 2.335 1.504a.918.918 0 0 0 1.363-1.018l-.605-2.837 2.094-1.905a.962.962 0 0 0-.493-1.662Z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              </div>
              <span>Close Friends</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="M20.153 20.106A11.493 11.493 0 0 0 3.893 3.858c-.007.007-.016.009-.023.016s-.009.016-.015.023a11.493 11.493 0 0 0 16.247 16.26c.01-.009.022-.012.03-.02.01-.01.012-.022.021-.031Zm1.348-8.102a9.451 9.451 0 0 1-2.119 5.968L6.033 4.622a9.49 9.49 0 0 1 15.468 7.382Zm-19 0a9.451 9.451 0 0 1 2.118-5.967l13.35 13.35A9.49 9.49 0 0 1 2.5 12.003Z"></path>
                </svg>
              </div>
              <span>Blocked</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="M1.545 13.386a1 1 0 0 0 .961-1.037Q2.5 12.174 2.5 12a9.514 9.514 0 0 1 .467-2.955 1 1 0 0 0-1.902-.62A11.53 11.53 0 0 0 .5 12c0 .142.002.283.008.425a1 1 0 0 0 .998.962.52.52 0 0 0 .04-.001Zm1.742 2.424a1 1 0 1 0-1.834.798 11.588 11.588 0 0 0 3.163 4.23A1 1 0 1 0 5.9 19.307a9.581 9.581 0 0 1-2.614-3.497Zm12.828 4.757a9.575 9.575 0 0 1-7.113.45 1 1 0 1 0-.629 1.899 11.545 11.545 0 0 0 8.607-.546 1 1 0 0 0-.865-1.803Zm4.69-1.176A11.495 11.495 0 0 0 12.002.5a1 1 0 0 0 0 2 9.492 9.492 0 0 1 7.382 15.469L2.207.793A1 1 0 0 0 .793 2.207l21 21a1 1 0 0 0 1.414-1.414Z"></path>
                </svg>
              </div>
              <span>Hide story and live</span>
            </div>
          </div>

          {/* How others can interact with you */}
          <div className="nav-section">
            <h4 className="section-title">How others can interact with you</h4>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path
                    d="M12.003 2.001a9.705 9.705 0 1 1 0 19.4 10.876 10.876 0 0 1-2.895-.384.798.798 0 0 0-.533.04l-1.984.876a.801.801 0 0 1-1.123-.708l-.054-1.78a.806.806 0 0 0-.27-.569 9.49 9.49 0 0 1-3.14-7.175 9.65 9.65 0 0 1 10-9.7Z"
                    fill="none"
                    stroke="currentColor"
                    strokeMiterlimit="10"
                    strokeWidth="1.739"
                  ></path>
                  <path
                    d="M17.79 10.132a.659.659 0 0 0-.962-.873l-2.556 2.05a.63.63 0 0 1-.758.002L11.06 9.47a1.576 1.576 0 0 0-2.277.42l-2.567 3.98a.659.659 0 0 0 .961.875l2.556-2.049a.63.63 0 0 1 .759-.002l2.452 1.84a1.576 1.576 0 0 0 2.278-.42Z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              </div>
              <span>Messages and story replies</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path
                    d="M15.108 13.652a3.342 3.342 0 0 1-3.341 3.342h-.661a2.246 2.246 0 0 1-2.246-2.246v-.634a2.246 2.246 0 0 1 2.246-2.246h3.654"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                  ></path>
                  <path
                    d="M17.521 22h-7.368a6.95 6.95 0 0 1-3.695-.642 4.356 4.356 0 0 1-1.813-1.812 6.96 6.96 0 0 1-.64-3.696v-7.7a6.964 6.964 0 0 1 .64-3.697 4.36 4.36 0 0 1 1.813-1.812A6.952 6.952 0 0 1 10.153 2h3.74a6.95 6.95 0 0 1 3.694.64 4.356 4.356 0 0 1 1.814 1.813 6.956 6.956 0 0 1 .64 3.696v6.464a2.38 2.38 0 0 1-2.38 2.38h-.13a2.423 2.423 0 0 1-2.422-2.422V9.019a2.471 2.471 0 0 0-2.47-2.471h-.994a2.471 2.471 0 0 0-2.47 2.47v.268"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <span>Tags and mentions</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path
                    d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <span>Comments</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.923.923 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.27A5.277 5.277 0 0 0 3 9.271V13.5a1 1 0 0 0 2 0V9.271a3.275 3.275 0 0 1 3.271-3.27Z"></path>
                </svg>
              </div>
              <span>Sharing and reuse</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path
                    d="M16.546 21.468A10.505 10.505 0 0 1 2.532 7.454m2.043-2.879a10.5 10.5 0 1 1 14.85 14.85"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                  <path
                    d="M8.027 8.028a4.266 4.266 0 1 1 5.53 5.529m-8.959 5.891a4.27 4.27 0 0 1 4.017-2.822h3.09"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    x1="1.5"
                    x2="22.5"
                    y1="1.5"
                    y2="22.5"
                  ></line>
                </svg>
              </div>
              <span>Restricted accounts</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  ariaLabel=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path d="M12.596 20.797h-2.178l-.009-.039-.815-3.735H4.7l-.825 3.774H1.673l.014-.061L5.744 3.203h2.78l.01.038Zm-7.449-5.823h4L7.134 5.835Zm11.813 6.123a3.198 3.198 0 0 1-3.274-3.473c0-1.881 1.011-3.056 3.185-3.698l1.8-.524c.754-.212 1.163-.486 1.163-1.327a1.732 1.732 0 0 0-1.95-1.775 1.746 1.746 0 0 0-1.9 1.9v.524h-2.048V12.2a3.61 3.61 0 0 1 3.949-3.75c2.578 0 3.998 1.323 3.998 3.724v8.623h-2v-1.569a2.998 2.998 0 0 1-2.923 1.87Zm2.874-6.427a2.914 2.914 0 0 1-1.26.577l-1.126.325a1.996 1.996 0 0 0-1.714 1.976 1.565 1.565 0 0 0 1.675 1.7c2.189 0 2.425-2.237 2.425-3.199Z"></path>
                </svg>
              </div>
              <span>Hidden words</span>
            </div>
          </div>

          {/* What you see */}
          <div className="nav-section">
            <h4 className="section-title">What you see</h4>

            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="m22.957 21.543-2.527-2.527a4.02 4.02 0 0 0 1.149-1.625 3.988 3.988 0 0 0-.273-3.371l-.484-.853a6.364 6.364 0 0 1-.82-3.17 7.953 7.953 0 0 0-4.746-7.302C14.51 1.642 13.292 1 12.001 1s-2.507.642-3.254 1.697A7.963 7.963 0 0 0 6.065 4.65L2.457 1.043a1 1 0 1 0-1.414 1.414l20.5 20.5a.997.997 0 0 0 1.414 0 1 1 0 0 0 0-1.414Zm-3.252-4.852c-.14.373-.385.68-.69.91L7.484 6.068a5.975 5.975 0 0 1 2.305-1.641 1 1 0 0 0 .493-.426A1.982 1.982 0 0 1 12.002 3c.71 0 1.353.375 1.72 1.002a.996.996 0 0 0 .493.425c2.3.914 3.786 3.1 3.786 5.634 0 1.434.374 2.85 1.081 4.094l.485.852c.298.526.348 1.124.138 1.684Zm-4.915 1.603a1 1 0 0 0-.707-.293H6.184c-.722 0-1.368-.372-1.73-.996s-.367-1.37-.01-1.996l.47-.823a8.344 8.344 0 0 0 1.093-4.171v-.09h-1l-1 .095a6.344 6.344 0 0 1-.83 3.175l-.47.823c-.714 1.253-.708 2.746.017 3.992s2.019 1.991 3.46 1.991h1.943a4.008 4.008 0 0 0 3.874 3 4.011 4.011 0 0 0 3.854-2.923.999.999 0 0 0-.256-.975l-.809-.81Zm-2.789 2.708a2.002 2.002 0 0 1-1.732-1.001h3.4l.041.041a2.01 2.01 0 0 1-1.709.96Z"></path>
                </svg>
              </div>
              <span>Muted accounts</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="m18.509 14.757-4.285-2.474a.857.857 0 0 0-1.286.743v4.948a.857.857 0 0 0 1.286.742l4.285-2.474a.857.857 0 0 0 0-1.485ZM5.225 3.977a1.25 1.25 0 1 0 1.25 1.25 1.25 1.25 0 0 0-1.25-1.25ZM19.5 7.5h-3v-3a4.004 4.004 0 0 0-4-4h-8a4.004 4.004 0 0 0-4 4v8a4.004 4.004 0 0 0 4 4h3v3a4.004 4.004 0 0 0 4 4h8a4.004 4.004 0 0 0 4-4v-8a4.004 4.004 0 0 0-4-4Zm-12 7h-3a1.997 1.997 0 0 1-1.882-1.349l2.607-2.607L7.5 12.819Zm.23-4.28L6.41 8.9a1.679 1.679 0 0 0-2.37 0L2.5 10.44V4.5a2.003 2.003 0 0 1 2-2h8a2.003 2.003 0 0 1 2 2v3h-3a3.992 3.992 0 0 0-3.77 2.72ZM21.5 19.5a2.003 2.003 0 0 1-2 2h-8a2.003 2.003 0 0 1-2-2v-8a2.003 2.003 0 0 1 2-2h8a2.003 2.003 0 0 1 2 2Z"></path>
                </svg>
              </div>
              <span>Content preferences</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="m18.474 17.56.038-.033c2.338-2.004 4.988-4.276 4.988-7.87 0-3.947-3.01-7.157-6.708-7.157-1.97 0-3.546.692-4.797 2.11C10.735 3.192 9.162 2.5 7.21 2.5c-1.088 0-2.113.28-3.021.774L2.207 1.293A1 1 0 1 0 .793 2.707l20 20a.997.997 0 0 0 1.414 0 1 1 0 0 0 0-1.414l-3.733-3.733ZM7.209 4.5c1.887 0 2.936.898 3.674 1.919.84 1.16.98 1.741 1.12 1.741.14 0 .278-.58 1.11-1.745.732-1.023 1.768-1.915 3.679-1.915 2.596 0 4.708 2.313 4.708 5.156 0 2.736-2.156 4.522-4.445 6.485L5.705 4.791A4.179 4.179 0 0 1 7.209 4.5Zm6.18 14.944-1.053.928-.336.294-.336-.295-6.917-6.094A6.632 6.632 0 0 1 2.5 9.304c0-.41.05-.816.152-1.204a1 1 0 0 0-1.935-.504A6.8 6.8 0 0 0 .5 9.304a8.635 8.635 0 0 0 2.925 6.474l6.917 6.094c.472.417 1.065.625 1.658.625s1.186-.208 1.658-.625l1.053-.927a1 1 0 0 0-1.322-1.501Z"></path>
                </svg>
              </div>
              <span>Like and share counts</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <path d="M19.269 20H4.73a1 1 0 0 1-.973-.77L1.026 7.641A1 1 0 0 1 2.82 6.84a3.674 3.674 0 0 0 3.666 1.725c1.992-.308 3.74-2.13 4.56-4.754a1 1 0 0 1 1.908 0c.82 2.625 2.567 4.446 4.56 4.754A3.674 3.674 0 0 0 21.18 6.84a1 1 0 0 1 1.794.802L20.242 19.23a1 1 0 0 1-.973.77ZM5.523 18h12.954l1.857-7.878a5.439 5.439 0 0 1-3.126.419A7.506 7.506 0 0 1 12 6.611a7.506 7.506 0 0 1-5.208 3.93 5.437 5.437 0 0 1-3.126-.42Z"></path>
                </svg>
              </div>
              <span>Subscriptions</span>
            </div>
          </div>

          {/* Your app and media */}
          <div className="nav-section">
            <h4 className="section-title">Your app and media</h4>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                  style={{ color: "black" }}
                >
                  <title></title>
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                    x1="11.914"
                    x2="11.914"
                    y1="15.195"
                    y2="2"
                  ></line>
                  <polyline
                    fill="none"
                    points="16.013 11.095 11.914 15.195 7.814 11.095"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></polyline>
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeWidth="2"
                    x1="3.277"
                    x2="20.55"
                    y1="22"
                    y2="22"
                  ></line>
                </svg>
              </div>
              <span>Archiving and downloading</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  ariaLabel=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path d="M12 .5A11.5 11.5 0 1 0 23.5 12 11.513 11.513 0 0 0 12 .5zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5zm0-13.684a1.5 1.5 0 1 0-1.5-1.5 1.5 1.5 0 0 0 1.5 1.5zm4.553.513a32.103 32.103 0 0 1-9.106 0 1 1 0 0 0-.292 1.978c.774.114 1.567.2 2.37.257l-.415 7.57a1 1 0 0 0 .944 1.053l.055.001a1 1 0 0 0 .998-.945l.23-4.178h1.327l.23 4.178a1 1 0 0 0 .997.945l.055-.001a1 1 0 0 0 .944-1.054l-.415-7.569a31.927 31.927 0 0 0 2.37-.257 1 1 0 0 0-.292-1.978z"></path>
                </svg>
              </div>
              <span>Accessibility</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path d="M13.25 5.124h-2.875v-.372a.875.875 0 0 0-1.75 0v.372H5.759a.875.875 0 1 0 0 1.75h.643a8.794 8.794 0 0 0 1.712 2.723 4.84 4.84 0 0 1-1.481.536.875.875 0 0 0 .116 1.742.891.891 0 0 0 .113-.007 6.982 6.982 0 0 0 2.659-1.081 6.99 6.99 0 0 0 2.608 1.08.87.87 0 0 0 .984-.741.878.878 0 0 0-.736-.992 4.846 4.846 0 0 1-1.453-.537 8.57 8.57 0 0 0 1.681-2.723h.645a.875.875 0 0 0 0-1.75Zm-3.73 3.41a6.78 6.78 0 0 1-1.196-1.66h2.37a6.583 6.583 0 0 1-1.175 1.66ZM20 5a1 1 0 0 0 0 2 1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-6a1 1 0 0 0-1 1v1.586l-2.293-2.293a1 1 0 0 0-1.414 1.414l4 4A1 1 0 0 0 15 22v-3h5a3.003 3.003 0 0 0 3-3V8a3.003 3.003 0 0 0-3-3Zm-5 10a3.003 3.003 0 0 0 3-3V4a3.003 3.003 0 0 0-3-3H4a3.003 3.003 0 0 0-3 3v8a3.003 3.003 0 0 0 3 3v3a1 1 0 0 0 1.625.781L10.351 15Zm-5.625-1.781L6 15.919V14a1 1 0 0 0-1-1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-5a1.002 1.002 0 0 0-.625.219Z"></path>
                </svg>
              </div>
              <span>Language</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path
                    d="M3.642 16.11V6.033a1.192 1.192 0 0 1 1.192-1.192h13.433a1.192 1.192 0 0 1 1.192 1.192m-5.343 13.125H3.778A1.778 1.778 0 0 1 2 17.38v-1.27h11.917"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  ></path>
                  <path
                    d="M22 17.832v.16a1.322 1.322 0 0 1-.121.7.826.826 0 0 1-.343.345 1.316 1.316 0 0 1-.7.121h-2.755a1.315 1.315 0 0 1-.7-.121.826.826 0 0 1-.343-.344 1.321 1.321 0 0 1-.12-.7V10.2a1.321 1.321 0 0 1 .12-.7.826.826 0 0 1 .344-.344 1.315 1.315 0 0 1 .699-.122h2.755a1.315 1.315 0 0 1 .7.122.826.826 0 0 1 .343.343A1.322 1.322 0 0 1 22 10.2v7.632Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linejoin="round"
                    stroke-width="2"
                  ></path>
                </svg>
              </div>
              <span>Website permissions</span>
            </div>
          </div>

          {/* Family Centre */}
          <div className="nav-section">
            <h4 className="section-title">Family Centre</h4>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path
                    d="M3.504 21H3v-9.03l9-8.588 9.31 8.885a1 1 0 1 0 1.38-1.448l-10-9.543a1.001 1.001 0 0 0-1.38 0l-10 9.543c-.198.19-.31.45-.31.724V22a1 1 0 0 0 1 1h1.504a1 1 0 1 0 0-2Zm17.195-2h-2.403a2.804 2.804 0 0 0-2.8 2.8v.2a1 1 0 0 0 1 1H22.5a1 1 0 0 0 1-1v-.2c0-1.544-1.257-2.8-2.8-2.8ZM9.256 13.553a3.255 3.255 0 0 0 3.25 3.25c1.792 0 3.25-1.458 3.25-3.25s-1.458-3.25-3.25-3.25a3.255 3.255 0 0 0-3.25 3.25Zm10.242-.053a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-8.955 4.303a4.044 4.044 0 0 0-4.04 4.04v.357a.8.8 0 0 0 .8.8h6.376a2.965 2.965 0 0 1-.184-1v-.2c0-1.584.782-2.981 1.97-3.856-.32-.083-.65-.14-.997-.14h-3.925Z"
                    fill-rule="evenodd"
                  ></path>
                </svg>
              </div>
              <span>Supervision for Teen Accounts</span>
            </div>
          </div>

          {/* For professionals */}
          <div className="nav-section">
            <h4 className="section-title">For professionals</h4>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path d="M8 12a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0v-3a1 1 0 0 0-1-1Zm8-3a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1Zm-4-2a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Z"></path>
                  <path d="M18.44 1H5.567a4.565 4.565 0 0 0-4.56 4.56v12.873a4.565 4.565 0 0 0 4.56 4.56H18.44a4.565 4.565 0 0 0 4.56-4.56V5.56A4.565 4.565 0 0 0 18.44 1ZM21 18.433a2.563 2.563 0 0 1-2.56 2.56H5.567a2.563 2.563 0 0 1-2.56-2.56V5.56A2.563 2.563 0 0 1 5.568 3H18.44A2.563 2.563 0 0 1 21 5.56v12.873Z"></path>
                </svg>
              </div>
              <span>Account type and tools</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path d="m21.884 12 1.458-2.273a1 1 0 0 0-.383-1.43l-2.4-1.24.127-2.697a1.001 1.001 0 0 0-.292-.754.97.97 0 0 0-.754-.292l-2.698.126-1.24-2.399a1 1 0 0 0-1.428-.383L12 2.116 9.726.658a1 1 0 0 0-1.428.383l-1.24 2.4-2.698-.127a.972.972 0 0 0-.754.292 1 1 0 0 0-.292.754l.126 2.698-2.4 1.24a1.001 1.001 0 0 0-.382 1.429L2.116 12 .658 14.273a1.001 1.001 0 0 0 .383 1.43l2.399 1.24-.126 2.697a1 1 0 0 0 .292.754.98.98 0 0 0 .754.292l2.698-.126 1.24 2.399a.997.997 0 0 0 .63.507 1.008 1.008 0 0 0 .798-.124L12 21.884l2.274 1.458a.997.997 0 0 0 .54.158 1.016 1.016 0 0 0 .258-.034.997.997 0 0 0 .63-.507l1.24-2.4 2.698.127a.98.98 0 0 0 .754-.292 1.001 1.001 0 0 0 .292-.754l-.126-2.698 2.399-1.24a1 1 0 0 0 .383-1.429Zm-2.03.54 1.211 1.89-1.993 1.03a1.001 1.001 0 0 0-.54.936l.105 2.24-2.242-.104a1 1 0 0 0-.935.54l-1.03 1.993-1.89-1.21a1 1 0 0 0-1.08 0l-1.89 1.21-1.03-1.993a.98.98 0 0 0-.935-.54l-2.242.105.105-2.241a1.002 1.002 0 0 0-.54-.936l-1.994-1.03 1.212-1.89a1 1 0 0 0 0-1.08L2.934 9.57l1.994-1.03a1.002 1.002 0 0 0 .54-.936l-.105-2.24 2.242.104a.952.952 0 0 0 .935-.54l1.03-1.993 1.89 1.21a1 1 0 0 0 1.08 0l1.89-1.21 1.03 1.993a.968.968 0 0 0 .935.54l2.242-.105-.105 2.241a1.001 1.001 0 0 0 .54.936l1.993 1.03-1.21 1.89a1 1 0 0 0 0 1.08Zm-4.49-4.046-4.891 4.89-1.837-1.835a1 1 0 0 0-1.414 1.414l2.544 2.543a1 1 0 0 0 1.414 0l5.598-5.598a1 1 0 0 0-1.414-1.414Z"></path>
                </svg>
              </div>
              <span>Meta Verified</span>
            </div>
          </div>

          {/* More info and support */}
          <div className="nav-section">
            <h4 className="section-title">More info and support</h4>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path d="M12 .5A11.5 11.5 0 1 0 23.5 12 11.513 11.513 0 0 0 12 .5Zm5.786 14.458a6.486 6.486 0 0 0 0-5.916l2.188-2.188a9.438 9.438 0 0 1 0 10.292Zm-8.968.224A4.499 4.499 0 1 1 12 16.5a4.468 4.468 0 0 1-3.182-1.318Zm8.328-11.156-2.188 2.188a6.485 6.485 0 0 0-5.916 0L6.854 4.026a9.438 9.438 0 0 1 10.292 0ZM4.026 6.855l2.188 2.187a6.486 6.486 0 0 0 0 5.916l-2.188 2.187a9.438 9.438 0 0 1 0-10.29Zm2.828 13.119 2.188-2.188a6.486 6.486 0 0 0 5.916 0l2.188 2.188a9.438 9.438 0 0 1-10.292 0Z"></path>
                </svg>
              </div>
              <span>Help</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path
                    d="M3 13.5a9 9 0 0 0 18 0V4.488A17.848 17.848 0 0 1 12 1.5a17.848 17.848 0 0 1-9 2.988Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  ></path>
                  <path
                    d="m11.283 7.925-.934 2.094-2.403.277a.785.785 0 0 0-.425 1.372l1.808 1.572-.523 2.342a.785.785 0 0 0 1.177.839L12 15.18l2.017 1.241a.785.785 0 0 0 1.177-.84l-.523-2.341 1.808-1.572a.785.785 0 0 0-.425-1.372l-2.403-.277-.934-2.094a.785.785 0 0 0-1.434 0Z"
                    fill-rule="evenodd"
                  ></path>
                </svg>
              </div>
              <span>Privacy Centre</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">
                <svg
                  aria-label=""
                  class="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title></title>
                  <path
                    d="M2.667 22v-1.355a5.271 5.271 0 0 1 5.271-5.271h8.124a5.271 5.271 0 0 1 5.271 5.271V22"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-miterlimit="10"
                    stroke-width="2"
                  ></path>
                  <circle
                    cx="12"
                    cy="7.268"
                    fill="none"
                    r="5"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-miterlimit="10"
                    stroke-width="2"
                  ></circle>
                </svg>
              </div>
              <span>Account Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desni container - 80% širine */}
      <div className="right-content">
        <div className="editAccount-editprofile-container">
          {" "}
          <p style={{ fontSize: "20px", fontWeight: "600", color: "black" }}>
            Edit Profile{" "}
          </p>
          {profile && (
            <div className="profile-header">
              <img
                src={profile.profile_image_url || profilePicDefault}
                alt={profile.username}
                className="profile-avatar"
              />
              <div className="profile-info">
                <p className="profile-username">{profile.username}</p>
                <p className="profile-fullname">{profile.full_name}</p>
              </div>
              <button
                className="change-photo-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openDialog();
                  e.preventDefault();
                }}
              >
                Change photo
              </button>
            </div>
          )}
        </div>{" "}
        <div
          className="website-container"
          style={{ width: "100%", marginBottom: "2em" }}
        >
          <div>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "black" }}>
              Website
            </p>
          </div>
          <div style={{ width: "80%" }}>
            <InputText
              disabled
              placeholder="Website"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid #bcb8b8",
                backgroundColor: "#efefef",
                cursor: "default",
              }}
            />
            <p
              style={{ fontSize: "12px", fontWeight: "400", color: "#737373" }}
            >
              Editing your links is only available on mobile. Visit the
              Instagram app and edit your profile to change the websites in your
              bio.
            </p>
          </div>
        </div>
        <div
          className="bio-container"
          style={{ width: "100%", marginBottom: "2em" }}
        >
          <div>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "black" }}>
              Bio
            </p>
          </div>
          <div style={{ width: "80%", position: "relative" }}>
            <InputTextarea
              autoResize
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={150}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid rgb(226, 226, 226)",
                height: "auto",
                outline: "none",
                color: "black",
              }}
              className="custom-textarea"
            />
            <div
              style={{
                position: "absolute",
                bottom: "15px",
                right: "17px",
                fontSize: "12px",
                color: "#737373",
                pointerEvents: "none",
              }}
            >
              {bio.length} / 150
            </div>
          </div>
        </div>
        <div
          className="gender-container"
          style={{ width: "100%", marginBottom: "2em" }}
        >
          <div>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "black" }}>
              Gender
            </p>
          </div>
          <div style={{ width: "80%", position: "relative" }}>
            <div>
              {/* Input polje koje otvara modal */}
              <div
                onClick={(e) => genderOverlayRef.current.toggle(e)}
                className="gender-input"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgb(226, 226, 226)",
                  cursor: "pointer",
                  background: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {gender
                    ? gender === "custom"
                      ? customGender.trim() || "Custom"
                      : genderOptions.find((g) => g.value === gender)?.label
                    : "Select Gender"}
                </span>
                <svg
                  aria-label="Down chevron"
                  className="x1lliihq x1n2onr6 x10xgr34"
                  fill="currentColor"
                  height="12"
                  role="img"
                  viewBox="0 0 24 24"
                  width="12"
                  style={{
                    color: "rgb(209 206 206)",
                    transform: "rotate(180deg)",
                  }}
                >
                  <title>Down chevron</title>
                  <path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"></path>
                </svg>
              </div>

              {/* OverlayPanel umjesto Dialog */}
              <OverlayPanel 
                ref={genderOverlayRef} 
                style={{ borderRadius: "18px", width: "25em", position: "relative",  }}
              >
                <div className="gender-dialog">
                  {genderOptions.map((option) => (
                    <div key={option.value}>
                      <div
                        onClick={() => handleSelect(option.value)}
                        className="gender-option"
                      >
                        <span>{option.label}</span>
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            id={option.value}
                            name="gender"
                            value={option.value}
                            checked={gender === option.value}
                            onChange={() => handleSelect(option.value)}
                            className="custom-radio-input"
                          />
                        </div>
                      </div>

                      {/* Custom gender input - uvijek prikazan ispod Custom opcije */}
                      {option.value === "custom" && (
                        <div
                          style={{ marginTop: "10px", marginBottom: "10px" }}
                        >
                          <InputTextarea
                            value={customGender}
                            onChange={(e) => setCustomGender(e.target.value)}
                            rows={2}
                            autoResize
                            className="customGender-textarea"
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "12px",
                              border: "1px solid #ccc",
                              resize: "none",
                              backgroundColor: "#f5f5f5",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </OverlayPanel>
            </div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "400",
                color: "#737373",
                marginTop: "8px",
                marginBottom: "0",
              }}
            >
              This won't be part of your public profile.
            </p>
          </div>
        </div>
        {/* Show account suggestions section */}
        <div
          className="account-suggestions-container"
          style={{ width: "100%", marginBottom: "2em" }}
        >
          <div>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "black" }}>
              Show account suggestions on profiles
            </p>
          </div>
          <div style={{ width: "80%" }}>
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid rgb(226, 226, 226)",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "black",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Show account suggestions on profiles
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#737373",
                      margin: "0",
                      lineHeight: "1.4",
                    }}
                  >
                    Choose whether people can see similar account suggestions on
                    your profile, and whether your account can be suggested on
                    other profiles.
                  </p>
                </div>
                <div style={{ marginLeft: "20px" }}>
                  <label
                    style={{
                      position: "relative",
                      display: "inline-block",
                      width: "44px",
                      height: "24px",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "#000",
                        borderRadius: "24px",
                        transition: "0.3s",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          content: '""',
                          height: "18px",
                          width: "18px",
                          right: "3px",
                          bottom: "3px",
                          backgroundColor: "white",
                          borderRadius: "50%",
                          transition: "0.3s",
                        }}
                      ></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#737373",
                marginTop: "2.5em",
                marginBottom: "0",
              }}
            >
              Certain profile info, such as your name, bio and links, is visible
              to everyone.{" "}
              <a
                href="https://help.instagram.com/347751748650214?ref=igweb"
                style={{
                  color: "#4150f7",
                  textDecoration: "none",
                  fontSize: "12px",
                }}
                className="see-profileInfo-visible-text"
              >
                See what profile info is visible
              </a>
            </p>

            {/* Submit Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "2em",
                marginBottom: "3em",
              }}
            >
              <button
                onClick={handleSubmit}
                disabled={!hasChanges()}
                style={{
                  backgroundColor: "#4150f7",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 85px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: hasChanges() ? "pointer" : "not-allowed",
                  minWidth: "80px",
                  opacity: hasChanges() ? 1 : 0.4,
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div
          style={{
            paddingTop: "2em",
            marginTop: "2em",
            marginLeft: "-3em",
            marginBottom: "2em",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Meta
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              About
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Blog
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Jobs
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Help
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              API
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Privacy
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Terms
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Locations
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Instagram Lite
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Meta AI
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Meta AI articles
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Threads
            </a>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "16px",
              marginLeft: "16px",
              width: "95%",
            }}
          >
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Contact uploading and non-users
            </a>
            <a
              href="#"
              style={{
                color: "#737373",
                textDecoration: "none",
                fontSize: "12px",
              }}
              className="footer-link"
            >
              Meta Verified
            </a>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1em",
              alignItems: "center",
              marginTop: "1em",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#737373", fontSize: "12px" }}>
                English (UK)
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: "#737373", transform: "rotate(180deg)" }}
              >
                <path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"></path>
              </svg>
            </div>
            <div style={{ color: "#737373", fontSize: "12px" }}>
              © 2025 Instagram from Meta
            </div>
          </div>
        </div>
      </div>

      {/* Dialog prozor - promjena profilne slike */}
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
    </div>
  );
};

export default AccountEdit;
