import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { toast } from '../utils/toast';
import { 
  Plus, Search, Filter, Edit, Trash2, ChevronDown,
  FileText, X, Calendar, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, Building2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './Companies.module.css';

// ─── Constantes Globais ───────────────────────────────────────────────────────
const MONTH_NAMES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DEFAULT_FISCAL = { SIMPLES_NACIONAL: [], LUCRO_PRESUMIDO: [], LUCRO_REAL: [] };
const DEFAULT_LABOR = [];
const TAX_RATES = { SIMPLES_NACIONAL: 6, LUCRO_PRESUMIDO: 11.33, LUCRO_REAL: 15 };

// ─── Componentes Auxiliares ───────────────────────────────────────────────────

const MiniCalendar = ({ obligations }) => {
  const [curr, setCurr] = useState(new Date());
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const dayMap = {};
  obligations.forEach(ob => {
    const d = Number(ob.day);
    if (!dayMap[d]) dayMap[d] = [];
    dayMap[d].push(ob);
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
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <h4 className={styles.calendarTitle}>Calendário de Pendências</h4>
        <div className={styles.calendarLegend}>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.paid}`} /> Pago</div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.pending}`} /> A vencer</div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.late}`} /> Em atraso</div>
        </div>
      </div>

      <div className={styles.calendarNav}>
        <button className={styles.navBtn} onClick={() => setCurr(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
        <span className={styles.currentMonth}>{MONTH_NAMES[month + 1]} {year}</span>
        <button className={styles.navBtn} onClick={() => setCurr(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
      </div>

      <div className={styles.calendarGrid}>
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => <div key={i} className={styles.calDayLabel}>{d}</div>)}
        {cells.map((day, i) => {
          const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const obs = day && dayMap[day];
          const status = obs ? getDayStatus(obs) : null;
          
          return (
            <div key={i} className={`${styles.calCell} ${!day ? styles.calEmpty : ''} ${isToday ? styles.calToday : ''}`}>
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
  );
};

const ObligationsPanel = ({ company, onClose }) => {
  const { obligations: allDbObligations, addObligation, deleteObligation, toggleObligationStatus, apurations: allDbApurations, addApuracao } = useData();
  const [activeTab, setActiveTab] = useState('calendario');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', day: '', month: '0' });
  const [apuracaoForm, setApuracaoForm] = useState({ faturamento: '', imposto: '', mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  const regime = company.regime || 'SIMPLES_NACIONAL';
  const taxRate = TAX_RATES[regime] || 6;
  const companyCustomObs = allDbObligations.filter(ob => ob.companyId === company.id);
  const companyApurations = allDbApurations.filter(ap => ap.companyId === company.id).sort((a, b) => b.ano - a.ano || b.mes - a.mes);

  const handleFaturamentoChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = Number(raw) / 100;
    setApuracaoForm(p => ({ 
      ...p, 
      faturamento: val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      imposto: (val * taxRate / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    }));
  };

  const confirmarApuracao = () => {
    if (!apuracaoForm.faturamento) { toast('Informe o faturamento.', 'error'); return; }
    addApuracao({
      companyId: company.id,
      companyName: company.name,
      faturamento: parseFloat(apuracaoForm.faturamento.replace(/\./g, '').replace(',', '.')),
      imposto: parseFloat(apuracaoForm.imposto.replace(/\./g, '').replace(',', '.')),
      mes: apuracaoForm.mes,
      ano: apuracaoForm.ano
    });
    setApuracaoForm({ faturamento: '', imposto: '', mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
    toast('Apuração confirmada!', 'success');
  };

  const tabCustomObs = companyCustomObs.filter(ob => ob.type === activeTab || (activeTab === 'calendario' && (ob.type === 'fiscal' || ob.type === 'labor')));
  const defaultList = (activeTab === 'fiscal' || activeTab === 'calendario') ? (DEFAULT_FISCAL[regime] || []) : (activeTab === 'labor' ? DEFAULT_LABOR : []);
  const allObs = [...defaultList, ...tabCustomObs];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.obligationsModal}>
        <div className={styles.obligationsHeader}>
          <div className={styles.obligationsTitle}><Building2 size={18} /><h3>{company.name}</h3></div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.obligationsTabs}>
          {['calendario', 'fiscal', 'labor', 'apuracao'].map(tab => (
            <button key={tab} className={`${styles.obTab} ${activeTab === tab ? styles.obTabActive : ''}`} onClick={() => { setActiveTab(tab); setShowAddForm(false); }}>
              {tab === 'calendario' && <Calendar size={15} />}
              {tab === 'fiscal' && <FileText size={15} />}
              {tab === 'labor' && <AlertTriangle size={15} />}
              {tab === 'apuracao' && <CheckCircle size={15} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.obligationsBody}>
          {activeTab === 'calendario' && (
            <div className={styles.calendarFullWidth}><MiniCalendar obligations={allObs} /></div>
          )}

          {(activeTab === 'fiscal' || activeTab === 'labor') && (
            <div className={styles.obligationsFullList}>
              <div className={styles.obListHeader}>
                <h4>{activeTab === 'fiscal' ? 'Obrigações Fiscais' : 'Obrigações Trabalhistas'}</h4>
                <button className={styles.addObBtn} onClick={() => setShowAddForm(!showAddForm)}><Plus size={14} /> Adicionar</button>
              </div>
              {showAddForm && (
                <form className={styles.addObForm} onSubmit={(e) => {
                  e.preventDefault();
                  addObligation({ companyId: company.id, name: addForm.name, day: Number(addForm.day), month: Number(addForm.month), type: activeTab });
                  setAddForm({ name: '', day: '', month: '0' }); setShowAddForm(false); toast('Adicionado!', 'success');
                }}>
                  <input className={styles.obInput} placeholder="Nome da Obrigação" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} required />
                  <div className={styles.addObRow}>
                    <input className={styles.obInput} type="number" placeholder="Dia" value={addForm.day} onChange={e => setAddForm({...addForm, day: e.target.value})} required />
                    <select className={styles.obInput} value={addForm.month} onChange={e => setAddForm({...addForm, month: e.target.value})}>
                      <option value="0">Mensal</option>
                      {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <button type="submit" className={styles.saveBtn}>Salvar Obrigação</button>
                </form>
              )}
              <ul className={styles.obList}>
                {allObs.map((ob, i) => (
                  <li key={i} className={styles.obItem}>
                    <button className={`${styles.obCheck} ${ob.status === 'PAID' ? styles.obCheckPaid : ''}`} onClick={() => ob.id && toggleObligationStatus(ob.id, ob.status)}>
                      {ob.status === 'PAID' ? <CheckCircle size={16} /> : <div className={styles.checkCircle} />}
                    </button>
                    <div className={styles.obInfo}>
                      <span className={ob.status === 'PAID' ? styles.strike : ''}>{ob.name}</span>
                      <small>Vencimento: Dia {ob.day}{ob.month > 0 ? ` de ${MONTH_NAMES[ob.month]}` : ' (Todo mês)'}</small>
                    </div>
                    {ob.id && <button className={styles.removeObBtn} onClick={() => deleteObligation(ob.id)}><Trash2 size={13} /></button>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'apuracao' && (
            <div className={styles.apuracaoPanel}>
              <div className={styles.apuracaoForm}>
                <h4>Nova Apuração Fiscal</h4>
                <div className={styles.apuracaoRow}>
                  <select className={styles.obInput} value={apuracaoForm.mes} onChange={e => setApuracaoForm({...apuracaoForm, mes: Number(e.target.value)})}>
                    {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <input className={styles.obInput} type="number" value={apuracaoForm.ano} onChange={e => setApuracaoForm({...apuracaoForm, ano: e.target.value})} />
                </div>
                <input className={styles.obInput} placeholder="Faturamento Bruto (R$)" value={apuracaoForm.faturamento} onChange={handleFaturamentoChange} />
                <div className={styles.apuracaoCalc}><span>Imposto Calculado ({taxRate}%)</span><strong>R$ {apuracaoForm.imposto || '0,00'}</strong></div>
                <button className={styles.confirmarBtn} onClick={confirmarApuracao}><CheckCircle size={16} /> Confirmar Apuração</button>
              </div>
              <div className={styles.historicoSection}>
                <h4>Histórico de Apurações</h4>
                <ul className={styles.obList}>
                  {companyApurations.map((h, i) => (
                    <li key={i} className={styles.obItem}>
                      <div className={styles.obStatus}><CheckCircle size={13} /></div>
                      <div className={styles.obInfo}><span>{MONTH_NAMES[h.mes]} / {h.ano}</span><small>Faturamento: R$ {h.faturamento.toLocaleString('pt-BR')} · Imposto: R$ {h.imposto.toLocaleString('pt-BR')}</small></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Função de Relatório PDF Premium ──────────────────────────────────────────
const generateCompanyReport = (company, obligations, apurations) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26); doc.setFont('helvetica', 'bold');
    doc.text('BV CONTABILIDADE', 20, 25);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('RELATÓRIO CONSOLIDADO DE GESTÃO', 20, 33);
    doc.setTextColor(255, 255, 255);
    doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 20, 25, { align: 'right' });

    // Company Data Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16); doc.text(company.name?.toUpperCase() || 'EMPRESA', 20, 65);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('DADOS CADASTRAIS:', 20, 75);
    doc.setFont('helvetica', 'normal');
    
    const companyData = [
      [`Razão Social: ${company.name || '-'}`, `CNPJ: ${company.cnpj || '-'}`],
      [`Nome Fantasia: ${company.fantasyName || '-'}`, `Inscrição Estadual: ${company.stateRegistration || '-'}`],
      [`E-mail: ${company.email || '-'}`, `Telefone: ${company.phone || '-'}`],
      [`Cidade/UF: ${company.city || '-'}/${company.uf || '-'}`, `Regime: ${company.regime?.replace(/_/g, ' ') || '-'}`]
    ];

    autoTable(doc, {
      startY: 78, margin: { left: 20 },
      body: companyData,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } }
    });

    const summaryY = doc.lastAutoTable.finalY + 10;
    const totalFat = apurations.reduce((s, a) => s + Number(a.faturamento), 0);
    const totalImp = apurations.reduce((s, a) => s + Number(a.imposto), 0);

    doc.setFillColor(248, 250, 252); doc.roundedRect(20, summaryY, pageWidth - 40, 25, 2, 2, 'F');
    doc.setTextColor(71, 85, 105); doc.setFontSize(8);
    doc.text('FATURAMENTO ACUMULADO', 25, summaryY + 8); doc.text('TOTAL IMPOSTOS APURADOS', pageWidth / 2, summaryY + 8);
    doc.setTextColor(15, 23, 42); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${totalFat.toLocaleString('pt-BR')}`, 25, summaryY + 17); doc.text(`R$ ${totalImp.toLocaleString('pt-BR')}`, pageWidth / 2, summaryY + 17);

    // Apurations Table
    autoTable(doc, {
      startY: summaryY + 35, margin: { left: 20 },
      head: [['MÊS/ANO', 'FATURAMENTO', 'IMPOSTO', 'STATUS']],
      body: apurations.map(ap => [`${MONTH_NAMES[ap.mes]}/${ap.ano}`, `R$ ${ap.faturamento.toLocaleString('pt-BR')}`, `R$ ${ap.imposto.toLocaleString('pt-BR')}`, 'CONFIRMADO']),
      theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
    });

    // Obligations Table
    const obRows = obligations.map(ob => [ob.name.toUpperCase(), ob.type.toUpperCase(), `DIA ${ob.day}${ob.month > 0 ? `/${ob.month}` : ' (MENSAL)'}`, ob.status === 'PAID' ? 'PAGO' : 'PENDENTE']);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15, margin: { left: 20 },
      head: [['OBRIGAÇÃO', 'TIPO', 'VENCIMENTO', 'STATUS']],
      body: obRows.length ? obRows : [['-', 'SEM OBRIGAÇÕES', '-', '-']],
      theme: 'striped', headStyles: { fillColor: [71, 85, 105] }
    });

    doc.save(`Relatorio_${company.name.replace(/\s+/g, '_')}.pdf`);
    toast('PDF Gerado!', 'success');
  } catch (e) { console.error(e); toast('Erro no PDF', 'error'); }
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const Companies = () => {
  const { companies, deleteCompany, addCompany, obligations = [], apurations = [] } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegime, setFilterRegime] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', fantasyName: '', cnpj: '', regime: 'SIMPLES_NACIONAL',
    email: '', phone: '', uf: '', city: '', stateRegistration: ''
  });

  const maskCNPJ = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
  const maskPhone = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
  const filtered = (companies || []).filter(c => (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj?.includes(searchTerm)) && (filterRegime === 'ALL' || c.regime === filterRegime));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1 className={styles.title}>Empresas</h1><p className={styles.subtitle}>Gestão de Clientes BV Contabilidade</p></div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}><Plus size={18} /> Nova Empresa</button>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBar}><Search size={18} /><input placeholder="Buscar empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <div className={styles.selectFieldWrapper}>
          <select value={filterRegime} onChange={e => setFilterRegime(e.target.value)}>
            <option value="ALL">Todos os Regimes</option>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </select>
          <Filter size={18} className={styles.selectIcon} />
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.map((c, index) => (
          <div key={c.id} className={`${styles.card} animate-fade-in`} style={{ animationDelay: `${index * 0.05}s` }}>
            <div className={styles.cardHeader}>
              <div className={styles.companyInfo}>
                <div className={styles.avatar}>{c.name[0]}</div>
                <div>
                  <h3 className={styles.companyName}>{c.name}</h3>
                  <p className={styles.companyCnpj}>{c.cnpj}</p>
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={() => { setCompanyToDelete(c); setShowDeleteModal(true); }}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}><span>Regime</span><span className={styles.badge}>{c.regime?.replace('_',' ')}</span></div>
              <div className={styles.infoRow}><span>Status</span><span className={styles.statusActive}>Regular</span></div>
              {c.phone && <div className={styles.infoRow}><span>Contato</span><small>{c.phone}</small></div>}
              {c.email && <div className={styles.infoRow}><small style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</small></div>}
              {c.city && <div className={styles.infoRow}><span>Local</span><small>{c.city} - {c.uf}</small></div>}
            </div>
            <div className={styles.cardFooter}>
              <button className={styles.actionBtn} onClick={() => setSelectedCompany(c)}><Calendar size={16} /> Obrigações</button>
              <button className={styles.actionBtn} onClick={() => generateCompanyReport(c, obligations.filter(o => o.companyId === c.id), apurations.filter(a => a.companyId === c.id))}><FileText size={16} /> Relatório</button>
            </div>
          </div>
        ))}
      </div>

      {selectedCompany && <ObligationsPanel company={selectedCompany} onClose={() => setSelectedCompany(null)} />}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCardLarge}>
            <div className={styles.modalHeader}>
              <h3>Cadastrar Empresa</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form className={styles.formMulti} onSubmit={e => { e.preventDefault(); addCompany({...formData, status:'ACTIVE'}); setShowModal(false); toast('Empresa cadastrada!', 'success'); }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>CNPJ *</label>
                  <input required placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})} maxLength="18" />
                </div>
                <div className={styles.formGroup}>
                  <label>Razão Social *</label>
                  <input required placeholder="Razão Social" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Nome Fantasia</label>
                  <input placeholder="Nome Fantasia" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>E-mail</label>
                  <input type="email" placeholder="contato@empresa.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} maxLength="15" />
                </div>
                <div className={styles.formGroup}>
                  <label>UF *</label>
                  <input required placeholder="EX: SP" maxLength="2" value={formData.uf} onChange={e => setFormData({...formData, uf: e.target.value.toUpperCase()})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Município *</label>
                  <input required placeholder="Nome da cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Inscrição Estadual</label>
                  <input placeholder="000.000.000.000" value={formData.stateRegistration} onChange={e => setFormData({...formData, stateRegistration: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Regime Tributário *</label>
                  <div className={styles.selectFieldWrapper}>
                    <select required value={formData.regime} onChange={e => setFormData({...formData, regime: e.target.value})}>
                      <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                      <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                      <option value="LUCRO_REAL">Lucro Real</option>
                    </select>
                    <ChevronDown size={18} className={styles.selectIcon} />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Cadastrar Empresa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <Trash2 size={32} /><h3>Excluir?</h3>
            <p>Remover <strong>{companyToDelete?.name}</strong>?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className={styles.confirmDeleteBtn} onClick={() => { deleteCompany(companyToDelete.id); setShowDeleteModal(false); toast('Removido!', 'info'); }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
