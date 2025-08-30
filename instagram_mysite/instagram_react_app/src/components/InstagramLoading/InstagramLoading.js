import React from 'react';
import './InstagramLoading.css';
import instagramLoading from '../../imgs/Instagram_loading.png';
import metaLoading from '../../imgs/Meta_loading.png';

const InstagramLoading = () => {
  return (
    <div className="instagram-loading">
      <div className="instagram-loading-content">
        <img src={instagramLoading} alt="Instagram" className="instagram-logo" />
        <img src={metaLoading} alt="Meta" className="meta-loading" />
      </div>
    </div>
  );
};

export default InstagramLoading;
