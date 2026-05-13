import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('bv_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    return new Promise(async (resolve, reject) => {
      try {
        const usersList = await db.users.toArray();
        const foundUser = usersList.find(u => u.username === username && u.password === password);
        
        if (foundUser) {
          if (foundUser.status === 'INACTIVE') {
            reject(new Error('Usuário inativo. Contate o administrador.'));
            return;
          }
          localStorage.setItem('bv_user', JSON.stringify(foundUser));
          setUser(foundUser);
          resolve(foundUser);
        } else if (username === 'admin' && password === 'admin') {
          const userData = {
            id: '1',
            username: 'admin',
            name: 'Desenvolvedor Sistema',
            role: 'DESENVOLVEDOR',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev'
          };
          localStorage.setItem('bv_user', JSON.stringify(userData));
          setUser(userData);
          resolve(userData);
        } else if (username === 'contabil' && password === '1234') {
          const userData = {
            id: '2',
            username: 'contabil',
            name: 'Contador BV',
            role: 'CONTADOR',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=contador'
          };
          localStorage.setItem('bv_user', JSON.stringify(userData));
          setUser(userData);
          resolve(userData);
        } else {
          reject(new Error('Usuário ou senha inválidos'));
        }
      } catch (error) {
        reject(new Error('Erro ao conectar com o banco de dados'));
      }
    });
  };

  const logout = () => {
    localStorage.removeItem('bv_user');
    setUser(null);
  };

  const updateProfile = async (updatedData) => {
    const newData = { ...user, ...updatedData };
    
    // Atualiza no banco de dados Dexie se não for um usuário simulado
    if (newData.id && newData.id !== '1' && newData.id !== '2') {
      try {
        await db.users.put(newData);
      } catch (err) {
        console.error('Erro ao salvar no banco:', err);
      }
    }

    setUser(newData);
    localStorage.setItem('bv_user', JSON.stringify(newData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
