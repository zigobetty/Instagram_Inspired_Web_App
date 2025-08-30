import React, { useState, useEffect, useRef } from "react";
import "../SignIn/signIn.css";
import "../LogIn_second/logIn_second.css";
import "../LogIn/logIn.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import logoPhoto from "../../imgs/instagram-wordmark.svg";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "primereact/button";
import googlePlay from "../../imgs/google_play-removebg-preview.png";
import microsoft from "../../imgs/micro-removebg-preview.png";
import { useAuth } from "../../contexts/AuthContext";
import { classNames } from "primereact/utils";
import Cookies from "js-cookie";

const LogInSecond = () => {
  const { login } = useAuth();
  const toast = useRef(null);
  const [valueUser, setValueUser] = useState("");
  const [valuePassword, setValuePassword] = useState("");
  const [type, setType] = useState("password");
  const [hasInput, setHasInput] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/get_csrf_token/", {
      method: "GET",
      credentials: "include",
    })
      .then(() => {
        setCsrfToken(Cookies.get("csrftoken"));
      })
      .catch(console.error);
  }, []);

  const handleToggle = () => {
    setType((prevType) => (prevType === "password" ? "text" : "password"));
  };

  const handlePasswordChange = (e) => {
    setValuePassword(e.target.value);
    setHasInput(e.target.value.length > 0);
  };

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
      const response = await fetch("http://localhost:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Server error:", result);
        toast.current.show({
          severity: "error",
          summary: "Login Failed",
          detail: result.detail || "Greška prilikom prijave.",
          life: 3000,
        });
        return;
      }

      localStorage.setItem("authToken", result.access);
      localStorage.setItem("refreshToken", result.refresh);
      localStorage.setItem("user", JSON.stringify(result.user));

      login(result.user, result.access); 
      toast.current.show({
        severity: "success",
        summary: "Login Successful",
        detail: "Uspješno ste prijavljeni!",
        life: 3000,
      });
      navigate("/home");
    } catch (error) {
      console.error("Greška na serveru:", error);
      toast.current.show({
        severity: "error",
        summary: "Server Error",
        detail: "Došlo je do greške na serveru. Molimo pokušajte kasnije.",
        life: 3000,
      });
    }
  };

  const isFormValid = valueUser.trim() !== "" && valuePassword.trim() !== "";

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          flexDirection: "column",

          paddingBottom: "2em",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div className="form-logIn-container">
          <div
            className="logo-container"
            style={{
              flexDirection: "column",
              paddingLeft: "2em",
              paddingRight: "2em",
              textAlign: "center",
              gap: "0.7em",
              color: "#737373",
              fontWeight: "600",
            }}
          >
            <img src={logoPhoto} className="logo_img"></img>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxWidth: "20em",
              width: "20em",
              marginTop: "1.5em",
              flexDirection: "column",
              gap: "1.5em",
            }}
          >
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
              <div className="input-wrapper" style={{ position: "relative" }}>
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
                    className={classNames("pi", {
                      "pi-eye-slash": type === "password",
                      "pi-eye": type === "text",
                    })}
                    onClick={handleToggle}
                    style={{
                      cursor: "pointer",
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                )}
              </div>
              <label className="text-label" htmlFor="password">
                Password
              </label>
            </FloatLabel>
            <Button
              label="Log in"
              className="next-button-logIn"
              onClick={handleLogin}
              disabled={!isFormValid}
            ></Button>
          </div>
          <div className="line-container2">
            <div className="p-line"></div>
            <p className="or-text">OR</p>
            <div className="p-line"></div>
          </div>
          <div className="facebook-logIn-cont" style={{ marginBottom: "0px" }}>
            <svg
              aria-label="Log in with Facebook"
              className="x1lliihq x1n2onr6 x173jzuc"
              fill="#0095f6"
              height="20"
              role="img"
              viewBox="0 0 16 16"
              width="20"
            >
              <title>Log in with Facebook</title>
              <g clipPath="url(#a)">
                <path
                  d="M8 0C3.6 0 0 3.6 0 8c0 4 2.9 7.3 6.8 7.9v-5.6h-2V8h2V6.2c0-2 1.2-3.1 3-3.1.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.3V8h2.2l-.4 2.3H9.2v5.6C13.1 15.3 16 12 16 8c0-4.4-3.6-8-8-8Z"
                  fill="currentColor"
                ></path>
              </g>
              <defs>
                <clipPath id="a">
                  <rect fill="currentColor" height="16" width="16"></rect>
                </clipPath>
              </defs>
            </svg>
            <p className="facebook-text">Log in with Facebook</p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "12px",
              marginTop: "-5px",
            }}
          >
            <p className="forgotten-pass-text">Forgotten your password?</p>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: "11.5px",
              paddingLeft: "2em",
              paddingRight: "2em",
              color: "#A8A8A8",
              marginBottom: "0px",
            }}
            className="policy-text"
          >
            You can also{" "}
            <a
              href="https://help.instagram.com/contact/406206379945942/?locale=en_GB&Defamation_CF_redirect=%7B%22URLs1%22%3A%22%22%2C%22gb_country%22%3A%22Croatia%22%7D&Erasure_Redirect=%7B%22erasure_cf_redirect%22%3A%22%7B%5C%22Jurisdiction%5C%22%3A%5C%22Croatia%5C%22%2C%5C%22URLs%5C%22%3A%5C%22%5C%22%7D%22%2C%22ipr_cf_redirect%22%3A%22%7B%5C%22content_url%5C%22%3A%5C%22%5C%22%2C%5C%22crtformredirect%5C%22%3A%5C%22%7B%5C%5C%5C%22content_url%5C%5C%5C%22%3A%5C%5C%5C%22%5C%5C%5C%22%2C%5C%5C%5C%22crtformredirect%5C%5C%5C%22%3A%5C%5C%5C%22%7B%5C%5C%5C%5C%5C%5C%5C%22content_url%5C%5C%5C%5C%5C%5C%5C%22%3A%5C%5C%5C%5C%5C%5C%5C%22%5C%5C%5C%5C%5C%5C%5C%22%2C%5C%5C%5C%5C%5C%5C%5C%22whatcountry%5C%5C%5C%5C%5C%5C%5C%22%3A%5C%5C%5C%5C%5C%5C%5C%22Croatia%5C%5C%5C%5C%5C%5C%5C%22%7D%5C%5C%5C%22%2C%5C%5C%5C%22whatcountry%5C%5C%5C%22%3A%5C%5C%5C%22Croatia%5C%5C%5C%22%7D%5C%22%7D%22%7D&French_IG_LRRP_redirect=%7B%22URLs1%22%3A%22%22%7D&IP_CF_redirect=%7B%22submit_copyright_report%22%3A%22%7B%5C%22content_urls%5C%22%3A%5C%22%5C%22%7D%22%2C%22submit_tm_report%22%3A%22%7B%5C%22content_urls%5C%22%3A%5C%22%5C%22%2C%5C%22counterfeitredirect%5C%22%3A%22%7B%5C%5C%5C%22content_urls%5C%5C%5C%22%3A%5C%5C%5C%22%5C%5C%5C%22%7D%5C%22%7D%22%7D&LOBComment3=&URLs1=&gb_country=Croatia"
              style={{
                color: "black",
                textDecoration: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
              onMouseOut={(e) => (e.target.style.textDecoration = "none")}
            >
              report content that you believe is unlawful
            </a>{" "}
            in your country without logging in.
          </div>
        </div>
        <div className="footer-form-container-logIn">
          <p style={{ color: "black", fontSize: "14px" }}>
            Don't have an account?
          </p>
          <a
            onClick={handleSignUpClick}
            className="signUp-text"
            style={{ cursor: "pointer", fontSize: "14px" }}
          >
            Sign Up
          </a>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            marginBottom: "3.5em",
          }}
        >
          <p style={{ color: "black", fontSize: "14px" }}>Get the app.</p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "0.7em",
              gap: "0.5em",
            }}
          >
            <a
              href="https://play.google.com/store/apps/details?id=com.instagram.android&referrer=ig_mid%3D4751214B-239C-4CC1-94DC-F6487C65B563%26utm_campaign%3DunifiedHome%26utm_content%3Dlo%26utm_source%3Dinstagramweb%26utm_medium%3Dbadge"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Get it on Google Play"
                className="googleImg"
                src="https://static.cdninstagram.com/rsrc.php/v4/yz/r/c5Rp7Ym-Klz.png"
                style={{
                  width: "120px",
                  height: "40px",
                  border: "1px solid #dbdbdb",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
            </a>
            <a
              href="https://www.microsoft.com/store/apps/9NBLGGH5L9XT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Get it from Microsoft"
                class="googleImg"
                src="https://static.cdninstagram.com/rsrc.php/v4/yu/r/EHY6QnZYdNX.png"
                style={{
                  width: "120px",
                  height: "40px",
                  border: "1px solid #dbdbdb",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
            </a>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
          className="footer-container2"
        >
          <p
            style={{
              wordSpacing: "10px",
              fontSize: "12px",
              color: "#737373",
              textAlign: "center",
            }}
          >
            Meta About Blog Jobs Help API Privacy Cookie settings Terms
            Locations Instagram Lite Threads Contact uploading and non-users
            Meta Verified
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#737373",
              textAlign: "center",
            }}
          >
            English (UK) © 2024 Instagram from Meta
          </p>
        </div>
      </div>
      <Toast ref={toast} />
    </>
  );
};

export default LogInSecond;
