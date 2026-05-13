import React, { useState, useEffect } from 'react';
import styles from './SafeToast.module.css';

const SafeToast = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type } = e.detail;
      setToast({ message, type });
      
      // Auto-remove
      setTimeout(() => {
        setToast(null);
      }, 3500);
    };

    window.addEventListener('bv-toast', handleToast);
    return () => window.removeEventListener('bv-toast', handleToast);
  }, []);

  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type || 'info']}`}>
      {toast.message}
    </div>
  );
};

export default SafeToast;
