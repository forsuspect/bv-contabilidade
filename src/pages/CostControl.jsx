import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon, 
  ArrowUpRight, ArrowDownRight, Calendar, Filter, Download
} from 'lucide-react';
import { toast } from '../utils/toast';
import styles from './Dashboard.module.css'; // Usando estilos do dashboard para manter o padrão premium

const CostControl = () => {
  const { apurations = [], companies = [] } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Dados mockados para o controle de custos (já que é uma nova aba)
  // No futuro, isso pode vir de uma tabela 'costs' no Supabase
  const mockCosts = [
    { id: 1, description: 'Honorários Contábeis', category: 'Operacional', value: 1200.00, date: '2026-05-10' },
    { id: 2, description: 'Sistema ERP', category: 'Software', value: 450.00, date: '2026-05-12' },
    { id: 3, description: 'Certificado Digital', category: 'Infraestrutura', value: 220.00, date: '2026-05-15' },
  ];

  const totalRevenue = apurations.reduce((s, a) => s + Number(a.faturamento), 0);
  const totalTaxes = apurations.reduce((s, a) => s + Number(a.imposto), 0);
  const totalOperatingCosts = mockCosts.reduce((s, c) => s + c.value, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Controle de Custos</h1>
          <p className={styles.subtitle}>Gestão financeira e análise de despesas operacionais.</p>
        </div>
        <div className={styles.quickActions}>
          <button className={styles.exportBtn} onClick={() => toast('Exportando dados...', 'info')}>
            <Download size={18} /> Exportar PDF
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.positive}`} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Receita Bruta (Histórico)</span>
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
            <span className={styles.statLabel}>Impostos Totais</span>
            <h2 className={styles.statValue}>R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.leftCol}>
          <div className={styles.chartCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Distribuição de Despesas</h3>
              <PieChartIcon size={20} className={styles.textMuted} />
            </div>
            <div className={styles.emptyText}>Gráfico de custos em processamento...</div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Últimos Lançamentos</h3>
            <button className={styles.quickBtn} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Ver todos</button>
          </div>
          <div className={styles.activityList}>
            {mockCosts.map(cost => (
              <div key={cost.id} className={styles.activityItem}>
                <div className={styles.activityAvatar} style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                  <DollarSign size={18} />
                </div>
                <div className={styles.activityInfo}>
                  <div className={styles.activityText}>
                    <strong>{cost.description}</strong> em {cost.category}
                  </div>
                  <div className={styles.activityTime}>
                    {new Date(cost.date).toLocaleDateString('pt-BR')} — <span style={{ color: '#ef4444' }}>R$ {cost.value.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostControl;
