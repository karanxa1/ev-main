import React, { useState, useEffect } from 'react';
import './OptimizedImage.css';

const OptimizedImage = ({
  src,
  alt,
  fallbackSrc,
  width,
  height,
  className,
  onLoad,
  onError,
  loading = 'lazy',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState('');
  const [isWebPSupported, setIsWebPSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check WebP support
  useEffect(() => {
    const checkWebPSupport = async () => {
      try {
        const webpImage = new Image();
        webpImage.onload = () => setIsWebPSupported(true);
        webpImage.onerror = () => setIsWebPSupported(false);
        webpImage.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
      } catch (e) {
        setIsWebPSupported(false);
      }
    };
    checkWebPSupport();
  }, []);

  // Convert image URL to WebP if supported
  useEffect(() => {
    if (!src) return;

    const convertToWebP = async () => {
      try {
        if (isWebPSupported) {
          // If the image is already WebP, use it directly
          if (src.toLowerCase().endsWith('.webp')) {
            setImgSrc(src);
            return;
          }

          // Convert to WebP using a service or local conversion
          // For now, we'll use the original image
          // TODO: Implement actual WebP conversion
          setImgSrc(src);
        } else {
          setImgSrc(src);
        }
      } catch (error) {
        console.error('Error converting image:', error);
        setImgSrc(src);
      }
    };

    convertToWebP();
  }, [src, isWebPSupported]);

  const handleLoad = (e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    if (onError) onError(e);
  };

  return (
    <div 
      className={`optimized-image-container ${className || ''} ${isLoading ? 'loading' : ''}`}
      style={{ width, height }}
    >
      {isLoading && (
        <div className="image-placeholder">
          <div className="loading-spinner"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`optimized-image ${isLoading ? 'loading' : ''} ${hasError ? 'error' : ''}`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage; 