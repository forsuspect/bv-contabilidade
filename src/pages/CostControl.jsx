import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon, 
  ArrowUpRight, ArrowDownRight, Calendar, Filter, Download,
  Plus, Trash2, X
} from 'lucide-react';
import { toast } from '../utils/toast';
import styles from './Dashboard.module.css'; // Usando estilos do dashboard para manter o padrão premium

import { useAuth } from '../context/AuthContext';

const CostControl = () => {
  const { user: currentUser } = useAuth();
  const { costs = [], addCost, deleteCost, apurations = [], appUsers = [] } = useData();
  
  const isAdmin = ['DESENVOLVEDOR', 'DONO', 'SOCIO', 'ADMIN'].includes(currentUser?.role);
  const externalClients = appUsers.filter(u => u.role === 'CLIENTE_EXTERNO');
  
  const [targetUserId, setTargetUserId] = useState(currentUser?.id);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ description: '', category: 'Operacional', value: '', date: new Date().toISOString().split('T')[0] });

  // Se o usuário logado mudar ou for admin, garantir que temos um target
  // Mas vamos deixar o admin escolher. Se for cliente, trava no ID dele.
  const effectiveUserId = isAdmin ? targetUserId : currentUser?.id;

  // Filtrar dados pelo usuário selecionado e mês/ano
  const currentYear = new Date().getFullYear();
  const filteredApurations = apurations.filter(a => 
    a.userId === effectiveUserId && 
    Number(a.mes) === Number(selectedMonth) && 
    Number(a.ano) === currentYear
  );
  const filteredCosts = costs.filter(c => 
    c.userId === effectiveUserId && 
    new Date(c.date).getMonth() + 1 === Number(selectedMonth)
  );

  const totalRevenue = filteredApurations.reduce((s, a) => s + Number(a.faturamento), 0);
  const totalTaxes = filteredApurations.reduce((s, a) => s + Number(a.imposto), 0);
  const totalOperatingCosts = filteredCosts.reduce((s, c) => s + Number(c.value), 0);

  const handleAddCost = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.value) { toast('Preencha os campos obrigatórios.', 'error'); return; }
    addCost({
      ...formData,
      userId: effectiveUserId,
      value: parseFloat(formData.value.toString().replace(',', '.'))
    });
    setFormData({ description: '', category: 'Operacional', value: '', date: new Date().toISOString().split('T')[0] });
    setShowAddForm(false);
    toast('Custo registrado!', 'success');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Controle de Custos</h1>
          {isAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Gerenciando cliente:</span>
              <select 
                className={styles.monthSelect} 
                value={targetUserId} 
                onChange={e => setTargetUserId(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', fontWeight: 600, border: '2px solid #111827', color: '#111827' }}
              >
                <option value={currentUser?.id}>Meu Próprio Controle</option>
                {externalClients.map(u => (
                  <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                ))}
              </select>
            </div>
          ) : (
            <p className={styles.subtitle}>Gestão financeira e análise de despesas operacionais.</p>
          )}
        </div>
        <div className={styles.quickActions}>
          <select className={styles.monthSelect} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginRight: '1rem' }}>
            {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <button className={styles.addBtn} onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.positive}`} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Receita do Mês</span>
            <h2 className={styles.statValue}>R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.negative}`} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <TrendingDown size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Custos Operacionais</span>
            <h2 className={styles.statValue}>R$ {totalOperatingCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Impostos do Mês</span>
            <h2 className={styles.statValue}>R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.leftCol}>
          <div className={styles.chartCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Balanço Mensal</h3>
              <PieChartIcon size={20} className={styles.textMuted} />
            </div>
            <div className={styles.balanceInfo} style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Lucro Bruto Estimado</span>
                <strong style={{ color: totalRevenue - totalOperatingCosts - totalTaxes >= 0 ? '#10b981' : '#ef4444' }}>
                  R$ {(totalRevenue - totalOperatingCosts - totalTaxes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className={styles.progressBar} style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (totalRevenue > 0 ? (totalRevenue - totalOperatingCosts - totalTaxes) / totalRevenue * 100 : 0))}%`, background: '#3b82f6' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Histórico de Custos</h3>
            <span className={styles.textMuted}>{filteredCosts.length} lançamentos</span>
          </div>
          <div className={styles.activityList}>
            {filteredCosts.length === 0 ? (
              <div className={styles.emptyText}>Nenhum custo registrado para este mês.</div>
            ) : (
              filteredCosts.map(cost => (
                <div key={cost.id} className={styles.activityItem}>
                  <div className={styles.activityAvatar} style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    <DollarSign size={18} />
                  </div>
                  <div className={styles.activityInfo}>
                    <div className={styles.activityText}>
                      <strong>{cost.description}</strong> — {cost.category}
                    </div>
                    <div className={styles.activityTime}>
                      {new Date(cost.date).toLocaleDateString('pt-BR')} — <span style={{ color: '#ef4444' }}>R$ {Number(cost.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteCost(cost.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className={styles.modalOverlay} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Novo Lançamento</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Descrição</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Aluguel, Sistema..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Valor (R$)</label>
                  <input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="0,00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Categoria</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <option>Operacional</option>
                    <option>Software</option>
                    <option>Infraestrutura</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Data</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <button type="submit" className={styles.addBtn} style={{ width: '100%', marginTop: '1rem' }}>Salvar Lançamento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostControl;
