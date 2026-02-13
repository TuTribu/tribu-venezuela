'use client';

import { useState, useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function ImageLightbox({ images, initialIndex, isOpen, onClose, productName }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Reset zoom when changing images
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [currentIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex(i => i > 0 ? i - 1 : images.length - 1);
  }, [images.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex(i => i < images.length - 1 ? i + 1 : 0);
  }, [images.length]);

  // Zoom controls
  const zoomIn = () => setScale(s => Math.min(s * 1.5, 4));
  const zoomOut = () => {
    setScale(s => {
      const newScale = Math.max(s / 1.5, 1);
      if (newScale === 1) setTranslate({ x: 0, y: 0 });
      return newScale;
    });
  };
  const resetZoom = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Touch handlers for pinch zoom and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartPos({ x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      setTranslate({
        x: e.touches[0].clientX - startPos.x,
        y: e.touches[0].clientY - startPos.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Double tap to zoom
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2);
      }
    }
    setLastTap(now);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        color: '#FFF',
      }}>
        <span style={{ fontSize: 14, opacity: 0.8 }}>
          {currentIndex + 1} / {images.length} · {productName}
        </span>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#FFF',
            width: 40,
            height: 40,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* Main image container */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#FFF',
                width: 48,
                height: 48,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 24,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >‹</button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#FFF',
                width: 48,
                height: 48,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 24,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >›</button>
          </>
        )}

        {/* Image with zoom */}
        <img
          src={images[currentIndex]}
          alt={`${productName} - Foto ${currentIndex + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            cursor: scale > 1 ? 'grab' : 'default',
          }}
          draggable={false}
        />
      </div>

      {/* Bottom controls */}
      <div style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
      }}>
        {/* Zoom controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}>
          <button 
            onClick={zoomOut}
            disabled={scale <= 1}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#FFF',
              width: 44,
              height: 44,
              borderRadius: '50%',
              cursor: scale <= 1 ? 'not-allowed' : 'pointer',
              fontSize: 20,
              opacity: scale <= 1 ? 0.5 : 1,
            }}
          >−</button>
          <button 
            onClick={resetZoom}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#FFF',
              padding: '0 20px',
              height: 44,
              borderRadius: 22,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >{Math.round(scale * 100)}%</button>
          <button 
            onClick={zoomIn}
            disabled={scale >= 4}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#FFF',
              width: 44,
              height: 44,
              borderRadius: '50%',
              cursor: scale >= 4 ? 'not-allowed' : 'pointer',
              fontSize: 20,
              opacity: scale >= 4 ? 0.5 : 1,
            }}
          >+</button>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            justifyContent: 'center',
            padding: '8px 0',
          }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: currentIndex === i ? '3px solid var(--tierra)' : '2px solid rgba(255,255,255,0.3)',
                  padding: 0,
                  background: '#000',
                  flexShrink: 0,
                  opacity: currentIndex === i ? 1 : 0.6,
                }}
              >
                <img
                  src={img}
                  alt={`Miniatura ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Instructions */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 12,
          margin: 0,
        }}>
          Doble toque para zoom · Arrastra para mover · Esc para cerrar
        </p>
      </div>
    </div>
  );
}
