import React from 'react';
import { useData as useAppData } from '../context/DataContext';
import { 
  Building2, 
  History, 
  Clock, 
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  User,
  History,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { companies, documents = [], activities = [] } = useAppData();
  const { user } = useAuth();

  const isManagement = ['DESENVOLVEDOR', 'DONO', 'SOCIO'].includes(user?.role);

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
      label: 'Atividades Recentes', 
      value: activities.length, 
      icon: <Clock />, 
      change: 'Novo', 
      isPositive: true,
      color: '#f59e0b'
    },
    { 
      label: 'Documentos na Nuvem', 
      value: documents.length.toString(), 
      icon: <FileText />, 
      change: '0%', 
      isPositive: true,
      color: '#8b5cf6'
    },
  ];

  const chartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Abr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const taxData = [
    { name: 'Simples', value: 45 },
    { name: 'Presumido', value: 30 },
    { name: 'Real', value: 25 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

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
        <button className={styles.exportBtn} onClick={handleExport}>
          <FileText size={18} />
          Exportar Resumo
        </button>
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
                {stat.change} <span>este mês</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid} style={{ gridTemplateColumns: '1fr' }}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Volume de Dados Processados</h3>
            <p className={styles.chartSubtitle}>Últimos 6 meses</p>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
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

      {isManagement && (
        <div className={styles.recentActivity}>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} color="var(--primary)" />
              <h3 className={styles.sectionTitle}>Atividades Recentes</h3>
            </div>
            <button className={styles.viewAll}>Ver Tudo</button>
          </div>
          <div className={styles.activityList}>
            {activities.length === 0 ? (
              <p className={styles.emptyActivity}>Nenhuma atividade registrada ainda.</p>
            ) : (
              activities.map((activity, index) => {
                let Icon = FileText;
                let color = '#8b5cf6';
                
                if (activity.type === 'COMPANY') { Icon = Building2; color = '#3b82f6'; }
                if (activity.type === 'HR') { Icon = Briefcase; color = '#10b981'; }
                if (activity.type === 'PAYROLL') { Icon = DollarSign; color = '#f59e0b'; }
                if (activity.type === 'DOC') { Icon = FileText; color = '#8b5cf6'; }

                return (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityAvatar} style={{ backgroundColor: `${color}15`, color: color }}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.activityInfo}>
                      <p className={styles.activityText}>
                        {activity.description}
                      </p>
                      <p className={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
