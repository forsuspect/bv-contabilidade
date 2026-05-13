import React, { createContext, useContext, useEffect } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Filtra os dados com base no usuário logado
  const companies = useLiveQuery(() => 
    currentUserId ? db.companies.where('userId').equals(currentUserId).toArray() : []
  , [currentUserId]) || [];

  const appUsers = useLiveQuery(() => db.users.toArray()) || [];

  const employees = useLiveQuery(() => 
    currentUserId ? db.employees.where('userId').equals(currentUserId).toArray() : []
  , [currentUserId]) || [];

  const documents = useLiveQuery(() => 
    currentUserId ? db.documents.where('userId').equals(currentUserId).toArray() : []
  , [currentUserId]) || [];

  const payrolls = useLiveQuery(() => 
    currentUserId ? db.payroll.where('userId').equals(currentUserId).toArray() : []
  , [currentUserId]) || [];

  const activities = useLiveQuery(() => 
    currentUserId ? db.activities.where('userId').equals(currentUserId).orderBy('timestamp').reverse().limit(10).toArray() : []
  , [currentUserId]) || [];

  const logActivity = async (type, description) => {
    if (!currentUserId) return;
    await db.activities.add({
      type,
      description,
      timestamp: new Date().toISOString(),
      userId: currentUserId
    });
  };

  const addCompany = async (company) => {
    if (!currentUserId) return;
    const newCompany = { 
      ...company, 
      id: Date.now().toString(), 
      lastUpdate: new Date().toISOString(),
      userId: currentUserId 
    };
    await db.companies.add(newCompany);
    await logActivity('COMPANY', `Empresa ${company.name} foi cadastrada.`);
  }

  const updateCompany = async (company) => {
    await db.companies.update(company.id, { ...company, lastUpdate: new Date().toISOString() });
    await logActivity('COMPANY', `Dados da empresa ${company.name} foram atualizados.`);
  }

  const deleteCompany = async (id) => {
    const company = await db.companies.get(id);
    await db.companies.delete(id);
    if (company) await logActivity('COMPANY', `Empresa ${company.name} foi removida.`);
  };

  const addUser = async (user) => {
    const newUser = { ...user, id: Date.now().toString() };
    await db.users.add(newUser);
  }

  const updateUser = async (updatedUser) => {
    await db.users.put(updatedUser);
  }

  const deleteUser = async (id) => {
    await db.users.delete(id);
  }

  const addEmployee = async (employee) => {
    if (!currentUserId) return;
    const newEmployee = { ...employee, id: Date.now().toString(), userId: currentUserId };
    await db.employees.add(newEmployee);
    await logActivity('HR', `Novo funcionário ${employee.name} cadastrado.`);
  }

  const addDocument = async (document) => {
    if (!currentUserId) return;
    const newDoc = { ...document, id: Date.now().toString(), uploadDate: new Date().toISOString(), userId: currentUserId };
    await db.documents.add(newDoc);
    await logActivity('DOC', `Documento ${document.name} foi enviado.`);
  }

  const deleteDocument = async (id) => {
    const doc = await db.documents.get(id);
    await db.documents.delete(id);
    if (doc) await logActivity('DOC', `Documento ${doc.name} foi removido.`);
  }

  const addPayroll = async (payroll) => {
    if (!currentUserId) return;
    const newPayroll = { ...payroll, id: Date.now().toString(), userId: currentUserId };
    await db.payroll.add(newPayroll);
    await logActivity('PAYROLL', `Folha de pagamento da ${payroll.companyName} registrada.`);
  }

  const updatePayrollStatus = async (id, status) => {
    const p = await db.payroll.get(id);
    await db.payroll.update(id, { status });
    if (p) await logActivity('PAYROLL', `Status da folha ${p.companyName} alterado para ${status}.`);
  }

  return (
    <DataContext.Provider value={{ 
      companies, addCompany, updateCompany, deleteCompany,
      appUsers, addUser, updateUser, deleteUser,
      employees, addEmployee,
      documents, addDocument, deleteDocument,
      payrolls, addPayroll, updatePayrollStatus,
      activities
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
