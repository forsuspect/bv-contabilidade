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
        console.log('Tentativa de login:', username);
        // Busca direta no banco por username
        const foundUser = await db.users.where('username').equals(username).first();
        
        console.log('Usuário encontrado no banco:', foundUser ? 'Sim' : 'Não');

        if (foundUser && foundUser.password === password) {
          if (foundUser.status === 'INACTIVE') {
            reject(new Error('Usuário inativo. Contate os donos ou desenvolvedores do projeto.'));
            return;
          }
          localStorage.setItem('bv_user', JSON.stringify(foundUser));
          setUser(foundUser);
          resolve(foundUser);
        } else {
          reject(new Error('Usuário ou senha errada. Entre em contato com os donos ou desenvolvedores do projeto.'));
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
