import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/' },
    { icon: <Building2 size={22} />, label: 'Empresas', path: '/companies' },
    { icon: <DollarSign size={22} />, label: 'Folha de Pagamento', path: '/payroll' },
    { icon: <FileText size={22} />, label: 'Documentos', path: '/documents' },
    { icon: <Users size={22} />, label: 'Usuários', path: '/users', adminOnly: true },
  ];

  const isAdmin = ['DESENVOLVEDOR', 'DONO', 'SOCIO', 'ADMIN'].includes(user?.role);
  const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          BV{!isCollapsed && <span>Contabilidade</span>}
        </div>
        <button 
          className={styles.toggleBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className={styles.nav}>
        <ul>
          {filteredItems.map((item, index) => (
            <li key={index}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className={styles.icon}>{item.icon}</span>
                {!isCollapsed && <span className={styles.label}>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={22} />
          {!isCollapsed && <span>Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
