import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ExternalLink,
  Calculator,
  ChevronDown,
  FileText,
  X
} from 'lucide-react';
import styles from './Companies.module.css';

const Companies = () => {
  const { companies, deleteCompany, addCompany } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegime, setFilterRegime] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ name: '', fantasyName: '', cnpj: '', regime: 'SIMPLES_NACIONAL' });
  
  const maskCNPJ = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto após os dois primeiros dígitos
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto após os cinco primeiros dígitos
      .replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca barra após os oito primeiros dígitos
      .replace(/(\d{4})(\d)/, '$1-$2') // Coloca hífen após os doze primeiros dígitos
      .slice(0, 18); // Limita o tamanho final
  };

  const handleCnpjChange = (e) => {
    const masked = maskCNPJ(e.target.value);
    setFormData({ ...formData, cnpj: masked });
  };

  const safeCompanies = Array.isArray(companies) ? companies : [];
  
  const filteredCompanies = safeCompanies.filter(company => {
    if (!company) return false;
    const matchesSearch = (company.name || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (company.cnpj || '').toString().includes(searchTerm);
    const matchesRegime = filterRegime === 'ALL' || company.regime === filterRegime;
    return matchesSearch && matchesRegime;
  });

  const getRegimeLabel = (regime) => {
    switch (regime) {
      case 'SIMPLES_NACIONAL': return 'Simples Nacional';
      case 'LUCRO_PRESUMIDO': return 'Lucro Presumido';
      case 'LUCRO_REAL': return 'Lucro Real';
      default: return regime || 'Não definido';
    }
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    
    // Validação de CNPJ (deve ter 18 caracteres com a máscara)
    if (formData.cnpj.length < 18) {
      setErrorMsg('CNPJ Inválido! O número deve estar completo.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    if (addCompany) {
      addCompany({
        ...formData,
        status: 'ACTIVE',
        estimatedTax: 0
      });
    }
    setShowModal(false);
    setFormData({ name: '', fantasyName: '', cnpj: '', regime: 'SIMPLES_NACIONAL' });
  };

  const confirmDelete = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (companyToDelete) {
      deleteCompany(companyToDelete.id);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    }
  };

  const handleCalculate = (company) => {
    alert(`Iniciando cálculo de impostos para: ${company.name}\nRegime: ${getRegimeLabel(company.regime)}`);
  };

  const handleReport = (company) => {
    const data = `Relatório de Empresa\n\nNome: ${company.name}\nCNPJ: ${company.cnpj}\nRegime: ${getRegimeLabel(company.regime)}\nStatus: ${company.status}`;
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${company.name.toLowerCase().replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Empresas</h1>
          <p className={styles.subtitle}>Gerencie o portfólio de clientes da BV Contabilidade.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Cadastrar Empresa
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou CNPJ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.selectWrapper}>
          <Filter size={18} className={styles.filterIcon} />
          <select 
            value={filterRegime} 
            onChange={(e) => setFilterRegime(e.target.value)}
            className={styles.select}
          >
            <option value="ALL">Todos os Regimes</option>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </select>
          <ChevronDown size={16} className={styles.chevron} />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredCompanies.map((company) => (
          <div key={company?.id || Math.random()} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.companyInfo}>
                <div className={styles.avatar}>
                  {(company?.name || 'E').toString().charAt(0)}
                </div>
                <div>
                  <h3 className={styles.companyName}>{company?.name || 'Sem nome'}</h3>
                  <p className={styles.companyCnpj}>{company?.cnpj || 'Sem CNPJ'}</p>
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn}><Edit size={16} /></button>
                <button className={styles.iconBtn} onClick={() => confirmDelete(company)}><Trash2 size={16} /></button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span>Regime Tributário</span>
                <span className={styles.badge}>{getRegimeLabel(company?.regime)}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Status Fiscal</span>
                <span className={`${styles.status} ${company?.status === 'ACTIVE' ? styles.statusActive : styles.statusPending}`}>
                  {company?.status === 'ACTIVE' ? 'Regular' : 'Pendente'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span>Imposto Estimado</span>
                <span className={styles.value}>R$ {company?.estimatedTax ? Number(company.estimatedTax).toLocaleString('pt-BR') : '0,00'}</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.actionBtn} onClick={() => handleCalculate(company)}>
                <Calculator size={16} />
                Calcular
              </button>
              <button className={styles.secondaryBtn} onClick={() => handleReport(company)}>
                <FileText size={16} />
                Relatório
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCardForm}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cadastrar Nova Empresa</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCompany} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Razão Social</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Tech Solutions LTDA" />
              </div>
              <div className={styles.inputGroup}>
                <label>Nome Fantasia</label>
                <input required type="text" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value})} placeholder="Ex: Tech Solutions" />
              </div>
              <div className={styles.inputGroup}>
                <label>CNPJ</label>
                <input 
                  required 
                  type="text" 
                  value={formData.cnpj} 
                  onChange={handleCnpjChange} 
                  placeholder="00.000.000/0000-00" 
                  maxLength="18"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Regime Tributário</label>
                <select value={formData.regime} onChange={e => setFormData({...formData, regime: e.target.value})}>
                  <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                </select>
              </div>
              <div className={styles.modalActionsForm}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIconWarning}>
              <Trash2 size={32} />
            </div>
            <h3 className={styles.modalTitle}>Excluir Empresa</h3>
            <p className={styles.modalText}>
              Tem certeza que deseja remover <strong>{companyToDelete?.name}</strong>? Todos os dados vinculados serão perdidos.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Confirmar Exclusão</button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMsg && (
        <div className={styles.errorToast}>
          <X size={18} />
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default Companies;
