import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './NotificationCard.module.css';

const NotificationCard = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      case 'info': return <Info size={20} />;
      default: return <Info size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`${styles.notification} ${styles[type]}`}
    >
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default NotificationCard;


