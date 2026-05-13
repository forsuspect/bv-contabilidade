import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Plus, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Building2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import styles from './Payroll.module.css';

const Payroll = () => {
  const { companies, payrolls, addPayroll, updatePayrollStatus } = useData();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    companyId: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    status: 'PENDENTE',
    totalValue: ''
  });

  const handleAddPayroll = (e) => {
    e.preventDefault();
    const company = companies.find(c => c.id === formData.companyId);
    if (!company) return;

    addPayroll({
      ...formData,
      companyName: company.name,
      totalValue: parseFloat(formData.totalValue) || 0
    });
    setShowModal(false);
    setFormData({
      companyId: '',
      month: new Date().toISOString().slice(0, 7),
      status: 'PENDENTE',
      totalValue: ''
    });
  };

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'PENDENTE' ? 'APROVADO' : 'PENDENTE';
    updatePayrollStatus(id, newStatus);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Folha de Pagamento</h1>
          <p className={styles.subtitle}>Gerencie os pagamentos e verifique pendências por empresa.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Nova Folha
        </button>
      </header>

      <div className={styles.tableCard}>
        {payrolls.length === 0 ? (
          <div className={styles.emptyState}>
            <DollarSign size={48} className={styles.emptyIcon} />
            <p>Nenhuma folha de pagamento registrada ainda.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Mês/Ano</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} color="var(--primary)" />
                      {p.companyName}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} color="var(--text-muted)" />
                      {p.month}
                    </div>
                  </td>
                  <td>R$ {p.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${p.status === 'APROVADO' ? styles.approved : styles.pending}`}>
                      {p.status === 'APROVADO' ? <CheckCircle size={12} style={{marginRight: '4px'}} /> : <Clock size={12} style={{marginRight: '4px'}} />}
                      {p.status === 'APROVADO' ? 'PAGAMENTO APROVADO' : 'PENDENTE'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => toggleStatus(p.id, p.status)}
                    >
                      Mudar para {p.status === 'PENDENTE' ? 'Aprovado' : 'Pendente'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Registrar Nova Folha</h2>
            <form onSubmit={handleAddPayroll}>
              <div className={styles.formGroup}>
                <label>Empresa</label>
                <select 
                  required 
                  value={formData.companyId}
                  onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Mês de Referência</label>
                <input 
                  type="month" 
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Valor Total da Folha (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={formData.totalValue}
                  onChange={(e) => setFormData({...formData, totalValue: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Status Inicial</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="APROVADO">Aprovado</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
