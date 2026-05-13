import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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

  const login = async (username, password) => {
    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', cleanUsername)
        .single();

      if (error || !data) {
        throw new Error('Atenção: Usuário ou senha incorretos. Caso precise de um novo acesso ou tenha esquecido suas credenciais, entre em contato com os proprietários da plataforma ou com os desenvolvedores.');
      }

      if (data.password === cleanPassword) {
        if (data.status === 'INACTIVE') {
          throw new Error('Acesso Bloqueado: Este usuário está inativo. Por favor, entre em contato com os proprietários ou com o suporte técnico para reativar sua conta.');
        }

        localStorage.setItem('bv_user', JSON.stringify(data));
        setUser(data);
        return data;
      } else {
        throw new Error('Atenção: Usuário ou senha incorretos.');
      }
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('bv_user');
    setUser(null);
  };

  const updateProfile = async (updatedData) => {
    const newData = { ...user, ...updatedData };
    
    try {
      const { error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', user.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
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
