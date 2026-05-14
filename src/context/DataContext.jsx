import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { toast } from '../utils/toast';



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
  const [obligations, setObligations] = useState([]);
  const [apurations, setApurations] = useState([]);
  const [costs, setCosts] = useState([]);

  // Função auxiliar para converter camelCase para snake_case (Supabase padrão)
  const toSnakeCase = (obj) => {
    const newObj = {};
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
    return newObj;
  };

  // Função auxiliar para converter snake_case para camelCase
  const fromSnakeCase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const newObj = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
      newObj[camelKey] = obj[key];
    }
    return newObj;
  };

  // Função para carregar todos os dados
  const fetchData = async () => {
    if (!currentUserId) return;

    try {
      // Buscar Empresas
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', currentUserId);
      setCompanies(companiesData?.map(fromSnakeCase) || []);

      // Buscar Obrigações
      const { data: oblsData } = await supabase
        .from('obligations')
        .select('*')
        .eq('user_id', currentUserId);
      setObligations(oblsData?.map(fromSnakeCase) || []);

      // Buscar Apurações
      const { data: apurData } = await supabase
        .from('fiscal_apurations')
        .select('*')
        .eq('user_id', currentUserId);
      setApurations(apurData?.map(fromSnakeCase) || []);

      // Buscar Usuários (para o admin)
      const { data: usersData } = await supabase
        .from('users')
        .select('*');
      setAppUsers(usersData?.map(fromSnakeCase) || []);

      // Buscar Funcionários
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', currentUserId);
      setEmployees(employeesData?.map(fromSnakeCase) || []);

      // Buscar Documentos
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', currentUserId);
      setDocuments(docsData?.map(fromSnakeCase) || []);

      // Buscar Atividades
      const { data: actsData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', currentUserId)
        .order('timestamp', { ascending: false })
        .limit(10);
      setActivities(actsData?.map(fromSnakeCase) || []);

      // Buscar Folhas de Pagamento
      const { data: payrollsData } = await supabase
        .from('payrolls')
        .select('*')
        .eq('user_id', currentUserId);
      setPayrolls(payrollsData?.map(fromSnakeCase) || []);

      // Buscar Custos
      const { data: costsData } = await supabase
        .from('costs')
        .select('*')
        .eq('user_id', currentUserId);
      setCosts(costsData?.map(fromSnakeCase) || []);

      
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Configurar Realtime
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

  // Obrigações
  const addObligation = async (ob) => {
    if (!currentUserId) return;
    const { error } = await supabase.from('obligations').insert([{ ...toSnakeCase(ob), user_id: currentUserId }]);
    if (error) toast('Erro ao salvar obrigação', 'error');
    else fetchData();
  };

  const deleteObligation = async (id) => {
    const { error } = await supabase.from('obligations').delete().eq('id', id);
    if (!error) fetchData();
  };

  // Apurações
  const addApuracao = async (ap) => {
    if (!currentUserId) return;
    const { companyName, ...rest } = ap;
    const { error } = await supabase.from('fiscal_apurations').insert([{ 
      ...toSnakeCase(rest), 
      user_id: currentUserId 
    }]);
    
    if (error) {
      console.error('Erro Supabase:', error);
      toast('Erro ao salvar apuração: ' + error.message, 'error');
    } else {
      await logActivity('FISCAL', `Nova apuração confirmada para ${companyName || 'empresa'}.`);
      fetchData();
    }
  };

  const addCompany = async (company) => {
    if (!currentUserId) return;
    
    const dataToSave = {
      name: company.name,
      fantasy_name: company.fantasyName,
      cnpj: company.cnpj,
      regime: company.regime,
      email: company.email,
      phone: company.phone,
      uf: company.uf,
      city: company.city,
      state_registration: company.stateRegistration,
      status: company.status || 'ACTIVE',
      estimated_tax: company.estimatedTax || 0,
      user_id: currentUserId
    };

    const { error } = await supabase.from('companies').insert([dataToSave]);
    
    if (error) {
      console.error('Erro ao adicionar empresa:', error);
      toast('Erro ao cadastrar empresa: ' + error.message, 'error');
    } else {
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
    if (error) {
      console.error('Erro ao excluir usuário:', error);
      toast('Erro ao excluir usuário: ' + error.message, 'error');
    } else {
      fetchData();
    }
  }


  const addEmployee = async (employee) => {
    if (!currentUserId) return;
    
    const dataToSave = {
      name: employee.name,
      cpf: employee.cpf,
      company_id: employee.companyId,
      role: employee.role,
      salary: employee.salary,
      status: employee.status || 'Ativo',
      user_id: currentUserId
    };

    const { error } = await supabase.from('employees').insert([dataToSave]);
    
    if (error) {
      console.error('Erro ao adicionar funcionário:', error);
      toast('Erro ao cadastrar funcionário: ' + error.message, 'error');
    } else {
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
    
    const dataToSave = {
      name: document.name,
      company_id: document.companyId,
      category: document.category,
      type: document.type,
      size: document.size,
      date: document.date,
      file_data: document.fileData,
      user_id: currentUserId
    };

    const { error } = await supabase.from('documents').insert([dataToSave]);
    
    if (error) {
      console.error('Erro ao adicionar documento:', error);
      if (error.message.includes('file_data')) {
        const { file_data, ...noFileData } = dataToSave;
        const { error: error2 } = await supabase.from('documents').insert([noFileData]);
        if (!error2) {
          await logActivity('DOC', `Documento ${document.name} enviado (sem arquivo).`);
          fetchData();
          return;
        }
      }
      toast('Erro ao enviar documento: ' + error.message, 'error');
    } else {
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

  const addPayroll = async (payroll) => {
    if (!currentUserId) return;
    const dataToSave = {
      company_id: payroll.companyId,
      company_name: payroll.companyName,
      month: payroll.month,
      status: payroll.status,
      total_value: payroll.totalValue,
      user_id: currentUserId
    };

    const { error } = await supabase.from('payrolls').insert([dataToSave]);
    if (error) {
      console.error('Erro ao adicionar folha:', error);
      toast('Erro ao salvar folha de pagamento: ' + error.message, 'error');
    } else {
      await logActivity('PAYROLL', `Folha de pagamento da empresa ${payroll.companyName} registrada.`);
      fetchData();
    }
  }

  const updatePayrollStatus = async (id, newStatus) => {
    const { error } = await supabase.from('payrolls').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
    else toast('Erro ao atualizar status: ' + error.message, 'error');
  }

  // Custos
  const addCost = async (cost) => {
    if (!currentUserId) return;
    const targetUserId = cost.userId || currentUserId;
    const { userId, ...cleanCost } = cost;
    const { error } = await supabase.from('costs').insert([{ ...toSnakeCase(cleanCost), user_id: targetUserId }]);
    if (error) {
      console.error('Erro ao adicionar custo:', error);
      toast('Erro ao salvar custo.', 'error');
    } else {
      await logActivity('FINANCE', `Novo custo registrado: ${cost.description}.`);
      fetchData();
    }
  };

  const deleteCost = async (id) => {
    const { error } = await supabase.from('costs').delete().eq('id', id);
    if (!error) {
      await logActivity('FINANCE', `Um registro de custo foi removido.`);
      fetchData();
    }
  };



  return (
    <DataContext.Provider value={{ 
      companies, addCompany, updateCompany, deleteCompany,
      appUsers, addUser, updateUser, deleteUser,
      employees, addEmployee, updateEmployee, deleteEmployee,
      documents, addDocument, deleteDocument,
      payrolls, addPayroll, updatePayrollStatus,
      activities,
      obligations, addObligation, deleteObligation,
      apurations, addApuracao,
      costs, addCost, deleteCost
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
