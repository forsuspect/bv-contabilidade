import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import styles from './Companies.module.css'; // Reusing some styles

const MONTH_NAMES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const ObligationsCalendar = () => {
  const { obligations = [], companies = [] } = useData();
  const [curr, setCurr] = useState(new Date());
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const dayMap = {};
  obligations.forEach(ob => {
    const d = Number(ob.day);
    // If it's a monthly obligation or matches the current month
    if (ob.month === 0 || ob.month === month + 1) {
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(ob);
    }
  });

  const getDayStatus = (obs) => {
    if (obs.every(o => o.status === 'PAID')) return 'paid';
    if (obs.some(o => {
      const isPast = o.day < today.getDate() && (o.month === 0 || o.month === today.getMonth() + 1);
      return o.status !== 'PAID' && isPast;
    })) return 'late';
    return 'pending';
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b' }}>Calendário de Obrigações</h1>
        <p style={{ color: '#64748b' }}>Visão geral de todas as pendências fiscais e trabalhistas</p>
      </header>

      <div className={styles.calendarFullWidth} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <div className={styles.calendarHeader} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.calendarLegend}>
              <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.paid}`} /> Pago</div>
              <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.pending}`} /> A vencer</div>
              <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.late}`} /> Em atraso</div>
            </div>
          </div>

          <div className={styles.calendarNav} style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
            <button className={styles.navBtn} onClick={() => setCurr(new Date(year, month - 1, 1))}><ChevronLeft size={20} /></button>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{MONTH_NAMES[month + 1]} {year}</span>
            <button className={styles.navBtn} onClick={() => setCurr(new Date(year, month + 1, 1))}><ChevronRight size={20} /></button>
          </div>

          <div className={styles.calendarGrid} style={{ gap: '12px' }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => (
              <div key={i} className={styles.calDayLabel} style={{ fontSize: '0.875rem', paddingBottom: '1rem' }}>{d}</div>
            ))}
            {cells.map((day, i) => {
              const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const obs = day && dayMap[day];
              const status = obs ? getDayStatus(obs) : null;
              
              return (
                <div 
                  key={i} 
                  className={`${styles.calCell} ${!day ? styles.calEmpty : ''} ${isToday ? styles.calToday : ''}`}
                  style={{ 
                    height: '80px', 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9',
                    background: day ? 'white' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    padding: '8px'
                  }}
                >
                  {day && (
                    <>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isToday ? '#2563eb' : '#64748b' }}>{day}</span>
                      {status && (
                        <div style={{ marginTop: 'auto', marginBottom: '8px' }}>
                          <span className={`${styles.statusDot} ${styles[status]}`} style={{ width: '12px', height: '12px' }} />
                        </div>
                      )}
                      {obs && obs.length > 0 && (
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                          {obs.length} {obs.length === 1 ? 'item' : 'itens'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Próximos Vencimentos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {obligations
            .filter(ob => {
              const d = Number(ob.day);
              return (ob.month === 0 || ob.month === month + 1) && d >= today.getDate() && ob.status !== 'PAID';
            })
            .sort((a, b) => a.day - b.day)
            .slice(0, 6)
            .map(ob => {
              const co = companies.find(c => c.id === ob.companyId);
              return (
                <div key={ob.id} style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem', borderRadius: '8px' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{ob.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{co?.name} • Dia {ob.day}</div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
};

export default ObligationsCalendar;
