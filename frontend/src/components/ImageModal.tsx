import React, { useEffect } from 'react';

interface Props {
  src: string | null | undefined;
  alt?: string;
  onClose: () => void;
}

export default function ImageModal({ src, alt = '', onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, overflow: 'hidden' }}>
        <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain' }} />
      </div>
    </div>
  );
}
