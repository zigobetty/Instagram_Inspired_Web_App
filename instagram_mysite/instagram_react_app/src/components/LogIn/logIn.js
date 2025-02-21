import React, { useState, useEffect } from "react";
import "../LogIn/logIn.css";
import { Button } from "primereact/button";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import logoPhoto from "../../imgs/instagram-wordmark.svg";
import instagram1Photo from "../../imgs/i1.jpg";
import instagram2Photo from "../../imgs/i2.jpg";
import instagram3Photo from "../../imgs/i3.jpg";
import instagram4Photo from "../../imgs/i4.jpg";
import instagram5Photo from "../../imgs/i5.jpg";
import instagram6Photo from "../../imgs/i6.jpg";
import instagram7Photo from "../../imgs/i7.jpg";
import instagram8Photo from "../../imgs/i8.jpg";
import instagram9Photo from "../../imgs/i9.jpg";
import googlePlay from "../../imgs/google_play-removebg-preview.png";
import microsoft from "../../imgs/micro-removebg-preview.png";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { classNames } from 'primereact/utils';

const Login = () => {
  const { login } = useAuth();
  const [valueUser, setValueUser] = useState("");
  const [valuePassword, setValuePassword] = useState("");
  const [type, setType] = useState("password");
  const [hasInput, setHasInput] = useState(false);
  const images = [
    instagram5Photo,
    instagram6Photo,
    instagram3Photo,
    instagram4Photo,
    instagram1Photo,
    instagram2Photo,
    instagram7Photo,
    instagram8Photo,
    instagram9Photo,
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [csrfToken, setCsrfToken] = useState("");

  // Dohvati CSRF token prilikom učitavanja komponente
  useEffect(() => {
    fetch("http://localhost:8000/api/csrf_token", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((error) => console.error("Error fetching CSRF token:", error));
  }, []);

  // Funkcija za prebacivanje tipa polja za unos lozinke
  const handleToggle = () => {
    setType((prevType) => (prevType === "password" ? "text" : "password"));
  };

  // Funkcija za praćenje unosa lozinke
  const handlePasswordChange = (e) => {
    setValuePassword(e.target.value);
    setHasInput(e.target.value.length > 0);
  };

  // Automatska promjena slika svakih 3 sekunde
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Promjena svake 3 sekunde

    // Čisti interval prilikom demontaže komponente
    return () => clearInterval(slideInterval);
  }, [images.length]);

  const navigate = useNavigate();

  const handleSignUpClick = () => {
    navigate("/signup");
  };

  const handleLogin = async () => {
    const data = {
      contact_info: valueUser,
      password: valuePassword,
    };
  
    console.log("Šaljem podatke na server:", data);
  
    try {
      // Prvo dohvaćamo CSRF token
      const csrfResponse = await fetch("http://localhost:8000/api/csrf_token", {
        credentials: "include",
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
  
      const response = await fetch("http://localhost:8000/api/login2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken, // Dodaj CSRF token
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
  
      if (!response.ok) {
        console.error(`Greška na serveru: ${response.status} ${response.statusText}`);
        alert(`Greška: ${response.status} ${response.statusText}`);
        return;
      }
  
      const result = await response.json();
  
      if (result.success) {
        alert("Uspješno ste prijavljeni!");
        login();
        navigate("/home");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Greška na serveru:", error);
      alert("Došlo je do greške na serveru. Molimo pokušajte kasnije.");
    }
  };
  
  return (
    <>
      <div className="main">
        <div className="p-grid main-grid">
          <div className="p-col-6 left-grid">
            <div className="container">
              <div className="phone phone-back">
                <div className="notch-container">
                  <div className="notch"></div>
                </div>
                <img className="slideshow" src={instagram4Photo} />
              </div>

              <div className="phone phone-front">
                <div className="notch-container">
                  <div className="notch"></div>
                </div>
                <img
                  className="slideshow"
                  src={images[currentImageIndex]}
                  alt="Instagram Slideshow"
                />
              </div>
            </div>
          </div>
          <div className="p-col-6 right-grid">
            <div className="logIn-container">
              <div className="logo-container">
                <img className="logo" src={logoPhoto} alt="Logo" />
              </div>

              <div className="data-container">
                <FloatLabel>
                  <InputText
                    id="u"
                    value={valueUser}
                    onChange={(e) => setValueUser(e.target.value)}
                    className="input"
                    autoComplete="new-password"
                  />
                  <label className="text-label" htmlFor="username">
                    Phone number, username or email address
                  </label>
                </FloatLabel>

                <div className="password-container">
                  <FloatLabel>
                    <div className="input-wrapper" style={{ position: 'relative' }}>
                      <InputText
                        id="p"
                        type={type}
                        value={valuePassword}
                        onChange={handlePasswordChange}
                        className="input"
                        autoComplete="new-password"
                      />
                      {hasInput && (
                        <i
                          className={classNames('pi', {
                            'pi-eye-slash': type === 'password',
                            'pi-eye': type === 'text'
                          })}
                          onClick={handleToggle}
                          style={{
                            cursor: 'pointer',
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                        />
                      )}
                    </div>
                    <label className="text-label" htmlFor="password">
                      Password
                    </label>
                  </FloatLabel>
                </div>

                <Button
                  label="Log in"
                  className="button-login"
                  onClick={handleLogin}
                />
              </div>

              <div className="line-container">
                <div className="p-line"></div>
                <p className="or-text">OR</p>
                <div className="p-line"></div>
              </div>

              <div className="logIn-facebook-container">
                <img
                  className="img-facebook"
                  src="https://img.icons8.com/?size=100&id=118497&format=png&color=000000"
                  alt="Facebook logo"
                />
                <p
                  style={{ fontSize: "1.3rem" }}
                  className="logIn-facebook-text"
                >
                  Log in with Facebook
                </p>
              </div>

              <div className="forgotten-password-container">
                <a style={{ fontSize: "1rem" }}>Forgotten your password?</a>
              </div>

              <div className="report-container">
                <p style={{ fontSize: "1rem" }} className="report-text">
                  You can also{" "}
                  <a
                    href="https://help.instagram.com/contact/406206379945942/?locale=en_GB"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    report content that you believe is unlawful{" "}
                  </a>
                  in your country without logging in.
                </p>
              </div>
            </div>
            <div className="logIn-container-footer">
              <p>Dont't have an account?</p>
              <a
                onClick={handleSignUpClick}
                className="signUp-text"
                style={{ cursor: "pointer" }}
              >
                Sign Up
              </a>
            </div>
            <div className="logIn-container-getApp">
              <div className="getTheApp-header-container">
                <p>Get the app.</p>
              </div>
              <div className="getTheApp-container">
                <a
                  href="https://play.google.com/store/apps/details?id=com.instagram.android&referrer=ig_mid%3DDF549144-5B47-4B6D-961B-8C5A62862AEE%26utm_campaign%3DunifiedHome%26utm_content%3Dlo%26utm_source%3Dinstagramweb%26utm_medium%3Dbadge%26original_referrer%3Dhttps://www.google.com/&pli=1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={googlePlay}
                    className="googlePlay-img"
                    alt="Google Play Store"
                  ></img>
                </a>
                <a
                  href="https://apps.microsoft.com/store/detail/instagram/9NBLGGH5L9XT"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={microsoft}
                    className="microsoft-img"
                    alt="Microsoft Store"
                  ></img>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="text1-logIn-container"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <p className="space" style={{ wordSpacing: "15px" }}>
          Meta About Blog Jobs Help API Privacy Cookie settings Terms Locations
          Instagram Lite Threads Contact uploading and non-users Meta Verified
        </p>
        <p>English (UK) © 2024 Instagram from Meta</p>
      </div>
    </>
  );
};

export default Login;
