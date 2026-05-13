import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, User as UserIcon, Menu } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = ({ isSidebarCollapsed, toggleMobileMenu }) => {
  const { user } = useAuth();

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <button className={styles.hamburgerBtn} onClick={toggleMobileMenu}>
          <Menu size={24} />
        </button>
        <div className={styles.search}>
          <Search size={20} className={styles.searchIcon} />
          <input type="text" placeholder="Pesquisar no sistema..." />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.notificationBtn}>
          <Bell size={22} />
          <span className={styles.badge}></span>
        </button>

        <Link to="/profile" className={styles.profile} style={{ textDecoration: 'none' }}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userRole}>{user?.role}</p>
          </div>
          <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} alt={user?.name} className={styles.avatar} />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
