import React, { useState, useEffect } from "react";
import "../SignIn/signIn.css";
import "../LogIn_second/logIn_second.css";
import "../LogIn/logIn.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { useNavigate } from "react-router-dom";
import logoPhoto from "../../imgs/instagram-wordmark.svg";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "primereact/button";
import googlePlay from "../../imgs/google_play-removebg-preview.png";
import microsoft from "../../imgs/micro-removebg-preview.png";
import { useAuth } from "../AuthContext";
import { classNames } from 'primereact/utils';

const LogInSecond = () => {
  const { login } = useAuth();
  const [valueUser, setValueUser] = useState("");
  const [valuePassword, setValuePassword] = useState("");
  const [type, setType] = useState("password");
  const [hasInput, setHasInput] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const handleToggle = () => {
    setType((prevType) => (prevType === "password" ? "text" : "password"));
  };

  const handlePasswordChange = (e) => {
    setValuePassword(e.target.value);
    setHasInput(e.target.value.length > 0);
  };

  useEffect(() => {
    // Dohvati CSRF token prilikom učitavanja komponente
    fetch("http://localhost:8000/api/csrf_token", {
      method: "GET",
      credentials: "include", // Ovo omogućava postavljanje CSRF kolačića
    })
      .then((response) => response.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((error) => console.error("Error fetching CSRF token:", error));
  }, []);

  const navigate = useNavigate();

  const handleSignUpClick = () => {
    navigate("/signup");
  };

  const handleLogin = async () => {
    const data = {
      contact_info: valueUser,
      password: valuePassword,
    };

    console.log("podaci", data);

    try {
      // Slanje zahtjeva za provjeru korisničkih podataka
      const response = await fetch("http://localhost:8000/api/login2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken, // Dodaj CSRF token
        },
        body: JSON.stringify(data),
        credentials: "include", // Osigurava da se kolačići šalju s zahtjevom
      });

      const result = await response.json();

      if (result.success) {
        alert("Uspješno ste prijavljeni!");
        login(); // Postavi korisnika kao prijavljenog
        navigate("/home");
      } else {
        alert(result.message); // Prikaz poruke o grešci (npr. "Korisnik ne postoji" ili "Pogrešna lozinka")
      }
    } catch (error) {
      console.error("Greška na serveru:", error);
      alert("Došlo je do greške na serveru. Molimo pokušajte kasnije.");
    }
  };

  return (
    <>
      <div className="container">
        <div className="signUp-container">
          <div className="logInSecond-container-data">
            <div className="logo-container">
              <img className="logo" src={logoPhoto} alt="Logo" />
            </div>
            <div className="data-container-logInSecond">
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
            <div className="button-secondLogIn-container">
              <Button
                label="Log in"
                className="button-secondLogIn"
                onClick={handleLogin}
              />
            </div>

            <div className="line-container line-container-2">
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
              <p style={{ fontSize: "1.3rem" }} className="logIn-facebook-text">
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

          <div className="signUp-container-haveAnAcc">
            <p>Don't have an account?</p>
            <a
              onClick={handleSignUpClick}
              className="signUp-text"
              style={{ cursor: "pointer", fontSize: "1.05em" }}
            >
              Sign Up
            </a>
          </div>
          <div className="getApp-container">
            <div className="getApp-text-container">
              <p>Get the app.</p>
            </div>
            <div className="getTheApp-container-signUp">
              <a
                href="https://play.google.com/store/apps/details?id=com.instagram.android&referrer=ig_mid%3DDF549144-5B47-4B6D-961B-8C5A62862AEE%26utm_campaign%3DunifiedHome%26utm_content%3Dlo%26utm_source%3Dinstagramweb%26utm_medium%3Dbadge%26original_referrer%3Dhttps://www.google.com/&pli=1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={googlePlay}
                  className="googlePlay-img-signUp"
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
                  className="microsoft-img-signUp"
                  alt="Microsoft Store"
                ></img>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div
        className="text5-container-logInSecond"
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

export default LogInSecond;
