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
  const [activeTab, setActiveTab] = useState('fiscal');
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

  const tabCustomObs = companyCustomObs.filter(ob => ob.type === activeTab);
  const defaultList = (activeTab === 'fiscal') ? (DEFAULT_FISCAL[regime] || []) : (activeTab === 'labor' ? DEFAULT_LABOR : []);
  const allObs = [...defaultList, ...tabCustomObs];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.obligationsModal}>
        <div className={styles.obligationsHeader}>
          <div className={styles.obligationsTitle}><Building2 size={18} /><h3>{company.name}</h3></div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.obligationsTabs}>
          {[
            { id: 'fiscal', label: 'Fiscais', icon: <FileText size={16} /> },
            { id: 'labor', label: 'Trabalhistas', icon: <AlertTriangle size={16} /> },
            { id: 'apuracao', label: 'Apuração', icon: <CheckCircle size={16} /> }
          ].map(tab => (
            <button 
              key={tab.id} 
              className={`${styles.obTab} ${activeTab === tab.id ? styles.obTabActive : ''}`} 
              onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.obligationsBody}>
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
    const margin = 20;
    
    // 1. Logo Estilizada (Design de Emblema Premium)
    const logoSize = 32;
    const centerX = pageWidth / 2;
    const centerY = 30;
    
    // Círculo decorativo ao redor da logo
    doc.setDrawColor(226, 232, 240); // Soft Gray
    doc.setLineWidth(0.5);
    doc.circle(centerX, centerY, 22, 'S');
    
    // Linhas decorativas laterais
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, centerY, centerX - 28, centerY);
    doc.line(centerX + 28, centerY, pageWidth - margin, centerY);

    try {
      doc.addImage('/bv-logo.png', 'PNG', centerX - (logoSize / 2), centerY - (logoSize / 2), logoSize, logoSize);
    } catch (e) {
      console.warn('Erro ao carregar logo:', e);
    }

    // 2. Título do Relatório (Posicionamento Ajustado)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Relatório de Gestão Empresarial', pageWidth / 2, 65, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 72, { align: 'center' });

    // Linha Divisória
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 80, pageWidth - margin, 80);

    // 3. Dados Cadastrais Completos (Grid Moderno)
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DADOS CADASTRAIS COMPLETOS', margin, 92);

    const infoY = 102;
    const col2 = margin + 85;
    const col3 = margin + 140;

    const drawInfo = (label, value, x, y) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(label, x, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(String(value || '-').toUpperCase(), x, y + 6);
    };

    drawInfo('RAZÃO SOCIAL', company.name, margin, infoY);
    drawInfo('NOME FANTASIA', company.fantasyName, col2, infoY);
    
    drawInfo('CNPJ', company.cnpj, margin, infoY + 18);
    drawInfo('INSCRIÇÃO ESTADUAL', company.stateRegistration, col2, infoY + 18);
    drawInfo('REGIME TRIBUTÁRIO', company.regime?.replace('_', ' '), col3, infoY + 18);

    drawInfo('E-MAIL DE CONTATO', company.email, margin, infoY + 36);
    drawInfo('TELEFONE', company.phone, col2, infoY + 36);
    drawInfo('LOCALIZAÇÃO', `${company.city || '-'} - ${company.uf || '-'}`, col3, infoY + 36);

    // 4. Resumo Financeiro
    const totalFat = apurations.reduce((s, a) => s + Number(a.faturamento), 0);
    const totalImp = apurations.reduce((s, a) => s + Number(a.imposto), 0);

    doc.setFillColor(15, 23, 42); // Black/Navy Dark
    doc.roundedRect(margin, 155, pageWidth - (margin * 2), 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('FATURAMENTO BRUTO ACUMULADO', margin + 10, 165);
    doc.text('TOTAL DE IMPOSTOS CALCULADOS', margin + 100, 165);

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 10, 173);
    doc.text(`R$ ${totalImp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 100, 173);

    // 5. Tabelas
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('CRONOGRAMA DE OBRIGAÇÕES', margin, 195);

    autoTable(doc, {
      startY: 200,
      head: [['OBRIGAÇÃO', 'VENCIMENTO', 'STATUS']],
      body: obligations.map(ob => [
        ob.name.toUpperCase(), 
        `DIA ${ob.day}${ob.month > 0 ? `/${ob.month}` : ' (MENSAL)'}`, 
        ob.status === 'PAID' ? 'LIQUIDADO' : 'PENDENTE'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 2: { fontStyle: 'bold' } }
    });

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160);
      doc.text(`BV Contabilidade | Relatório Estratégico de Gestão | Página ${i} de ${pageCount}`, pageWidth / 2, 285, { align: 'center' });
    }

    doc.save(`BV_Relatorio_Premium_${company.name?.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`);
    toast('Relatório Premium gerado!', 'success');
  } catch (error) {
    console.error('Erro PDF:', error);
    toast('Erro ao gerar o relatório.', 'error');
  }
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
              <div className={styles.infoRow}>
                <span>Regime</span>
                <span className={styles.badge}>
                  <Building2 size={12} />
                  {c.regime?.replace('_',' ')}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span>Status</span>
                <span className={styles.statusActive}>
                  <CheckCircle size={12} />
                  Regular
                </span>
              </div>
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
