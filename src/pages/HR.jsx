import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Users, DollarSign, FileText, Plus, Search, Filter, MoreVertical, Download, X } from 'lucide-react';
import styles from './HR.module.css';

const HR = () => {
  const { employees, addEmployee, companies } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', companyId: '', role: '', salary: '' });

  const safeEmployees = Array.isArray(employees) ? employees : [];

  const handleSaveEmployee = (e) => {
    e.preventDefault();
    if (addEmployee) {
      addEmployee({
        ...formData,
        status: 'Ativo'
      });
    }
    setShowModal(false);
    setFormData({ name: '', companyId: '', role: '', salary: '' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recursos Humanos & Folha de Pagamento</h1>
          <p className={styles.subtitle}>Gerencie os funcionários e a folha das empresas clientes.</p>
        </div>
        <button className={styles.addButton} onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Novo Funcionário</span>
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <Users size={24} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <h3>Total de Funcionários</h3>
            <p className={styles.statValue}>{safeEmployees.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <DollarSign size={24} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <h3>Folha Processada (Mês)</h3>
            <p className={styles.statValue}>R$ 0,00</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <FileText size={24} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <h3>Recibos Pendentes</h3>
            <p className={styles.statValue}>0</p>
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableControls}>
          <div className={styles.searchBar}>
            <Search size={20} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF ou cargo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <button className={styles.iconButton}>
              <Filter size={20} />
            </button>
            <button className={styles.iconButton}>
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th>Salário Base</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {safeEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                      <Users size={48} className={styles.emptyIcon} />
                      <p>Nenhum funcionário cadastrado no sistema.</p>
                      <button className={styles.emptyStateBtn} onClick={() => setShowModal(true)}>Cadastrar o primeiro</button>
                    </div>
                  </td>
                </tr>
              ) : (
                safeEmployees.map((emp) => {
                  const company = companies?.find(c => c.id === emp.companyId);
                  return (
                    <tr key={emp.id}>
                      <td data-label="Funcionário">{emp.name}</td>
                      <td data-label="Empresa">{company ? company.name : 'N/A'}</td>
                      <td data-label="Cargo">{emp.role}</td>
                      <td data-label="Salário">R$ {Number(emp.salary).toLocaleString('pt-BR')}</td>
                      <td data-label="Status">{emp.status}</td>
                      <td>
                        <button className={styles.moreBtn}><MoreVertical size={20} /></button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCardForm}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cadastrar Novo Funcionário</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEmployee} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Nome Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Carlos Oliveira" />
              </div>
              <div className={styles.inputGroup}>
                <label>Empresa Vinculada</label>
                <select required value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})}>
                  <option value="">Selecione a empresa</option>
                  {companies?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Cargo</label>
                <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Ex: Assistente Administrativo" />
              </div>
              <div className={styles.inputGroup}>
                <label>Salário Base (R$)</label>
                <input required type="number" step="0.01" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="Ex: 2500.00" />
              </div>
              <div className={styles.modalActionsForm}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HR;
