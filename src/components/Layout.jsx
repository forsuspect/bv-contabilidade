import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import styles from './Layout.module.css';

const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={styles.container}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />
      
      {/* Overlay to close sidebar on mobile when clicking outside */}
      {isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <div className={`${styles.main} ${isSidebarCollapsed ? styles.mainExpanded : ''}`}>
        <Navbar 
          isSidebarCollapsed={isSidebarCollapsed} 
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        <div className={styles.content}>
          <Outlet />
          <footer className={styles.footer}>
            <p>Desenvolvido por <a href="https://automize-xi.vercel.app/index.html#solucoes" target="_blank" rel="noopener noreferrer">Automize</a></p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;
