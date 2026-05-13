import React from 'react';
import styles from './LoadingScreen.module.css';

const LoadingScreen = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>BV<span>Contabilidade</span></div>
        <div className={styles.loader}>
          <div className={styles.bar}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
