import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock
} from 'lucide-react';
import styles from './ObligationsCalendar.module.css';

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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calendário de Obrigações</h1>
        <p className={styles.subtitle}>Gestão unificada de pendências BV Contabilidade</p>
      </header>

      <div className={styles.calendarCard}>
        <div className={styles.legend}>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.paid}`} /> Pago</div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.pending}`} /> A vencer</div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.late}`} /> Em atraso</div>
        </div>

        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={() => setCurr(new Date(year, month - 1, 1))}><ChevronLeft size={20} /></button>
          <span className={styles.monthLabel}>{MONTH_NAMES[month + 1]} {year}</span>
          <button className={styles.navBtn} onClick={() => setCurr(new Date(year, month + 1, 1))}><ChevronRight size={20} /></button>
        </div>

        <div className={styles.grid}>
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => (
            <div key={i} className={styles.dayLabel}>{d}</div>
          ))}
          {cells.map((day, i) => {
            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const obs = day && dayMap[day];
            const status = obs ? getDayStatus(obs) : null;
            
            return (
              <div 
                key={i} 
                className={`${styles.cell} ${!day ? styles.empty : ''} ${isToday ? styles.today : ''}`}
              >
                {day && (
                  <>
                    <span className={styles.dayNumber}>{day}</span>
                    {status && <span className={`${styles.statusDot} ${styles[status]}`} />}
                    {obs && obs.length > 0 && (
                      <span className={styles.itemsCount}>{obs.length} {obs.length === 1 ? 'item' : 'itens'}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.upcoming}>
        <h3 className={styles.upcomingTitle}>Próximos Vencimentos</h3>
        <div className={styles.upcomingGrid}>
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
                <div key={ob.id} className={styles.upcomingCard}>
                  <div className={styles.upcomingIcon}><Clock size={20} /></div>
                  <div className={styles.upcomingInfo}>
                    <h4>{ob.name}</h4>
                    <p>{co?.name || 'Empresa'} • Dia {ob.day}</p>
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
