import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [companies, setCompanies] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [activities, setActivities] = useState([]);

  // Função para carregar todos os dados
  const fetchData = async () => {
    if (!currentUserId) return;

    try {
      // Buscar Empresas
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', currentUserId);
      setCompanies(companiesData || []);

      // Buscar Usuários (para o admin)
      const { data: usersData } = await supabase
        .from('users')
        .select('*');
      setAppUsers(usersData || []);

      // Buscar Funcionários
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', currentUserId);
      setEmployees(employeesData || []);

      // Buscar Documentos
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', currentUserId);
      setDocuments(docsData || []);

      // Buscar Atividades
      const { data: actsData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', currentUserId)
        .order('timestamp', { ascending: false })
        .limit(10);
      setActivities(actsData || []);
      
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Configurar Realtime (Opcional, mas recomendado para SaaS)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const logActivity = async (type, description) => {
    if (!currentUserId) return;
    await supabase.from('activities').insert([{
      type,
      description,
      user_id: currentUserId,
      timestamp: new Date().toISOString()
    }]);
  };

  const addCompany = async (company) => {
    if (!currentUserId) return;
    const { error } = await supabase.from('companies').insert([{
      ...company,
      user_id: currentUserId
    }]);
    
    if (!error) {
      await logActivity('COMPANY', `Empresa ${company.name} foi cadastrada.`);
      fetchData();
    }
  }

  const updateCompany = async (company) => {
    const { error } = await supabase.from('companies').update(company).eq('id', company.id);
    if (!error) {
      await logActivity('COMPANY', `Dados da empresa ${company.name} foram atualizados.`);
      fetchData();
    }
  }

  const deleteCompany = async (id) => {
    const { data: company } = await supabase.from('companies').select('name').eq('id', id).single();
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (!error) {
      if (company) await logActivity('COMPANY', `Empresa ${company.name} foi removida.`);
      fetchData();
    }
  };

  const addUser = async (userData) => {
    const { error } = await supabase.from('users').insert([userData]);
    if (!error) fetchData();
  }

  const updateUser = async (updatedUser) => {
    const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
    if (!error) fetchData();
  }

  const deleteUser = async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) fetchData();
  }

  const addEmployee = async (employee) => {
    if (!currentUserId) return;
    const { error } = await supabase.from('employees').insert([{
      ...employee,
      user_id: currentUserId
    }]);
    
    if (!error) {
      await logActivity('HR', `Novo funcionário ${employee.name} cadastrado.`);
      fetchData();
    }
  }

  const updateEmployee = async (employee) => {
    const { error } = await supabase.from('employees').update(employee).eq('id', employee.id);
    if (!error) {
      await logActivity('HR', `Dados do funcionário ${employee.name} atualizados.`);
      fetchData();
    }
  }

  const deleteEmployee = async (id) => {
    const { data: emp } = await supabase.from('employees').select('name').eq('id', id).single();
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      if (emp) await logActivity('HR', `Funcionário ${emp.name} removido.`);
      fetchData();
    }
  }

  const addDocument = async (document) => {
    if (!currentUserId) return;
    const { error } = await supabase.from('documents').insert([{
      ...document,
      user_id: currentUserId
    }]);
    
    if (!error) {
      await logActivity('DOC', `Documento ${document.name} foi enviado.`);
      fetchData();
    }
  }

  const deleteDocument = async (id) => {
    const { data: doc } = await supabase.from('documents').select('name').eq('id', id).single();
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) {
      if (doc) await logActivity('DOC', `Documento ${doc.name} foi removido.`);
      fetchData();
    }
  }

  return (
    <DataContext.Provider value={{ 
      companies, addCompany, updateCompany, deleteCompany,
      appUsers, addUser, updateUser, deleteUser,
      employees, addEmployee, updateEmployee, deleteEmployee,
      documents, addDocument, deleteDocument,
      payrolls, activities
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
