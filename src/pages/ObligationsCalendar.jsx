import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Filter,
  X,
  Building2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import styles from './ObligationsCalendar.module.css';

const MONTH_NAMES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const ObligationsCalendar = () => {
  const { obligations = [], companies = [] } = useData();
  const [curr, setCurr] = useState(new Date());
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState(null);
  
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Filter obligations based on selected company
  const filteredObligations = obligations.filter(ob => 
    filterCompany === 'ALL' || ob.companyId === filterCompany
  );

  const dayMap = {};
  filteredObligations.forEach(ob => {
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

  const selectedDayObs = selectedDay ? dayMap[selectedDay] : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calendário de Obrigações</h1>
        <p className={styles.subtitle}>Gestão interativa de pendências</p>
      </header>

      <div className={styles.calendarCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className={styles.legend}>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.paid}`} /> Pago</div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.pending}`} /> A vencer</div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.late}`} /> Em atraso</div>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
            <select 
              value={filterCompany} 
              onChange={(e) => { setFilterCompany(e.target.value); setSelectedDay(null); }}
              style={{ 
                padding: '0.5rem 1rem 0.5rem 2.5rem', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                fontSize: '0.875rem', 
                fontWeight: 600,
                color: '#1e293b',
                background: '#f8fafc',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Todas as Empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={() => { setCurr(new Date(year, month - 1, 1)); setSelectedDay(null); }}><ChevronLeft size={20} /></button>
          <span className={styles.monthLabel}>{MONTH_NAMES[month + 1]} {year}</span>
          <button className={styles.navBtn} onClick={() => { setCurr(new Date(year, month + 1, 1)); setSelectedDay(null); }}><ChevronRight size={20} /></button>
        </div>

        <div className={styles.grid}>
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => (
            <div key={i} className={styles.dayLabel}>{d}</div>
          ))}
          {cells.map((day, i) => {
            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const obs = day && dayMap[day];
            const status = obs ? getDayStatus(obs) : null;
            const isSelected = selectedDay === day;
            
            return (
              <div 
                key={i} 
                className={`${styles.cell} ${!day ? styles.empty : ''} ${isToday ? styles.today : ''} ${isSelected ? styles.selectedCell : ''}`}
                onClick={() => day && obs && setSelectedDay(day)}
                style={{ cursor: day && obs ? 'pointer' : 'default' }}
              >
                {day && (
                  <>
                    <span className={styles.dayNumber}>{day}</span>
                    {status && <span className={`${styles.statusDot} ${styles[status]}`} />}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDayObs && (
        <div style={{ marginTop: '2rem', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className={styles.upcomingTitle}>Obrigações do Dia {selectedDay}</h3>
            <button onClick={() => setSelectedDay(null)} style={{ background: '#f1f5f9', border: 'none', padding: '4px', borderRadius: '50%', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <div className={styles.upcomingGrid}>
            {selectedDayObs.map(ob => {
              const co = companies.find(c => c.id === ob.companyId);
              return (
                <div key={ob.id} className={styles.upcomingCard} style={{ borderLeft: `4px solid ${ob.status === 'PAID' ? '#10b981' : (ob.day < today.getDate() ? '#ef4444' : '#f59e0b')}` }}>
                  <div className={styles.upcomingIcon}>
                    {ob.status === 'PAID' ? <CheckCircle size={20} color="#10b981" /> : (ob.day < today.getDate() ? <AlertCircle size={20} color="#ef4444" /> : <Clock size={20} />)}
                  </div>
                  <div className={styles.upcomingInfo}>
                    <h4>{ob.name}</h4>
                    <p>{co?.name || 'Empresa'} • {ob.status === 'PAID' ? 'Pago' : 'Pendente'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!selectedDay && (
        <div className={styles.upcoming}>
          <h3 className={styles.upcomingTitle}>Próximos Vencimentos</h3>
          <div className={styles.upcomingGrid}>
            {filteredObligations
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
      )}
    </div>
  );
};

export default ObligationsCalendar;
