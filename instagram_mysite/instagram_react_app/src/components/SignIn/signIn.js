import React, { useState, useEffect } from "react";
import "../SignIn/signIn.css";
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
import { classNames } from 'primereact/utils';

const SignUp = () => {
  const [valueUser, setValueUser] = useState("");
  const [valueMobileEmail, setValueMobileEmail] = useState("");
  const [valuePassword, setValuePassword] = useState("");
  const [valueName, setValueName] = useState("");
  const [type, setType] = useState("password");
  const [hasInput, setHasInput] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Dohvaćanje CSRF tokena na učitavanje stranice
  useEffect(() => {
    fetch("http://localhost:8000/api/csrf_token", {
      method: "GET",
      credentials: "include", // Omogućava postavljanje CSRF kolačića
    })
      .then((response) => response.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((error) => console.error("Error fetching CSRF token:", error));
  }, []);

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

    const data = {
      contact_info: valueMobileEmail,
      username: valueUser,
      full_name: valueName,
      password: valuePassword,
    };

    // Regularni izrazi za email i broj telefona
    const emailRegex = /^\S+@\S+\.\S+$/;
    const phoneRegex = /^\+?\d{7,15}$/;

    // Validacija unosa
    if (!emailRegex.test(data.contact_info) && !phoneRegex.test(data.contact_info)) {
      alert("Unesite ispravan email ili broj mobitela.");
      setLoading(false);
      return;
    }

    if (data.password.length < 6) {
      alert("Lozinka mora imati najmanje 6 znakova.");
      setLoading(false);
      return;
    }

    try {
      // Provjera postoji li korisnik
      const checkResponse = await fetch("http://localhost:8000/api/check_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact_info: data.contact_info,
          username: data.username,
        }),
      });

      const checkResult = await checkResponse.json();
      if (checkResult.exists) {
        alert("Korisnik već postoji. Molimo vas da se logirate.");
        setLoading(false);
        return;
      }

      // Ako korisnik ne postoji, pokušaj registraciju
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Registracija uspješna!");
        navigate("/home");
      } else {
        alert("Greška pri registraciji: " + result.error);
      }
    } catch (error) {
      console.error("Greška na serveru:", error);
      alert("Došlo je do greške na serveru. Molimo pokušajte kasnije.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <div className="container">
        <div className="signUp-container">
          <div className="signUp-container-data">
            <div className="logo-container">
              <img className="logo" src={logoPhoto} alt="Logo" />
            </div>
            <div
              className="text1-container"
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <p>Sign up to see photos and videos from your friends.</p>
            </div>
            <div className="data-container-signUp">
              <FloatLabel>
                <InputText
                  id="mobileOrEmail"
                  type="text"
                  value={valueMobileEmail}
                  onChange={handleMobileEmailChange}
                  className="input"
                  autoComplete="new-password"
                />
                <label className="text-label" htmlFor="username">
                  Mobile number or email address
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

              <FloatLabel>
                <InputText
                  id="fullname"
                  value={valueName}
                  onChange={(e) => setValueName(e.target.value)}
                  className="input"
                />
                <label htmlFor="fullname">Full Name</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="username"
                  value={valueUser}
                  onChange={(e) => setValueUser(e.target.value)}
                  className="input"
                />
                <label htmlFor="username">Username</label>
              </FloatLabel>
            </div>

            <div
              className="text2-container"
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <p className="report-text-signUp">
                People who use our service may have uploaded your contact
                information to Instagram.{" "}
                <a
                  href="https://www.facebook.com/help/instagram/261704639352628"
                  target="_blank"
                >
                  Learn more.
                </a>
              </p>
            </div>
            <div
              className="text3-container"
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <p className="report-text-signUp">
                By signing up, you agree to our{" "}
                <a
                  href="https://help.instagram.com/581066165581870/?locale=en_GB"
                  target="_blank"
                >
                  Terms
                </a>
                . Learn how we collect, use and share your data in our{" "}
                <a
                  href="https://www.facebook.com/privacy/policy"
                  target="_blank"
                >
                  Privacy Policy
                </a>{" "}
                and how we use cookies and similar technology in our{" "}
                <a
                  href="https://privacycenter.instagram.com/policies/cookies/"
                  target="_blank"
                >
                  Cookies Policy
                </a>
                .
              </p>
            </div>

            <div className="button-next-container">
              <Button label="Next" className="button-next" onClick={handleRegister}/>
            </div>

            <div
              className="text4-container"
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <p className="report-text-signUp">
                You can also{" "}
                <a
                  href="https://help.instagram.com/contact/406206379945942/?locale=en_GB&Defamation_CF_redirect=%7B%22URLs1%22%3A%22%22%2C%22gb_country%22%3A%22Croatia%22%7D&Erasure_Redirect=%7B%22erasure_cf_redirect%22%3A%22%7B%5C%22Jurisdiction%5C%22%3A%5C%22Croatia%5C%22%2C%5C%22URLs%5C%22%3A%5C%22%5C%22%7D%22%2C%22ipr_cf_redirect%22%3A%22%7B%5C%22content_url%5C%22%3A%5C%22%5C%22%2C%5C%22crtformredirect%5C%22%3A%5C%22%7B%5C%5C%5C%22content_url%5C%5C%5C%22%3A%5C%5C%5C%22%5C%5C%5C%22%2C%5C%5C%5C%22crtformredirect%5C%5C%5C%22%3A%5C%5C%5C%22%7B%5C%5C%5C%5C%5C%5C%5C%22content_url%5C%5C%5C%5C%5C%5C%5C%22%3A%5C%5C%5C%5C%5C%5C%5C%22%5C%5C%5C%5C%5C%5C%5C%22%2C%5C%5C%5C%5C%5C%5C%5C%22whatcountry%5C%5C%5C%5C%5C%5C%5C%22%3A%5C%5C%5C%5C%5C%5C%5C%22Croatia%5C%5C%5C%5C%5C%5C%5C%22%7D%5C%5C%5C%22%2C%5C%5C%5C%22whatcountry%5C%5C%5C%22%3A%5C%5C%5C%22Croatia%5C%5C%5C%22%7D%5C%22%7D%22%7D&French_IG_LRRP_redirect=%7B%22URLs1%22%3A%22%22%7D&IP_CF_redirect=%7B%22submit_copyright_report%22%3A%22%7B%5C%22content_urls%5C%22%3A%5C%22%5C%22%7D%22%2C%22submit_tm_report%22%3A%22%7B%5C%22content_urls%5C%22%3A%5C%22%5C%22%2C%5C%22counterfeitredirect%5C%22%3A%5C%22%7B%5C%5C%5C%22content_urls%5C%5C%5C%22%3A%5C%5C%5C%22%5C%5C%5C%22%7D%5C%22%7D%22%7D&LOBComment3=&URLs1=&gb_country=Croatia"
                  target="_blank"
                >
                  report content that you believe is unlawful
                </a>{" "}
                in your country without logging in.
              </p>
            </div>
          </div>
          <div className="signUp-container-haveAnAcc">
            <p>Have an account?</p>
            <a
              onClick={handleSignUpClick}
              className="signUp-text"
              style={{ cursor: "pointer", fontSize: "1.05em" }}
            >
              Log In
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
        className="text5-container"
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

export default SignUp;
