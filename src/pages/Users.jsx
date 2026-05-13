import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserX,
  User,
  X,
  AlertTriangle
} from 'lucide-react';
import styles from './Users.module.css';

const UsersPage = () => {
  const { appUsers, deleteUser, updateUser, addUser } = useData();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');


  
  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  // Form States
  const [formData, setFormData] = useState({ name: '', username: '', role: 'ANALISTA', password: '' });

  const roleWeights = {
    'DESENVOLVEDOR': 100,
    'DONO': 80,
    'SOCIO': 60,
    'ADMIN': 50,
    'CONTADOR': 40,
    'ANALISTA': 20
  };

  const currentUserWeight = roleWeights[currentUser?.role] || 0;

  const filteredUsers = appUsers.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const userWeight = roleWeights[u.role] || 0;
    const matchHierarchy = userWeight <= currentUserWeight;

    return matchSearch && matchHierarchy;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'DESENVOLVEDOR': return <span className={`${styles.badge} ${styles.badgeDev}`}>Desenvolvedor</span>;
      case 'DONO': return <span className={`${styles.badge} ${styles.badgeDono}`}>Dono</span>;
      case 'SOCIO': return <span className={`${styles.badge} ${styles.badgeSocio}`}>Sócio</span>;
      case 'ADMIN': return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
      case 'CONTADOR': return <span className={`${styles.badge} ${styles.badgeContador}`}>Contador</span>;
      case 'ANALISTA': return <span className={`${styles.badge} ${styles.badgeAnalista}`}>Analista</span>;
      default: return <span className={styles.badge}>{role || 'Usuário'}</span>;
    }
  };

  const toggleStatus = (user) => {
    const updated = { ...user, status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
    updateUser(updated);
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const executeDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      showNotification('Usuário excluído com sucesso.', 'success');
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const openUserModal = (user = null) => {
    if (user) {
      setUserToEdit(user);
      setFormData({ name: user.name, username: user.username, role: user.role, password: '' });
    } else {
      setUserToEdit(null);
      setFormData({ name: '', username: '', role: 'ANALISTA', password: '' });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (userToEdit) {
      updateUser({ ...userToEdit, ...formData });
    } else {
      // addUser doesn't exist yet, but let's simulate or it will just be a dummy
      if(addUser) {
        addUser({ ...formData, status: 'ACTIVE' });
      } else {
        toast("Função de criar usuário requer backend.", "info");
      }

    }
    setShowUserModal(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Usuários</h1>
          <p className={styles.subtitle}>Controle os acessos e permissões da equipe interna.</p>
        </div>
        <button className={styles.addBtn} onClick={() => openUserModal()}>
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </header>

      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou usuário..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Acesso</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userProfile}>
                      <div className={styles.avatar}>
                        <User size={20} />
                      </div>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{user.name}</p>
                        <p className={styles.userUsername}>@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <button 
                      className={`${styles.statusToggle} ${user.status === 'ACTIVE' ? styles.active : styles.inactive}`}
                      onClick={() => toggleStatus(user)}
                    >
                      {user.status === 'ACTIVE' ? <UserCheck size={16} /> : <UserX size={16} />}
                      {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => openUserModal(user)}><Edit2 size={16} /></button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => confirmDelete(user)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIconWarning}>
              <AlertTriangle size={32} />
            </div>
            <h3 className={styles.modalTitle}>Excluir Usuário</h3>
            <p className={styles.modalText}>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className={styles.confirmDeleteBtn} onClick={executeDelete}>Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCardForm}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{userToEdit ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowUserModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Nome Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: João Silva" />
              </div>
              <div className={styles.inputGroup}>
                <label>Nome de Usuário</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Ex: joao.silva" />
              </div>
              <div className={styles.inputGroup}>
                <label>Nível de Acesso</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="ANALISTA">Analista</option>
                  <option value="CONTADOR">Contador</option>
                  {currentUser?.role === 'DESENVOLVEDOR' && (
                    <>
                      <option value="SOCIO">Sócio</option>
                      <option value="DONO">Dono</option>
                      <option value="DESENVOLVEDOR">Desenvolvedor</option>
                    </>
                  )}
                  {currentUser?.role === 'ADMIN' && (
                    <option value="ADMIN">Administrador</option>
                  )}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>{userToEdit ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}</label>
                <input 
                  type="password" 
                  value={formData.password || ''} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  placeholder="••••••••" 
                  required={!userToEdit}
                />
              </div>
              <div className={styles.modalActionsForm}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
