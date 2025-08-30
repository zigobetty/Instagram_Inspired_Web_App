import React, { useState, useEffect, useRef } from "react";
import "../SignIn/signIn.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import logoPhoto from "../../imgs/instagram-wordmark.svg";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "primereact/button";
import facebook from "../../imgs/facebook.png";
import microsoft from "../../imgs/micro-removebg-preview.png";
import { classNames } from "primereact/utils";
import { useAuth } from "../../contexts/AuthContext";
import Cookies from "js-cookie";

const SignUp = () => {
  const toast = useRef(null);
  const [valueUser, setValueUser] = useState("");
  const [valueMobileEmail, setValueMobileEmail] = useState("");
  const [valuePassword, setValuePassword] = useState("");
  const [valueName, setValueName] = useState("");
  const [type, setType] = useState("password");
  const [hasInput, setHasInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, token, isAuthenticated, login, logout } = useAuth();

  const handleToggle = () => {
    setType((prevType) => (prevType === "password" ? "text" : "password"));
  };

  const handlePasswordChange = (e) => {
    setValuePassword(e.target.value);
    setHasInput(e.target.value.length > 0);
  };

  const handleMobileEmailChange = (e) => {
    setValueMobileEmail(e.target.value);
  };

  const handleSignUpClick = () => {
    navigate("/login");
  };

  const handleRegister = async () => {
    setLoading(true);

    // 1) Prvo dohvatimo CSRF token
    const tokenRes = await fetch("http://localhost:8000/api/get_csrf_token/", {
      method: "GET",
      credentials: "include",
    });
    if (!tokenRes.ok) throw new Error("Ne mogu dohvatiti CSRF token");
    const { csrfToken } = await tokenRes.json();

    // 2) Sada mogu raditi POST s pravim tokenom
    const data = {
      contact_info: valueMobileEmail,
      username: valueUser,
      full_name: valueName,
      password: valuePassword,
    };

    const headers = {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    };

    try {
      // Provjera postoji li korisnik
      const checkRes = await fetch(
        "http://localhost:8000/api/check_user_exists/",
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            contact_info: data.contact_info,
            username: data.username,
          }),
        }
      );
      if (!checkRes.ok) throw new Error("Provjera korisnika nije uspjela");
      const { exists, email_exists, username_exists, message } =
        await checkRes.json();
      if (exists) {
        toast.current.show({
          severity: "warn",
          summary: "User Exists",
          detail: message || "Korisnik već postoji. Molimo vas da se logirate.",
          life: 3000,
        });
        setLoading(false);
        return;
      }

      // Registracija
      const regRes = await fetch("http://localhost:8000/api/register_user", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(data),
      });
      if (!regRes.ok) {
        const err = await regRes.json();
        throw new Error(err.error || `HTTP ${regRes.status}`);
      }
      const result = await regRes.json();

      // Pohrana tokena i navigacija
      localStorage.setItem("authToken", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      toast.current.show({
        severity: "success",
        summary: "Registration Successful",
        detail: "Registracija uspješna! Molimo se prijavite.",
        life: 3000,
      });
      navigate("/login");
    } catch (err) {
      console.error("Greška pri registraciji:", err);
      toast.current.show({
        severity: "error",
        summary: "Registration Failed",
        detail:
          "Došlo je do greške pri registraciji. Molimo pokušajte kasnije.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    valueMobileEmail.trim() !== "" &&
    valueUser.trim() !== "" &&
    valueName.trim() !== "" &&
    valuePassword.trim() !== "";

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div className="form-signUp-container">
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
            Sign up to see photos and videos from your friends.
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxWidth: "20em",
              width: "20em",
              marginTop: "1em",
            }}
          >
            <Button
              label="Log in with Facebook"
              icon={
                <img
                  src={facebook}
                  style={{ width: "15px", marginLeft: "1em" }}
                ></img>
              }
              iconPos="left"
              className="button-signUp"
            ></Button>
          </div>
          <div className="line-container">
            <div className="p-line"></div>
            <p className="or-text">OR</p>
            <div className="p-line"></div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxWidth: "20em",
              width: "20em",
              marginTop: "0.5em",
              flexDirection: "column",
              gap: "1.5em",
            }}
          >
            <FloatLabel>
              <InputText
                id="mobileOrEmail"
                type="text"
                value={valueMobileEmail}
                onChange={handleMobileEmailChange}
                className="input-signUp"
                autoComplete="new-password"
              />
              <label className="text-label" htmlFor="username">
                Mobile number or email address
              </label>
            </FloatLabel>
            <FloatLabel>
              <div className="input-wrapper" style={{ position: "relative" }}>
                <InputText
                  id="p"
                  type={type}
                  value={valuePassword}
                  onChange={handlePasswordChange}
                  className="input-signUp"
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
            <FloatLabel>
              <InputText
                id="fullname"
                value={valueName}
                onChange={(e) => setValueName(e.target.value)}
                className="input-signUp"
              />
              <label htmlFor="fullname" className="text-label">
                Full Name
              </label>
            </FloatLabel>
            <FloatLabel>
              <InputText
                id="username"
                value={valueUser}
                onChange={(e) => setValueUser(e.target.value)}
                className="input-signUp"
              />
              <label htmlFor="username" className="text-label">
                Username
              </label>
            </FloatLabel>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "11px",
              textAlign: "center",

              paddingTop: "0em",
              color: "#737373",
            }}
          >
            <p>
              {" "}
              People who use our service may have uploaded <br></br> your
              contact information to Instagram.&nbsp;{" "}
              <a
                href="https://www.facebook.com/help/instagram/261704639352628"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#00376b",
                  textDecoration: "none",
                }}
              >
                Learn more.
              </a>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "11px",
              textAlign: "center",
              paddingLeft: "4em",
              paddingRight: "4em",
              paddingTop: "0em",
              color: "#737373",
            }}
          >
            <p>
              {" "}
              By signing up, you agree to our{" "}
              <a
                href="https://help.instagram.com/581066165581870/?locale=en_GB"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#00376b",
                  textDecoration: "none",
                }}
              >
                Terms. &nbsp;
              </a>
              Learn how we collect, use and share your data in our{" "}
              <a
                href="https://www.facebook.com/privacy/policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#00376b",
                  textDecoration: "none",
                }}
              >
                Privacy <br></br>Policy &nbsp;
              </a>
              and how we use cookies and similar technology in our{" "}
              <a
                href="https://privacycenter.instagram.com/policies/cookies/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#00376b",
                  textDecoration: "none",
                }}
              >
                Cookies Policy.
              </a>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxWidth: "20em",
              width: "20em",
            }}
          >
            <Button
              label="Next"
              className="next-button-signUp"
              onClick={handleRegister}
              disabled={!isFormValid || loading}
            ></Button>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: "11.5px",
              paddingLeft: "4em",
              paddingRight: "4em",
              color: "#A8A8A8",
              marginTop: "4em",
              marginBottom: "2em",
            }}
          >
            You can also{" "}
            <a
              href="https://help.instagram.com/contact/406206379945942/?locale=en_GB&Defamation_CF_redirect=%7B%22URLs1%22%3A%22%22%2C%22gb_country%22%3A%22Croatia%22%7D&Erasure_Redirect=%7B%22erasure_cf_redirect%22%3A%22%7B%5C%22Jurisdiction%5C%22%3A%5C%22Croatia%5C%22%2C%5C%22URLs%5C%22%3A%5C%22%5C%22%7D%22%2C%22ipr_cf_redirect%22%3A%22%7B%5C%22content_url%5C%22%3A%5C%22%5C%22%2C%5C%22crtformredirect%5C%22%3A%5C%22%7B%5C%5C%5C%22content_url%5C%5C%5C%22%3A%5C%5C%5C%22%5C%5C%5C%22%2C%5C%5C%5C%22crtformredirect%5C%5C%5C%22%3A%5C%5C%5C%22%7B%5C%5C%5C%5C%5C%5C%5C%22content_url%5C%5C%5C%5C%5C%5C%5C%22%3A%5C%5C%5C%5C%5C%5C%5C%22%5C%5C%5C%5C%5C%5C%5C%22%2C%5C%5C%5C%5C%5C%5C%5C%22whatcountry%5C%5C%5C%5C%5C%5C%5C%22%3A%5C%5C%5C%5C%5C%5C%5C%22Croatia%5C%5C%5C%5C%5C%5C%5C%22%7D%5C%5C%5C%22%2C%5C%5C%5C%22whatcountry%5C%5C%5C%22%3A%5C%5C%5C%22Croatia%5C%5C%5C%22%7D%5C%22%7D%22%7D&French_IG_LRRP_redirect=%7B%22URLs1%22%3A%22%22%7D&IP_CF_redirect=%7B%22submit_copyright_report%22%3A%22%7B%5C%22content_urls%5C%22%3A%5C%22%5C%22%7D%22%2C%22submit_tm_report%22%3A%22%7B%5C%22content_urls%5C%22%3A%5C%22%5C%22%2C%5C%22counterfeitredirect%5C%22%3A%5C%22%7B%5C%5C%5C%22content_urls%5C%5C%5C%22%3A%5C%5C%5C%22%5C%5C%5C%22%7D%5C%22%7D%22%7D&LOBComment3=&URLs1=&gb_country=Croatia"
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
        <div className="footer-form-container">
          <p style={{ color: "black", fontSize: "14px" }}>Have an account?</p>
          <a
            onClick={handleSignUpClick}
            className="logIn-text"
            style={{ cursor: "pointer" }}
          >
            Log In
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
                className="googleImg"
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

export default SignUp;
