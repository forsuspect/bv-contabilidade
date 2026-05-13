import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, User as UserIcon, Menu, X, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import styles from './Navbar.module.css';

const Navbar = ({ isSidebarCollapsed, toggleMobileMenu }) => {
  const { user } = useAuth();
  const { activities = [] } = useData();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const notifications = activities.slice(0, 5);

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
        <div className={styles.notificationWrapper}>
          <button 
            className={`${styles.notificationBtn} ${showNotifications ? styles.active : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={22} />
            {notifications.length > 0 && <span className={styles.badge}>{notifications.length}</span>}
          </button>

          {showNotifications && (
            <>
              <div className={styles.notificationOverlay} onClick={() => setShowNotifications(false)}></div>
              <div className={styles.notificationDropdown}>
                <div className={styles.dropdownHeader}>
                  <h3>Notificações</h3>
                  <button onClick={() => setShowNotifications(false)}><X size={16} /></button>
                </div>
                <div className={styles.dropdownBody}>
                  {notifications.length === 0 ? (
                    <p className={styles.emptyText}>Sem notificações no momento.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={styles.notificationItem}>
                        <div className={styles.notifIcon}>
                          <CheckCircle2 size={16} color="#3b82f6" />
                        </div>
                        <div className={styles.notifContent}>
                          <p className={styles.notifText}>{notif.description}</p>
                          <span className={styles.notifTime}>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.dropdownFooter}>
                  <Link to="/activities" onClick={() => setShowNotifications(false)}>Ver todas as atividades</Link>
                </div>
              </div>
            </>
          )}
        </div>

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
