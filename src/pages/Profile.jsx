import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, User, Mail, Lock, CheckCircle, Upload, LogOut } from 'lucide-react';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    role: user?.role || '',
    password: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current.click();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (updateProfile) {
      const updatedData = {
        name: formData.name,
        username: formData.username,
        avatar: avatarPreview
      };
      if (formData.password) {
        updatedData.password = formData.password;
      }
      
      updateProfile(updatedData);
      setSuccessMsg('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setFormData(prev => ({ ...prev, password: '' })); // Limpa campo de senha
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Meu Perfil</h1>
        <p className={styles.subtitle}>Gerencie suas informações pessoais e foto de perfil.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <img 
                src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=random`} 
                alt="Avatar" 
                className={styles.avatar} 
              />
              <button 
                type="button"
                className={styles.cameraBtn}
                onClick={handleTriggerUpload}
                title="Alterar foto"
              >
                <Camera size={18} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className={styles.hiddenInput} 
              accept="image/*"
              onChange={handleFileChange}
            />
            <h2 className={styles.userName}>{formData.name}</h2>
            <span className={styles.userRole}>{formData.role}</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {successMsg && (
              <div className={styles.successAlert}>
                <CheckCircle size={20} />
                <span>{successMsg}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Nome Completo</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Nome de Usuário (Login)</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Nome de usuário para login"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Nova Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Deixe em branco para manter a atual"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn}>
                Salvar Alterações
              </button>
              <button type="button" className={styles.logoutBtnMobile} onClick={logout}>
                <LogOut size={18} />
                Sair da Conta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
