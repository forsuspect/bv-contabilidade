import React from 'react';
import { useData as useAppData } from '../context/DataContext';
import { 
  Building2, 
  History, 
  Clock, 
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  DollarSign,
  CheckCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { companies = [], documents = [], activities = [], obligations = [], apurations = [] } = useAppData();
  const { user } = useAuth();

  const isManagement = ['DESENVOLVEDOR', 'DONO', 'SOCIO'].includes(user?.role);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Cálculo de Impostos do Mês
  const totalImpostosMes = apurations
    .filter(ap => ap.mes === currentMonth && ap.ano === currentYear)
    .reduce((sum, ap) => sum + (Number(ap.imposto) || 0), 0);

  // Empresas que faltam apurar este mês
  const pendentesApuracao = companies.filter(company => 
    !apurations.some(ap => ap.companyId === company.id && ap.mes === currentMonth && ap.ano === currentYear)
  );

  // Obrigações próximas (vencem nos próximos 5 dias)
  const lembretesObrigações = obligations.filter(ob => {
    const isThisMonth = ob.month === 0 || ob.month === currentMonth;
    const isSoon = ob.day >= now.getDate() && ob.day <= now.getDate() + 5;
    return isThisMonth && isSoon;
  });

  const stats = [
    { 
      label: 'Empresas Cadastradas', 
      value: companies.length, 
      icon: <Building2 />, 
      change: '+12%', 
      isPositive: true,
      color: '#3b82f6'
    },
    { 
      label: 'Impostos Apurados (Mês)', 
      value: `R$ ${totalImpostosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: <DollarSign />, 
      change: 'Calculado', 
      isPositive: true,
      color: '#10b981'
    },
    { 
      label: 'Documentos na Nuvem', 
      value: documents.length.toString(), 
      icon: <FileText />, 
      change: 'Seguro', 
      isPositive: true,
      color: '#8b5cf6'
    },
  ];

  const handleExport = () => {
    const data = stats.map(s => `${s.label}: ${s.value}`).join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resumo_dashboard_${new Date().toLocaleDateString('pt-BR')}.txt`;
    link.click();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Bem-vindo de volta! Aqui está o resumo da sua contabilidade.</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>{stat.label}</p>
              <h3 className={styles.statValue}>{stat.value}</h3>
              <div className={`${styles.statChange} ${stat.isPositive ? styles.positive : styles.negative}`}>
                {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        {/* Coluna da Esquerda: Lembretes e Atividades */}
        <div className={styles.leftCol}>
          <div className={styles.reminderCard}>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="#f59e0b" />
                <h3 className={styles.sectionTitle}>Lembretes e Pendências</h3>
              </div>
            </div>
            
            <div className={styles.reminderList}>
              {pendentesApuracao.length > 0 && (
                <div className={styles.reminderGroup}>
                  <p className={styles.groupLabel}>Apurar Faturamento (Mês Atual)</p>
                  {pendentesApuracao.slice(0, 4).map(c => (
                    <div key={c.id} className={styles.reminderItem}>
                      <div className={styles.dot} style={{ background: '#ef4444' }} />
                      <span>{c.name}</span>
                      <small>Pendente</small>
                    </div>
                  ))}
                </div>
              )}

              {lembretesObrigações.length > 0 && (
                <div className={styles.reminderGroup}>
                  <p className={styles.groupLabel}>Vencimentos Próximos</p>
                  {lembretesObrigações.map(ob => (
                    <div key={ob.id} className={styles.reminderItem}>
                      <div className={styles.dot} style={{ background: '#f59e0b' }} />
                      <span>{ob.name}</span>
                      <small>Dia {ob.day}</small>
                    </div>
                  ))}
                </div>
              )}

              {pendentesApuracao.length === 0 && lembretesObrigações.length === 0 && (
                <p className={styles.emptyText}>Tudo em dia por aqui! ✨</p>
              )}
            </div>
          </div>

          {/* Espaço reservado para futuras expansões ou widgets menores */}
        </div>

        {/* Coluna da Direita: Gráfico */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Crescimento e Fluxo</h3>
            <p className={styles.chartSubtitle}>Acompanhamento de performance</p>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={[
                { name: 'Jan', value: 400 },
                { name: 'Fev', value: 700 },
                { name: 'Mar', value: 600 },
                { name: 'Abr', value: 900 },
                { name: 'Mai', value: 1100 },
                { name: 'Jun', value: 1500 },
              ]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
