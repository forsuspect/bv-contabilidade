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
        <p className={styles.subtitle}>Gestão unificada de pendências</p>
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
              className={styles.companySelect}
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
            
            return (
              <div 
                key={i} 
                className={`${styles.cell} ${!day ? styles.empty : ''} ${isToday ? styles.today : ''}`}
                onClick={() => day && setSelectedDay(day)}
                style={{ cursor: day ? 'pointer' : 'default' }}
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

      {/* Modal de Detalhes do Dia */}
      {selectedDay && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDay(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Dia {selectedDay} de {MONTH_NAMES[month + 1]}</h3>
                <p className={styles.modalSubtitle}>
                  {selectedDayObs ? `${selectedDayObs.length} pendência(s) encontrada(s)` : 'Sem pendências registradas'}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedDay(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              {selectedDayObs && selectedDayObs.length > 0 ? (
                selectedDayObs.map(ob => {
                  const co = companies.find(c => c.id === ob.companyId);
                  const isLate = ob.day < today.getDate() && (ob.month === 0 || ob.month === today.getMonth() + 1);
                  return (
                    <div key={ob.id} className={styles.detailCard}>
                      <div className={`${styles.statusIndicator} ${ob.status === 'PAID' ? styles.bgPaid : (isLate ? styles.bgLate : styles.bgPending)}`}>
                        {ob.status === 'PAID' ? <CheckCircle size={18} /> : (isLate ? <AlertCircle size={18} /> : <Clock size={18} />)}
                      </div>
                      <div className={styles.detailInfo}>
                        <div className={styles.detailName}>{ob.name}</div>
                        <div className={styles.detailCompany}><Building2 size={12} /> {co?.name || 'Empresa'}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#ecfdf5', color: '#10b981', padding: '1rem', borderRadius: '50%' }}>
                    <CheckCircle size={32} />
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>Tudo limpo por aqui!</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Nenhuma obrigação agendada para este dia.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.upcoming}>
        <h3 className={styles.upcomingTitle}>Resumo de Vencimentos</h3>
        <div className={styles.upcomingGrid}>
          {filteredObligations
            .filter(ob => {
              const d = Number(ob.day);
              return (ob.month === 0 || ob.month === month + 1) && d >= today.getDate() && ob.status !== 'PAID';
            })
            .sort((a, b) => a.day - b.day)
            .slice(0, 3)
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
