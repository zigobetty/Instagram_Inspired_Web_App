import React, { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputTextarea } from "primereact/inputtextarea";
import EmojiPicker from "emoji-picker-react";
import { uploadUserImage } from "../../../services/userService";
import "./CreatePostDialog.css";
import profilePicDefault from "../../../imgs/profile-user (1).png";

const MAX_IMAGES = 10;

const CreatePostDialog = ({
  visible,
  onHide,
  onImageUploaded,
  profileImage,
  userData,
}) => {
  const toast = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasImages = selectedFiles.length > 0;

  const [isNextStep, setIsNextStep] = useState(false);
  const [showAddTray, setShowAddTray] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [hideLikeCounts, setHideLikeCounts] = useState(false);
  const [turnOffCommenting, setTurnOffCommenting] = useState(false);
  const [autoShareToThreads, setAutoShareToThreads] = useState(false);
  const [altText, setAltText] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [allCities, setAllCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const locationContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState(false);
  const [imageToRemove, setImageToRemove] = useState(null);
  const skipDiscardOnHideRef = useRef(false);
  const isDirty = hasImages || !!descValue || !!locationInput;
  const [isChoosingFile, setIsChoosingFile] = useState(false);
  const fileDialogFocusHandlerRef = useRef(null);
  const appendOnPickRef = useRef(false);
  const [cropMode, setCropMode] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [showCropOptions, setShowCropOptions] = useState(false);
  const [showZoomOptions, setShowZoomOptions] = useState(false);
  const [currentAspectRatio, setCurrentAspectRatio] = useState('1:1');
  const [imageTransform, setImageTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropData, setCropData] = useState({
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const [croppedImages, setCroppedImages] = useState([]);
  const [profileSrc, setProfileSrc] = useState(
    profileImage || profilePicDefault
  );
  const addTrayRef = useRef(null);
  const galleryBtnRef = useRef(null);
  const cropOptionsRef = useRef(null);
  const zoomOptionsRef = useRef(null);

  useEffect(() => {
    if (
      profileImage &&
      typeof profileImage === "string" &&
      profileImage.trim() !== ""
    ) {
      const bust = profileImage.includes("?") ? "&" : "?";
      setProfileSrc(`${profileImage}${bust}t=${Date.now()}`);
    } else {
      setProfileSrc(profilePicDefault);
    }
  }, [profileImage]);

  useEffect(() => {
    return () => {
      if (fileDialogFocusHandlerRef.current) {
        window.removeEventListener(
          "focus",
          fileDialogFocusHandlerRef.current,
          true
        );
        fileDialogFocusHandlerRef.current = null;
      }
    };
  }, []);

  const openNativeFileDialog = (append = false) => {
    appendOnPickRef.current = append;
    setIsChoosingFile(true);
    skipDiscardOnHideRef.current = true;

    const onWindowFocus = () => {
      setIsChoosingFile(false);
      window.setTimeout(() => {
      skipDiscardOnHideRef.current = false;
      }, 300);
      window.removeEventListener("focus", onWindowFocus, true);
      fileDialogFocusHandlerRef.current = null;
    };

    window.addEventListener("focus", onWindowFocus, true);
    fileDialogFocusHandlerRef.current = onWindowFocus;

    fileInputRef.current?.click();
  };

  const replaceWithFiles = async (fileList) => {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const cut = incoming.slice(0, MAX_IMAGES);
    const urls = cut.map((f) => URL.createObjectURL(f));
    setSelectedFiles(cut);
    setPreviews(urls);
    setCurrentIndex(0);
    setIsNextStep(false);
    setShowAddTray(false);
    setCurrentAspectRatio('1:1'); // Postavi default format
    
    // Automatski crop slike u 1:1 format jer je to default
    const croppedUrls = await Promise.all(
      urls.map(url => cropImage(url, '1:1'))
    );
    setCroppedImages(croppedUrls);
  };

  const appendFiles = async (fileList) => {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;

    const baseLen = previews.length;
    const space = MAX_IMAGES - baseLen;
    const toAddFiles = incoming.slice(0, Math.max(space, 0));
    if (toAddFiles.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...toAddFiles]);
    const newUrls = toAddFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prevUrls) => [...prevUrls, ...newUrls]);
    // Ostavi currentIndex na trenutnoj slici, ne prebacuj na zadnju dodanu
    setIsNextStep(false);
    
    // Crop nove slike u trenutni format
    const croppedNewUrls = await Promise.all(
      newUrls.map(url => cropImage(url, currentAspectRatio))
    );
    setCroppedImages((prev) => [...prev, ...croppedNewUrls]);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await (appendOnPickRef.current ? appendFiles(files) : replaceWithFiles(files));
    e.target.value = ""; 
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    skipDiscardOnHideRef.current = true;
    const files = e.dataTransfer.files;
    await (selectedFiles.length > 0 ? appendFiles(files) : replaceWithFiles(files));
    window.setTimeout(() => (skipDiscardOnHideRef.current = false), 0);
  };

  const cropImage = (imageUrl, aspectRatio) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let cropWidth, cropHeight, cropX, cropY;
        

        
        // Izračunaj crop dimenzije prema aspect ratio-u
        switch (aspectRatio) {
          case '1:1':
            const size = Math.min(img.width, img.height);
            cropWidth = size;
            cropHeight = size;
            cropX = (img.width - size) / 2;
            cropY = (img.height - size) / 2;

            break;
          case '4:5':
            // 4:5 je vertikalni format (4 širina, 5 visina) - uži od kvadrata
            const ratio4_5 = 4 / 5; // 0.8

            
            // Koristimo manju dimenziju kao bazu da ne premašimo originalne dimenzije
            if (img.width / img.height > ratio4_5) {
              // Slika je šira od 4:5, koristimo visinu kao bazu
              cropHeight = img.height;
              cropWidth = img.height * ratio4_5;
              cropX = (img.width - cropWidth) / 2;
              cropY = 0;
            } else {
              // Slika je viša od 4:5, koristimo širinu kao bazu
              cropWidth = img.width;
              cropHeight = img.width / ratio4_5;
              cropX = 0;
              cropY = (img.height - cropHeight) / 2;
            }
            

            break;
          case '16:9':
            // 16:9 je široki format (16 širina, 9 visina)
            const ratio16_9 = 16 / 9;
            if (img.width / img.height > ratio16_9) {
              // Slika je šira od 16:9, trebamo odrezati širinu
              cropHeight = img.height;
              cropWidth = img.height * ratio16_9;
              cropX = (img.width - cropWidth) / 2;
              cropY = 0;
            } else {
              // Slika je viša od 16:9, trebamo odrezati visinu
              cropWidth = img.width;
              cropHeight = img.width / ratio16_9;
              cropX = 0;
              cropY = (img.height - cropHeight) / 2;
            }
            break;
          case 'original':
          default:
            cropWidth = img.width;
            cropHeight = img.height;
            cropX = 0;
            cropY = 0;
            break;
        }
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        

        
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageUrl;
    });
  };

  const getMinZoomScale = () => {
    switch (currentAspectRatio) {
      case '1:1':
        return 1; // Za kvadrat, početna vrijednost je 1
      case '4:5':
        return 1; // Za 4:5, početna vrijednost je 1
      case '16:9':
        return 1; // Za 16:9, početna vrijednost je 1
      case 'original':
        return 1; // Za original, početna vrijednost je 1
      default:
        return 1;
    }
  };

  const handleCropOption = async (aspectRatio) => {
    setCurrentAspectRatio(aspectRatio);
    setCropMode(true);
    setShowCropOptions(false);
    
    // Reset transformacije kada se promijeni aspect ratio
    setImageTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
    
    // Reset zoom slider
    setShowZoomOptions(false);

    // Crop sve slike prema odabranom formatu
    const croppedUrls = await Promise.all(
      previews.map(url => cropImage(url, aspectRatio))
    );
    setCroppedImages(croppedUrls);
  };

  const handleZoomOption = (zoomType) => {
    setZoomMode(true);
    setShowZoomOptions(false);
    
    switch (zoomType) {
      case 'zoomIn':
        setImageTransform(prev => ({
          ...prev,
          scale: Math.min(prev.scale * 1.2, 3)
        }));
        break;
      case 'zoomOut':
        setImageTransform(prev => ({
          ...prev,
          scale: Math.max(prev.scale / 1.2, 0.5)
        }));
        break;
      case 'reset':
        setImageTransform({
          scale: 1,
          translateX: 0,
          translateY: 0
        });
        break;
      default:
        break;
    }
  };

  const handleMouseDown = (e) => {
    if (cropMode || zoomMode) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imageTransform.translateX,
        y: e.clientY - imageTransform.translateY
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && (cropMode || zoomMode)) {
      const newTranslateX = e.clientX - dragStart.x;
      const newTranslateY = e.clientY - dragStart.y;
      
      setImageTransform(prev => ({
        ...prev,
        translateX: newTranslateX,
        translateY: newTranslateY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!showAddTray) return;
    const onDocDown = (ev) => {
      const tray = addTrayRef.current;
      const btn = galleryBtnRef.current;
      if (tray && tray.contains(ev.target)) return;
      if (btn && btn.contains(ev.target)) return;
      setShowAddTray(false);
    };
    document.addEventListener("mousedown", onDocDown, true);
    return () => document.removeEventListener("mousedown", onDocDown, true);
  }, [showAddTray]);

  useEffect(() => {
    const onDocDown = (ev) => {
      const cropOptions = cropOptionsRef.current;
      const zoomOptions = zoomOptionsRef.current;
      const cropBtn = document.querySelector('.crop-btn');
      const zoomBtn = document.querySelector('.zoom-btn');
      const zoomSlider = document.querySelector('.zoom-slider');
      
      if (cropOptions && cropOptions.contains(ev.target)) return;
      if (zoomOptions && zoomOptions.contains(ev.target)) return;
      if (zoomSlider && zoomSlider.contains(ev.target)) return;
      if (cropBtn && cropBtn.contains(ev.target)) return;
      if (zoomBtn && zoomBtn.contains(ev.target)) return;
      
      setShowCropOptions(false);
      setShowZoomOptions(false);
    };
    document.addEventListener("mousedown", onDocDown, true);
    return () => document.removeEventListener("mousedown", onDocDown, true);
  }, [showCropOptions, showZoomOptions]);

  // Ažuriraj scale kada se promijeni format da ne bude ispod početne vrijednosti
  useEffect(() => {
    if (imageTransform.scale < 1) {
      setImageTransform(prev => ({
        ...prev,
        scale: 1
      }));
    }
  }, [currentAspectRatio, imageTransform.scale]);

  const urlsRef = useRef([]);
  useEffect(() => {
    const oldUrls = urlsRef.current || [];
    const removed = oldUrls.filter((u) => !previews.includes(u));
    removed.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = previews;
  }, [previews]);

  const closeCreatePopup = () => {
    if (!hasImages && !isNextStep) {
      handleClose();
    } else {
      setShowDiscardDialog(true);
    }
  };

  const resetState = () => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    setSelectedFiles([]);
    setPreviews([]);
    setCurrentIndex(0);
    setIsNextStep(false);
    setDescValue("");
    setLocationInput("");
    setShowEmojiPicker(false);
    setShowAdvancedSettings(false);
    setShowAccessibility(false);
    setHideLikeCounts(false);
    setTurnOffCommenting(false);
    setAutoShareToThreads(false);
    setAltText("");
    setShowDiscardDialog(false);
    setShowAddTray(false);
    setShowCropOptions(false);
    setShowZoomOptions(false);
    setCropMode(false);
    setZoomMode(false);
    setCurrentAspectRatio('original');
    setImageTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
    setCropData({
      width: 100,
      height: 100,
      x: 0,
      y: 0
    });
    setCroppedImages([]);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onHide();
  };
  const closeCreatePopupForShare = () => {
    resetState();
    onHide();
  };

  const handleDiscard = () => {
    handleClose();
  };

  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
  };

  const handleRemoveImage = () => {
    if (imageToRemove !== null) {
      // Ukloni sliku iz svih listi
      const newSelectedFiles = selectedFiles.filter((_, index) => index !== imageToRemove);
      const newPreviews = previews.filter((_, index) => index !== imageToRemove);
      const newCroppedImages = croppedImages.filter((_, index) => index !== imageToRemove);
      
      setSelectedFiles(newSelectedFiles);
      setPreviews(newPreviews);
      setCroppedImages(newCroppedImages);
      
      // Ako je uklonjena trenutna slika, prebaci na prvu dostupnu
      if (imageToRemove === currentIndex) {
        if (newPreviews.length > 0) {
          setCurrentIndex(0);
        } else {
          // Ako nema više slika, resetiraj stanje
          resetState();
        }
      } else if (imageToRemove < currentIndex) {
        // Ako je uklonjena slika prije trenutne, smanji currentIndex
        setCurrentIndex(currentIndex - 1);
      }
    }
    
    setShowRemoveImageDialog(false);
    setImageToRemove(null);
  };

  const handleCancelRemoveImage = () => {
    setShowRemoveImageDialog(false);
    setImageToRemove(null);
  };

  const handleBack = () => {
    if (isNextStep) setIsNextStep(false);
    else resetState();
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleShare = async () => {
    if (!hasImages) {
      alert("Please select at least one image.");
      return;
    }

    try {
      // Koristi cropped slike ako postoje, inače originalne
      const imagesToUpload = croppedImages.length > 0 ? croppedImages : await Promise.all(
        selectedFiles.map((f) => convertToBase64(f))
      );

      const postData = {
        images: imagesToUpload,
        description: descValue,
        location: locationInput.trim() || null,
        alt_text: altText || null,
        options: {
          hideLikeCounts,
          turnOffCommenting,
          autoShareToThreads,
        },
      };

      await uploadUserImage(postData);

      toast.current?.show({
        severity: "success",
        summary: "Post Created",
        detail: "Slika je uspješno dodana!",
        life: 3000,
      });

      // Dispatch custom event za osvježavanje feed-a
      window.dispatchEvent(new CustomEvent('newPostUploaded'));

      skipDiscardOnHideRef.current = true;
      onImageUploaded?.();
      closeCreatePopupForShare();

      setTimeout(() => {
        skipDiscardOnHideRef.current = false;
      }, 0);
    } catch (err) {
      console.error("Error sharing post:", err);
      if (err?.status === 401 || err?.response?.status === 401) {
        alert("Session expired. Please log in again.");
      } else {
        alert(err?.message || "An error occurred while sharing the post.");
      }
    }
  };

  const addEmoji = (emojiObject) => {
    setDescValue((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const maxCharLimit = 2200;

  const handleTextChange = (e) => {
    if (e.target.value.length <= maxCharLimit) {
      setDescValue(e.target.value);
    }
  };

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries")
      .then((response) => response.json())
      .then((data) => {
        if (!data.error && data.data) {
          const countriesAndCities = data.data.reduce((acc, country) => {
            acc.push(country.country);
            if (Array.isArray(country.cities)) {
              return acc.concat(country.cities);
            }
            return acc;
          }, []);
          setAllCities(countriesAndCities);
        }
      })
      .catch((error) => console.error("Error fetching countries:", error));
  }, []);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    if (value.trim() !== "") {
      const filtered = allCities.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectCity = (city) => {
    setLocationInput(city);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutsideLocation = (event) => {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideLocation);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideLocation);
    };
  }, []);

  const requestCloseCreate = () => {
    const isDirty = hasImages || !!descValue || !!locationInput;
    if (isDirty) setShowDiscardDialog(true);
    else handleClose();
  };

  const currentUrl = previews[currentIndex] || null;
  const canGoPrev = selectedFiles.length > 1 && currentIndex > 0;
  const canGoNext = selectedFiles.length > 1 && currentIndex < selectedFiles.length - 1;
  const gotoPrev = () => {
    if (canGoPrev) setCurrentIndex((i) => i - 1);
  };
  const gotoNext = () => {
    if (canGoNext) setCurrentIndex((i) => i + 1);
  };

  useEffect(() => {
    setCurrentIndex((i) => {
      if (selectedFiles.length === 0) return 0;
      if (i < 0) return 0;
      if (i > selectedFiles.length - 1) return selectedFiles.length - 1;
      return i;
    });
  }, [selectedFiles.length]);

  return (
    <>
      <Dialog
        className="create-dialog"
        visible={visible}
        onHide={() => {
          if (skipDiscardOnHideRef.current) {
            skipDiscardOnHideRef.current = false;
            return;
          }
          requestCloseCreate();
        }}
        dismissableMask={!isChoosingFile}
        closeOnEscape={!isChoosingFile}
        modal
        blockScroll
        position="center"
        style={{ width: "min(90vw, 820px)", borderRadius: "4px" }}
        contentStyle={{ padding: 0, height: "min(76vh, 720px)", overflow: "hidden" }}
        closable={false}
        header={
          <div className="dlg-header">
            {hasImages || isNextStep ? (
              <button
                className="back-arrow"
                onClick={handleBack}
                aria-label="Back"
              >
                <svg
                  aria-label="Back"
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <line
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    x1="2.909"
                    x2="22.001"
                    y1="12.004"
                    y2="12.004"
                  ></line>
                  <polyline
                    fill="none"
                    points="9.276 4.726 2.001 12.004 9.276 19.274"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></polyline>
                </svg>
              </button>
            ) : (
              <span />
            )}

            <div className="dlg-title">
              {isNextStep ? "Create new post" : hasImages ? "Crop" : "Create new post"}
            </div>

            {isNextStep ? (
              <button
                className="next-button"
                onClick={handleShare}
                disabled={!hasImages}
              >
                Share
              </button>
            ) : hasImages ? (
              <button
                className="next-button"
                onClick={() => setIsNextStep(true)}
              >
                Next
              </button>
            ) : (
              <span />
            )}
          </div>
        }
      >
        {visible && (
          <button
            className="close-dialog-button"
            onClick={closeCreatePopup}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 9999,
              color: "white",
            }}
          >
            <svg
              aria-label="Close"
              fill="currentColor"
              height="16"
              role="img"
              viewBox="0 0 24 24"
              width="16"
            >
              <polyline
                fill="none"
                points="20.643 3.357 3.357 20.643"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></polyline>
              <polyline
                fill="none"
                points="3.357 3.357 20.643 20.643"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></polyline>
            </svg>
          </button>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          ref={fileInputRef}
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileChange}
        />

        {/* STEP 1: CROP */}
        {!isNextStep ? (
          hasImages ? (
            <div 
              className={`crop-stage ${
                currentAspectRatio === '1:1' ? 'ratio-1x1' :
                currentAspectRatio === '4:5' ? 'ratio-4x5' :
                currentAspectRatio === '16:9' ? 'ratio-16x9' :
                'ratio-original'
              }`} 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleDrop}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
                              {previews[currentIndex] && (
                  <img 
                    src={croppedImages[currentIndex] || previews[currentIndex]} 
                    alt="Selected" 
                    className={currentAspectRatio === 'original' ? 'original-format' : `cropped-format ratio-${currentAspectRatio.replace(':', 'x')}`}
                    style={{
                      transform: `scale(${imageTransform.scale}) translate(${imageTransform.translateX}px, ${imageTransform.translateY}px)`,
                      transition: isDragging ? 'none' : 'transform 0.3s ease'
                    }}
                  />
                )}

              {canGoPrev && (
                <button className="nav-arrow left" onMouseDown={(e)=>e.stopPropagation()} onClick={(e) => {e.stopPropagation(); gotoPrev();}} aria-label="Previous">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              {canGoNext && (
                <button className="nav-arrow right" onMouseDown={(e)=>e.stopPropagation()} onClick={(e) => {e.stopPropagation(); gotoNext();}} aria-label="Next">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}

              <div className="crop-footer">
                <div className="crop-footer-left">
                  <button
                    className={`circle-btn crop-btn ${showCropOptions ? "active" : ""}`}
                    title="Select Crop"
                    aria-label="Select Crop"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowCropOptions(!showCropOptions);
                      setShowZoomOptions(false);
                    }}
                  >
                    <svg aria-label="Select Crop" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16">
                      <title>Select Crop</title>
                      <path d="M10 20H4v-6a1 1 0 0 0-2 0v7a1 1 0 0 0 1 1h7a1 1 0 0 0 0-2ZM20.999 2H14a1 1 0 0 0 0 2h5.999v6a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1Z"></path>
                    </svg>
                  </button>
                  <button
                    className={`circle-btn zoom-btn ${showZoomOptions ? "active" : ""}`}
                    title="Select Zoom"
                    aria-label="Select Zoom"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowZoomOptions(!showZoomOptions);
                      setShowCropOptions(false);
                    }}
                  >
                    <svg aria-label="Select Zoom" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16">
                      <title>Select Zoom</title>
                      <path d="m22.707 21.293-4.825-4.825a9.519 9.519 0 1 0-1.414 1.414l4.825 4.825a1 1 0 0 0 1.414-1.414ZM10.5 18.001a7.5 7.5 0 1 1 7.5-7.5 7.509 7.509 0 0 1-7.5 7.5Zm3.5-8.5h-2.5v-2.5a1 1 0 1 0-2 0v2.5H7a1 1 0 1 0 0 2h2.5v2.5a1 1 0 0 0 2 0v-2.5H14a1 1 0 0 0 0-2Z"></path>
              </svg>
                  </button>
                </div>
                <div className="crop-footer-right">
              <button
                    ref={galleryBtnRef}
                    className={`circle-btn ${showAddTray ? "invert" : ""}`}
                    title="Open Media Gallery"
                    aria-label="Open Media Gallery"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setShowAddTray((s) => !s); }}
                  >
                    <svg aria-label="Open Media Gallery" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16">
                      <title>Open Media Gallery</title>
                      <path d="M19 15V5a4.004 4.004 0 0 0-4-4H5a4.004 4.004 0 0 0-4 4v10a4.004 4.004 0 0 0 4 4h10a4.004 4.004 0 0 0 4-4ZM3 15V5a2.002 2.002 0 0 1 2-2h10a2.002 2.002 0 0 1 2 2v10a2.002 2.002 0 0 1-2 2H5a2.002 2.002 0 0 1-2-2Zm18.862-8.773A.501.501 0 0 0 21 6.57v8.431a6 6 0 0 1-6 6H6.58a.504.504 0 0 0-.35.863A3.944 3.944 0 0 0 9 23h6a8 8 0 0 0 8-8V9a3.95 3.95 0 0 0-1.138-2.773Z" fillRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Crop Options */}
              {showCropOptions && (
                <div ref={cropOptionsRef} className="crop-options" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <div className="crop-options-card">
                    <div className={`crop-option ${currentAspectRatio === 'original' ? 'active' : ''}`} onClick={async () => await handleCropOption('original')}>
                      <span>Original</span>
                      <svg aria-label="Photo outline icon" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                        <title>Photo outline icon</title>
                        <path d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z" fillRule="evenodd"></path>
                        <path d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
                        <path d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564h0v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </div>
                    <div className={`crop-option ${currentAspectRatio === '1:1' ? 'active' : ''}`} onClick={async () => await handleCropOption('1:1')}>
                      <span>1:1</span>
                      <svg aria-label="Crop square icon" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                        <title>Crop square icon</title>
                        <path d="M19 23H5a4.004 4.004 0 0 1-4-4V5a4.004 4.004 0 0 1 4-4h14a4.004 4.004 0 0 1 4 4v14a4.004 4.004 0 0 1-4 4ZM5 3a2.002 2.002 0 0 0-2 2v14a2.002 2.002 0 0 0 2 2h14a2.002 2.002 0 0 0 2-2V5a2.002 2.002 0 0 0-2-2Z"></path>
                      </svg>
                    </div>
                    <div className={`crop-option ${currentAspectRatio === '4:5' ? 'active' : ''}`} onClick={async () => await handleCropOption('4:5')}>
                      <span>4:5</span>
                      <svg aria-label="Crop portrait icon" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                        <title>Crop portrait icon</title>
                        <path d="M16 23H8a4.004 4.004 0 0 1-4-4V5a4.004 4.004 0 0 1 4-4h8a4.004 4.004 0 0 1 4 4v14a4.004 4.004 0 0 1-4 4ZM8 3a2.002 2.002 0 0 0-2 2v14a2.002 2.002 0 0 0 2 2h8a2.002 2.002 0 0 0 2-2V5a2.002 2.002 0 0 0-2-2Z"></path>
                      </svg>
                    </div>
                    <div className={`crop-option ${currentAspectRatio === '16:9' ? 'active' : ''}`} onClick={async () => await handleCropOption('16:9')}>
                      <span>16:9</span>
                      <svg aria-label="Crop landscape icon" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                        <title>Crop landscape icon</title>
                        <path d="M19 20H5a4.004 4.004 0 0 1-4-4V8a4.004 4.004 0 0 1 4-4h14a4.004 4.004 0 0 1 4 4v8a4.004 4.004 0 0 1-4 4ZM5 6a2.002 2.002 0 0 0-2 2v8a2.002 2.002 0 0 0 2 2h14a2.002 2.002 0 0 0 2-2V8a2.002 2.002 0 0 0-2-2Z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Zoom Options */}
              {showZoomOptions && (
                <div ref={zoomOptionsRef} className="zoom-slider" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={Math.max(imageTransform.scale, 1)}
                    onChange={(e) => {
                      const newScale = parseFloat(e.target.value);
                      setImageTransform(prev => ({
                        ...prev,
                        scale: Math.max(newScale, 1)
                      }));
                    }}
                  />
                </div>
              )}

              {/* Image dots indicator */}
              {previews.length > 1 && (
                <div className="image-dots">
                  {previews.map((_, index) => (
                    <div
                      key={index}
                      className={`image-dot ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                </div>
              )}

              {showAddTray && (
                <div ref={addTrayRef} className="add-tray" onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>e.stopPropagation()}>
                  {/* <div className="reorder-hint">Click and drag to reorder</div> */}
                  <div className="add-tray-card">
                    <div className="thumbs-list">
                      {previews.map((url, idx) => (
                        <div key={idx} className={`thumb ${idx===currentIndex?"active":""}`} onClick={() => setCurrentIndex(idx)}>
                          <img src={url} alt={`thumb-${idx}`} />
                          {idx===currentIndex && (
                            <button className="thumb-x" aria-label="Remove" onClick={() => {
                              setImageToRemove(idx);
                              setShowRemoveImageDialog(true);
                            }}>×</button>
                          )}
                        </div>
                      ))}
                      {selectedFiles.length < MAX_IMAGES && (
                        <button className="thumb-plus" aria-label="Add more" onClick={() => openNativeFileDialog(true)}>
                          <svg fill="currentColor" viewBox="0 0 24 24" width="36" height="36">
                            <path d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1z"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="picker-stage"
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={(e) => { e.preventDefault(); skipDiscardOnHideRef.current = true; replaceWithFiles(e.dataTransfer.files); setTimeout(() => (skipDiscardOnHideRef.current = false), 0); }}>
              <svg aria-label="Icon to represent media such as images or videos" className="picker-icon" fill="currentColor" height="77" role="img" viewBox="0 0 97.6 77.3" width="96">
                <title>Icon to represent media such as images or videos</title>
                <path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z" fill="currentColor"></path>
                <path d="M84.7 18.4 58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.7-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.8.3L7 49 5.2 17c-.2-2.3.6-4.5 2-6.2zm8.7 48c-4.3.2-8.1-2.8-8.8-7.1l9.4-10.5c.2-.3.6-.4 1-.5.4 0 .7.1 1 .4l7.8 7c.7.6 1.6.9 2.5.9.9 0 1.7-.5 2.3-1.1l7.8-8.8-1.1 18.6-21.9 1.1zm76.5-29.5-2 34c-.3 4.6-4.3 8.2-8.9 7.9l-34-2c-4.6-.3-8.2-4.3-7.9-8.9l2-34c.3-4.4 3.9-7.9 8.4-7.9h.5l34 2c4.7.3 8.2 4.3 7.9 8.9z" fill="currentColor"></path>
                <path d="M78.2 41.6 61.3 30.5c-2.1-1.4-4.9-.8-6.2 1.3-.4.7-.7 1.4-.7 2.2l-1.2 20.1c-.1 2.5 1.7 4.6 4.2 4.8h.3c.7 0 1.4-.2 2-.5l18-9c2.2-1.1 3.1-3.8 2-6-.4-.7-.9-1.3-1.5-1.5-1.8zm-1.4 6-18 9c-.4.2-.8.3-1.3.3-.4 0-.9-.2-1.2-.4-.7-.5-1.2-1.3-1.1-2.2l1.2-20.1c.1-.9.6-1.7 1.4-2.1.8-.4 1.7-.3 2.5.1L77 43.3c1.2.8 1.5 2.3.7 3.4-.2.4-.5.7-.9.9z" fill="currentColor"></path>
              </svg>
              <p className="dragdrop-create-text">Drag photos and videos here</p>
              <button className="custom-choose-btn" onClick={() => openNativeFileDialog(false)}>
                Select From Computer
              </button>
            </div>
          )
        ) : (
          /* STEP 2: SHARE */
          <div className="photo-create-container">
            <div className="main-content-post-photo">
              <div className="main-content-post-photo-LEFT">
                {previews[currentIndex] && (
                  <>
                    <img 
                      src={croppedImages[currentIndex] || previews[currentIndex]} 
                      alt="Selected" 
                      className={`selected-image ${currentAspectRatio === 'original' ? 'original-format' : `cropped-format ratio-${currentAspectRatio.replace(':', 'x')}`}`}
                      style={{
                        transform: `scale(${imageTransform.scale}) translate(${imageTransform.translateX}px, ${imageTransform.translateY}px)`,
                        transformOrigin: 'center'
                      }}
                    />
                    {canGoPrev && (
                      <button className="nav-arrow left" onMouseDown={(e)=>e.stopPropagation()} onClick={(e) => {e.stopPropagation(); gotoPrev();}} aria-label="Previous">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    )}
                    {canGoNext && (
                      <button className="nav-arrow right" onMouseDown={(e)=>e.stopPropagation()} onClick={(e) => {e.stopPropagation(); gotoNext();}} aria-label="Next">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="main-content-post-photo-RIGHT">
                <div className="right-container-username-create">
                  <div className="main-story-container-create">
                    <div className="outer-circle-create">
                      <div className="story-container-create">
                        <img
                          key={profileSrc}
                          src={profileSrc}
                          alt="User Profile"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = profilePicDefault;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="create-username-text">
                    {userData?.username || "Unknown User"}
                  </p>
                </div>

                <div className="text-area-create-container">
                  <InputTextarea
                    className="custom-input-textarea"
                    autoResize={false}
                    value={descValue}
                    onChange={handleTextChange}
                    rows={5}
                    cols={60}
                    style={{
                      maxHeight: "155px",
                      overflowY: "auto",
                      resize: "none",
                      border: "none",
                    }}
                  />
                </div>

                <div className="footer-create-share-cont">
                  <div className="emoji-container" ref={emojiRef}>
                    <svg
                      aria-label="Emoji"
                      className="emoji-icon"
                      fill="currentColor"
                      height="28"
                      role="img"
                      viewBox="0 0 24 24"
                      width="20"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      style={{ cursor: "pointer" }}
                    >
                      <title>Emoji</title>
                      <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                    </svg>

                    {showEmojiPicker && (
                      <div className="emoji-picker-second">
                        <EmojiPicker onEmojiClick={addEmoji} />
                      </div>
                    )}
                  </div>
                  <p className="letter-counter-text">
                    {descValue.length}/{maxCharLimit}
                  </p>
                </div>
                <hr
                style={{
                  width: "19em",
                  border: 0,
                  borderTop: "1px solid #e0e0e0",
                  marginLeft: "-1em",
                }}
              />
                <div className="actions-container">
                  <div
                    className="inner-action-container"
                    style={{ position: "relative" }}
                    ref={locationContainerRef}
                  >
                    <input
                      type="text"
                      placeholder="Add Location"
                      value={locationInput}
                      onChange={handleLocationChange}
                      onFocus={() => setShowDropdown(true)}
                      className="actions-container-text"
                      style={{
                        color: "#000",
                        backgroundColor: "#fff",
                        padding: "0.5em",
                        border: "none",
                        marginLeft: "-0.5em",
                      }}
                    />
                    {showDropdown && filteredCities.length > 0 && (
                      <ul
                        className="location-dropdown"
                        style={{
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          listStyle: "none",
                          margin: 0,
                          padding: "0.5em",
                          position: "absolute",
                          top: "100%",
                          zIndex: 1000,
                          width: "90%",
                          maxHeight: "100px",
                          overflowY: "auto",
                          borderRadius: "8px",
                        }}
                      >
                        {filteredCities.map((city, index) => (
                          <li
                            key={index}
                            onClick={() => selectCity(city)}
                            style={{ padding: "0.2em 0", cursor: "pointer" }}
                          >
                            {city}
                          </li>
                        ))}
                      </ul>
                    )}
                    <svg
                      aria-label="Add Location"
                      className="x1lliihq x1n2onr6 x1roi4f4"
                      fill="currentColor"
                      height="19"
                      role="img"
                      viewBox="0 0 24 24"
                      width="19"
                    >
                      <title>Add Location</title>
                      <path d="M12.053 8.105a1.604 1.604 0 1 0 1.604 1.604 1.604 1.604 0 0 0-1.604-1.604Zm0-7.105a8.684 8.684 0 0 0-8.708 8.66c0 5.699 6.14 11.495 8.108 13.123a.939.939 0 0 0 1.2 0c1.969-1.628 8.109-7.424 8.109-13.123A8.684 8.684 0 0 0 12.053 1Zm0 19.662C9.29 18.198 5.345 13.645 5.345 9.66a6.709 6.709 0 0 1 13.417 0c0 3.985-3.944 8.538-6.709 11.002Z"></path>
                    </svg>
                  </div>

                  <div className="inner-action-container-second">
                    <p className="actions-container-text">Add collaborators</p>
                    <svg
                      aria-label="Add collaborators"
                      className="x1lliihq x1n2onr6 x1roi4f4"
                      fill="currentColor"
                      height="19"
                      role="img"
                      viewBox="0 0 24 24"
                      width="19"
                    >
                      <title>Add collaborators</title>
                      <path d="M21 10a1 1 0 0 0-1 1v9c0 .932-.643 1.71-1.507 1.931C18.429 19.203 16.199 17 13.455 17H8.55c-2.745 0-4.974 2.204-5.037 4.933A1.999 1.999 0 0 1 2 20V6c0-1.103.897-2 2-2h9a1 1 0 1 0 0-2H4C1.794 2 0 3.794 0 6v14c0 2.206 1.794 4 4 4h14c2.206 0 4-1.794 4-4v-9a1 1 0 0 0-1-1zM8.549 19h4.906a3.05 3.05 0 0 1 3.045 3H5.505a3.05 3.05 0 0 1 3.044-3z"></path>
                      <path d="M6.51 11.002c0 2.481 2.02 4.5 4.502 4.5 2.48 0 4.499-2.019 4.499-4.5s-2.019-4.5-4.5-4.5a4.506 4.506 0 0 0-4.5 4.5zm7 0c0 1.378-1.12 2.5-2.498 2.5-1.38 0-2.501-1.122-2.501-2.5s1.122-2.5 2.5-2.5a2.502 2.502 0 0 1 2.5 2.5zM23.001 3.002h-2.004V1a1 1 0 1 0-2 0v2.002H17a1 1 0 1 0 0 2h1.998v2.003a1 1 0 1 0 2 0V5.002h2.004a1 1 0 1 0 0-2z"></path>
                    </svg>
                  </div>

                  <div
                    className="inner-action-container-third"
                    onClick={() => setShowAccessibility(!showAccessibility)}
                    style={{ cursor: "pointer" }}
                  >
                    <p
                      className="actions-container-text"
                      style={{
                        fontWeight: showAccessibility ? "600" : "normal",
                        color: showAccessibility ? "#262626" : "inherit",
                      }}
                    >
                      Accessibility
                    </p>
                    <svg
                      aria-label="Down Chevron Icon"
                      className="x1lliihq x1n2onr6 x5n08af"
                      fill="currentColor"
                      height="19"
                      role="img"
                      viewBox="0 0 24 24"
                      width="19"
                      style={{
                        transform: showAccessibility
                          ? "rotate(0deg)"
                          : "rotate(180deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <title>Down Chevron Icon</title>
                      <path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"></path>
                    </svg>
                  </div>

                  {showAccessibility && (
                    <div
                      style={{
                        paddingLeft: "0.5em",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          margin: "0 0 16px 0",
                          lineHeight: "16px",
                        }}
                      >
                        Alt text describes your photos for people with visual
                        impairments. Alt text will be automatically created for
                        your photos or you can choose to write your own.
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {previews[currentIndex] && (
                            <img
                              src={previews[currentIndex]}
                              alt="Preview"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <textarea
                            placeholder="Write alt text..."
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            style={{
                              width: "100%",
                              minHeight: "60px",
                              maxHeight: "120px",
                              padding: "8px 12px",
                              border: "1px solid #dbdbdb",
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontFamily: "inherit",
                              resize: "vertical",
                              outline: "none",
                              overflowY: "auto",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#0095f6";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#dbdbdb";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className="inner-action-container-forth"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <p
                      className="actions-container-text"
                      style={{
                        fontWeight: showAdvancedSettings ? "600" : "normal",
                        color: showAdvancedSettings ? "#262626" : "inherit",
                      }}
                    >
                      Advanced Settings
                    </p>
                    <svg
                      aria-label="Down Chevron Icon"
                      className="x1lliihq x1n2onr6 x5n08af"
                      fill="currentColor"
                      height="19"
                      role="img"
                      viewBox="0 0 24 24"
                      width="19"
                      style={{
                        transform: showAdvancedSettings
                          ? "rotate(0deg)"
                          : "rotate(180deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <title>Down Chevron Icon</title>
                      <path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"></path>
                    </svg>
                  </div>
          

                  {showAdvancedSettings && (
                    <div
                      style={{
                        paddingLeft: "0.5em",
                        width: "15em",
                      }}
                    >
                      <div style={{ marginBottom: "20px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontWeight: "600",
                                fontSize: "14px",
                                margin: "0 0 4px 0",
                                color: "#262626",
                              }}
                            >
                              Hide like and view counts on this post
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                margin: "0",
                                lineHeight: "16px",
                              }}
                            >
                              Only you will see the total number of likes and
                              views on this post. You can change this later by
                              going to the ... menu at the top of the post. To
                              hide like counts on other people's posts, go to
                              your account settings.{" "}
                              <a
                                href="https://help.instagram.com/113355287252104"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#4A5DF9",
                                  cursor: "pointer",
                                  textDecoration: "none",
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.textDecoration = "underline")
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.textDecoration = "none")
                                }
                                onClick={(e) => e.stopPropagation()}
                              >
                                Learn more
                              </a>
                            </p>
                          </div>
                          <div
                            style={{
                              marginLeft: "16px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <div
                              onClick={() => setHideLikeCounts(!hideLikeCounts)}
                              style={{
                                width: "44px",
                                height: "24px",
                                backgroundColor: hideLikeCounts
                                  ? "#262626"
                                  : "#dbdbdb",
                                borderRadius: "12px",
                                position: "relative",
                                cursor: "pointer",
                                transition: "background-color 0.2s ease",
                              }}
                            >
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  backgroundColor: "white",
                                  borderRadius: "50%",
                                  position: "absolute",
                                  top: "2px",
                                  left: hideLikeCounts ? "22px" : "2px",
                                  transition: "left 0.2s ease",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: "20px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontWeight: "600",
                                fontSize: "14px",
                                margin: "0 0 4px 0",
                                color: "#262626",
                              }}
                            >
                              Turn off commenting
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                margin: "0",
                                lineHeight: "16px",
                              }}
                            >
                              You can change this later by going to the ... menu
                              at the top of your post.
                            </p>
                          </div>
                          <div
                            style={{
                              marginLeft: "16px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <div
                              onClick={() =>
                                setTurnOffCommenting(!turnOffCommenting)
                              }
                              style={{
                                width: "44px",
                                height: "24px",
                                backgroundColor: turnOffCommenting
                                  ? "#262626"
                                  : "#dbdbdb",
                                borderRadius: "12px",
                                position: "relative",
                                cursor: "pointer",
                                transition: "background-color 0.2s ease",
                              }}
                            >
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  backgroundColor: "white",
                                  borderRadius: "50%",
                                  position: "absolute",
                                  top: "2px",
                                  left: turnOffCommenting ? "22px" : "2px",
                                  transition: "left 0.2s ease",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontWeight: "600",
                                fontSize: "14px",
                                margin: "0 0 4px 0",
                                color: "#262626",
                              }}
                            >
                              Automatically share to Threads
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                margin: "0",
                                lineHeight: "16px",
                              }}
                            >
                              Always share your posts to Threads. You can change
                              your audience on Threads settings{" "}
                              <a
                                href="https://help.instagram.com/1188715848969926"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#4A5DF9",
                                  cursor: "pointer",
                                  textDecoration: "none",
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.textDecoration = "underline")
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.textDecoration = "none")
                                }
                                onClick={(e) => e.stopPropagation()}
                              >
                                Learn more
                              </a>
                            </p>
                          </div>
                          <div
                            style={{
                              marginLeft: "16px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <div
                              onClick={() =>
                                setAutoShareToThreads(!autoShareToThreads)
                              }
                              style={{
                                width: "44px",
                                height: "24px",
                                backgroundColor: autoShareToThreads
                                  ? "#262626"
                                  : "#dbdbdb",
                                borderRadius: "12px",
                                position: "relative",
                                cursor: "pointer",
                                transition: "background-color 0.2s ease",
                              }}
                            >
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  backgroundColor: "white",
                                  borderRadius: "50%",
                                  position: "absolute",
                                  top: "2px",
                                  left: autoShareToThreads ? "22px" : "2px",
                                  transition: "left 0.2s ease",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <hr
                style={{
                  width: "19em",
                  border: 0,
                  borderTop: "1px solid #e0e0e0",
                  marginLeft: "-1em",
                }}
              />
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Remove Image Confirmation Dialog */}
      {showRemoveImageDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
          }}
          onClick={handleCancelRemoveImage}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "25em",
              maxWidth: "90vw",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 16px 0 16px", textAlign: "center" }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#262626",
                }}
              >
                Discard photo?
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: "18px",
                }}
              >
                This will remove the photo from your post.
              </p>
            </div>
            <div
              style={{
                borderTop: "1px solid #dbdbdb",
                marginTop: "16px",
              }}
            >
              <button
                onClick={handleRemoveImage}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "#ED4956",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  borderBottom: "1px solid #dbdbdb",
                }}
              >
                Discard
              </button>
              <button
                onClick={handleCancelRemoveImage}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "#262626",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Dialog */}
      {showDiscardDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
          }}
          onClick={handleCancelDiscard}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "25em",
              maxWidth: "90vw",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 16px 0 16px", textAlign: "center" }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#262626",
                }}
              >
                Discard post?
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: "18px",
                }}
              >
                If you leave, your edits won't be saved.
              </p>
            </div>
            <div
              style={{
                borderTop: "1px solid #dbdbdb",
                marginTop: "16px",
              }}
            >
              <button
                onClick={handleDiscard}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "#ED4956",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  borderBottom: "1px solid #dbdbdb",
                }}
              >
                Discard
              </button>
              <button
                onClick={handleCancelDiscard}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "#262626",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast ref={toast} />
    </>
  );
};

export default CreatePostDialog;
