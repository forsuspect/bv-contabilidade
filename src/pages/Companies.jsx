import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { toast } from '../utils/toast';
import { 
  Plus, Search, Filter, Edit, Trash2, ChevronDown,
  FileText, X, Calendar, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, Building2,
  Download, DollarSign
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './Companies.module.css';

const MONTH_NAMES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Obrigações padrão por regime (Zeradas a pedido do usuário)
const DEFAULT_FISCAL = {
  SIMPLES_NACIONAL: [],
  LUCRO_PRESUMIDO: [],
  LUCRO_REAL: [],
};

const DEFAULT_LABOR = [];

// Calendário mini
const MiniCalendar = ({ obligations }) => {
  const [curr, setCurr] = useState(new Date());
  const year = curr.getFullYear();
  const month = curr.getMonth(); // 0-indexed
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Mapeia dias com obrigações
  const dayMap = {};
  obligations.forEach(ob => {
    const obMonth = Number(ob.month); // 0 = recurring (todos os meses), 1-12 = mês específico
    const matches = obMonth === 0 || obMonth === month + 1;
    if (matches) {
      const d = Number(ob.day);
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(ob);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarNav}>
        <button onClick={() => setCurr(new Date(year, month - 1, 1))}><ChevronLeft size={14} /></button>
        <span>{MONTH_NAMES[month + 1]} {year}</span>
        <button onClick={() => setCurr(new Date(year, month + 1, 1))}><ChevronRight size={14} /></button>
      </div>
      <div className={styles.calendarGrid}>
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className={styles.calDayLabel}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const hasOb = day && dayMap[day];
          return (
            <div
              key={i}
              className={[
                styles.calCell,
                !day ? styles.calEmpty : '',
                isToday ? styles.calToday : '',
                hasOb ? styles.calHasOb : '',
              ].filter(Boolean).join(' ')}
              title={hasOb ? dayMap[day].map(o => o.name).join(', ') : ''}
            >
              {day}
              {hasOb && <span className={styles.calDot} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Painel de obrigações com cadastro e apuração
const ObligationsPanel = ({ company, onClose }) => {
  const { obligations: allDbObligations, addObligation, deleteObligation, apurations: allDbApurations, addApuracao } = useData();
  const [activeTab, setActiveTab] = useState('fiscal');
  const regime = company.regime || 'SIMPLES_NACIONAL';

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', day: '', month: '0' });

  // Apuração Fiscal state
  const [apuracaoForm, setApuracaoForm] = useState({ faturamento: '', imposto: '', mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  // Filtrar dados da empresa atual
  const companyCustomObs = allDbObligations.filter(ob => ob.companyId === company.id);
  const companyApurations = allDbApurations.filter(ap => ap.companyId === company.id)
    .sort((a, b) => b.ano - a.ano || b.mes - a.mes);

  const TAX_RATES = { SIMPLES_NACIONAL: 6, LUCRO_PRESUMIDO: 11.33, LUCRO_REAL: 15 };
  const taxRate = TAX_RATES[regime] || 6;

  const handleFaturamentoChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const formatted = (Number(raw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const impostoCalc = ((Number(raw) / 100) * taxRate / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setApuracaoForm(p => ({ ...p, faturamento: formatted, imposto: impostoCalc }));
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

  const defaultList = (activeTab === 'fiscal') ? (DEFAULT_FISCAL[regime] || []) : (activeTab === 'labor' ? DEFAULT_LABOR : []);
  const tabCustomObs = companyCustomObs.filter(ob => ob.type === activeTab);
  const allObs = [...defaultList, ...tabCustomObs];
  const today = new Date();

  const handleAddObligation = (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.day) { toast('Preencha nome e dia.', 'error'); return; }
    
    addObligation({
      companyId: company.id,
      name: addForm.name,
      day: Number(addForm.day),
      month: Number(addForm.month),
      type: activeTab
    });

    setAddForm({ name: '', day: '', month: '0' });
    setShowAddForm(false);
    toast('Obrigação adicionada!', 'success');
  };

  const getStatus = (ob) => {
    if (ob.month !== 0 && ob.month !== today.getMonth() + 1) return 'future';
    if (ob.day < today.getDate()) return 'past';
    if (ob.day - today.getDate() <= 5) return 'soon';
    return 'ok';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.obligationsModal}>
        <div className={styles.obligationsHeader}>
          <div>
            <div className={styles.obligationsTitle}><Building2 size={18} /><h3>{company.name}</h3></div>
            <p className={styles.obligationsSubtitle}>Obrigações e Apuração Fiscal</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.obligationsTabs}>
          <button className={`${styles.obTab} ${activeTab === 'fiscal' ? styles.obTabActive : ''}`} onClick={() => { setActiveTab('fiscal'); setShowAddForm(false); }}>
            <FileText size={15} /> Fiscal
          </button>
          <button className={`${styles.obTab} ${activeTab === 'labor' ? styles.obTabActive : ''}`} onClick={() => { setActiveTab('labor'); setShowAddForm(false); }}>
            <AlertTriangle size={15} /> Trabalhista
          </button>
          <button className={`${styles.obTab} ${activeTab === 'apuracao' ? styles.obTabActive : ''}`} onClick={() => { setActiveTab('apuracao'); setShowAddForm(false); }}>
            <CheckCircle size={15} /> Apuração
          </button>
        </div>

        <div className={styles.obligationsBody}>
          {/* ── Aba Fiscal / Trabalhista ── */}
          {(activeTab === 'fiscal' || activeTab === 'labor') && (
            <>
              <div className={styles.obligationsLeft}>
                <MiniCalendar obligations={allObs} />
                <div className={styles.calLegend}><span className={styles.legendDot} /> Vencimento</div>
              </div>
              <div className={styles.obligationsRight}>
                <div className={styles.obListHeader}>
                  <h4 className={styles.obListTitle}>{activeTab === 'fiscal' ? 'Obrigações Fiscais' : 'Obrigações Trabalhistas'}</h4>
                  <button className={styles.addObBtn} onClick={() => setShowAddForm(v => !v)}><Plus size={14} /> Adicionar</button>
                </div>

                {showAddForm && (
                  <form onSubmit={handleAddObligation} className={styles.addObForm}>
                    <input className={styles.obInput} type="text" placeholder="Nome da obrigação" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required />
                    <div className={styles.addObRow}>
                      <div className={styles.addObField}>
                        <label>Dia</label>
                        <input className={styles.obInput} type="number" min="1" max="31" placeholder="Ex: 20" value={addForm.day} onChange={e => setAddForm(p => ({ ...p, day: e.target.value }))} required />
                      </div>
                      <div className={styles.addObField}>
                        <label>Mês</label>
                        <select className={styles.obInput} value={addForm.month} onChange={e => setAddForm(p => ({ ...p, month: e.target.value }))}>
                          <option value="0">Todo mês</option>
                          {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className={styles.addObActions}>
                      <button type="button" className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>Cancelar</button>
                      <button type="submit" className={styles.saveBtn}>Salvar</button>
                    </div>
                  </form>
                )}

                <ul className={styles.obList}>
                  {allObs.map((ob, i) => {
                    const status = getStatus(ob);
                    const isCustom = !!ob.id;
                    return (
                      <li key={i} className={styles.obItem}>
                        <div className={`${styles.obStatus} ${styles['obStatus_' + status]}`}>
                          {status === 'past' && <CheckCircle size={13} />}
                          {status === 'soon' && <AlertTriangle size={13} />}
                          {(status === 'ok' || status === 'future') && <Clock size={13} />}
                        </div>
                        <div className={styles.obInfo}>
                          <span className={styles.obName}>{ob.name}</span>
                          <span className={styles.obDate}>
                            Dia {ob.day}{ob.month > 0 ? ` de ${MONTH_NAMES[ob.month]}` : ' (mensal)'}
                          </span>
                        </div>
                        {isCustom && <button className={styles.removeObBtn} onClick={() => deleteObligation(ob.id)}><X size={13} /></button>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

          {/* ── Aba Apuração ── */}
          {activeTab === 'apuracao' && (
            <div className={styles.apuracaoPanel}>
              <div className={styles.apuracaoForm}>
                <h4 className={styles.obListTitle}>Registrar Apuração Fiscal</h4>
                <p className={styles.apuracaoDesc}>
                  Regime: <strong>{company.regime?.replace(/_/g,' ')}</strong> — Alíquota estimada: <strong>{taxRate}%</strong>
                </p>

                <div className={styles.apuracaoRow}>
                  <div className={styles.addObField}>
                    <label>Mês de referência</label>
                    <select className={styles.obInput} value={apuracaoForm.mes} onChange={e => setApuracaoForm(p => ({...p, mes: Number(e.target.value)}))}>
                      {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className={styles.addObField}>
                    <label>Ano</label>
                    <input className={styles.obInput} type="number" value={apuracaoForm.ano} onChange={e => setApuracaoForm(p => ({...p, ano: e.target.value}))} />
                  </div>
                </div>

                <div className={styles.addObField}>
                  <label>Faturamento Bruto (R$)</label>
                  <input className={styles.obInput} type="text" placeholder="0,00" value={apuracaoForm.faturamento} onChange={handleFaturamentoChange} />
                </div>

                <div className={styles.apuracaoCalc}>
                  <span>Imposto estimado ({taxRate}%)</span>
                  <strong className={styles.apuracaoValue}>R$ {apuracaoForm.imposto || '0,00'}</strong>
                </div>

                <div className={styles.addObField}>
                  <label>Valor do imposto pago (R$)</label>
                  <input className={styles.obInput} type="text" placeholder="0,00" value={apuracaoForm.imposto}
                    onChange={e => setApuracaoForm(p => ({...p, imposto: e.target.value}))} />
                </div>

                <button className={styles.confirmarBtn} onClick={confirmarApuracao}>
                  <CheckCircle size={16} /> Confirmar Apuração
                </button>
              </div>

              {companyApurations.length > 0 && (
                <div className={styles.historicoSection}>
                  <h4 className={styles.obListTitle}>Histórico</h4>
                  <ul className={styles.obList}>
                    {companyApurations.map((h, i) => (
                      <li key={i} className={styles.obItem}>
                        <div className={styles.obStatus} style={{background:'rgba(16,185,129,0.15)',color:'#10b981'}}><CheckCircle size={13} /></div>
                        <div className={styles.obInfo}>
                          <span className={styles.obName}>{MONTH_NAMES[h.mes]} / {h.ano}</span>
                          <span className={styles.obDate}>Fat: R$ {h.faturamento.toLocaleString('pt-BR')} · Imp: R$ {h.imposto.toLocaleString('pt-BR')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Função para gerar Relatório PDF Premium e Estilizado
const generateCompanyReport = (company, obligations, apurations) => {
  try {
    console.log('Gerando PDF Premium para:', company.name);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Cabeçalho Corporativo (Full Width)
    doc.setFillColor(15, 23, 42); // Navy Dark
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('BV CONTABILIDADE', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('SOLUÇÕES CONTÁBEIS E GESTÃO EMPRESARIAL', 20, 33);
    
    doc.setTextColor(255, 255, 255);
    doc.text(`GERADO EM: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 20, 25, { align: 'right' });

    // 2. Título do Documento
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO CONSOLIDADO DE GESTÃO', 20, 70);
    doc.setDrawColor(59, 130, 246); // Blue-500
    doc.setLineWidth(1);
    doc.line(20, 75, 60, 75);

    // 3. Informações da Empresa (Card Look)
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(20, 85, pageWidth - 40, 35, 3, 3, 'F');
    
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('IDENTIFICAÇÃO DA EMPRESA', 25, 93);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`RAZÃO SOCIAL:`, 25, 103);
    doc.text(`CNPJ:`, 25, 110);
    doc.text(`REGIME:`, (pageWidth / 2), 110);
    
    doc.setFont('helvetica', 'normal');
    doc.text(company.name?.toUpperCase() || '---', 60, 103);
    doc.text(company.cnpj || '---', 40, 110);
    doc.text(company.regime?.replace(/_/g, ' ') || 'NÃO INFORMADO', (pageWidth / 2) + 20, 110);

    // 4. Resumo Financeiro Acumulado (Highlights)
    const totalFat = apurations.reduce((s, a) => s + Number(a.faturamento), 0);
    const totalImp = apurations.reduce((s, a) => s + Number(a.imposto), 0);

    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.roundedRect(20, 125, (pageWidth - 45) / 2, 20, 2, 2, 'F');
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(8);
    doc.text('FATURAMENTO TOTAL ACUMULADO', 25, 132);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, 140);

    doc.setFillColor(254, 242, 242); // Red-50
    doc.roundedRect((pageWidth / 2) + 2.5, 125, (pageWidth - 45) / 2, 20, 2, 2, 'F');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.text('TOTAL DE IMPOSTOS APURADOS', (pageWidth / 2) + 7.5, 132);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${totalImp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, (pageWidth / 2) + 7.5, 140);

    // 5. Tabela de Histórico Fiscal
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text('HISTÓRICO FISCAL DETALHADO', 20, 160);
    
    const apurRows = apurations.map(ap => [
      `${MONTH_NAMES[ap.mes]} / ${ap.ano}`,
      `R$ ${Number(ap.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${Number(ap.imposto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'CONFIRMADO'
    ]);

    autoTable(doc, {
      startY: 165,
      margin: { left: 20, right: 20 },
      head: [['MÊS REFERÊNCIA', 'FATURAMENTO BRUTO', 'IMPOSTO APURADO', 'STATUS']],
      body: apurRows.length > 0 ? apurRows : [['-', 'Sem registros', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'center', textColor: [16, 185, 129] }
      },
      styles: { fontSize: 9, cellPadding: 5 }
    });

    // 6. Obrigações e Calendário
    let currentY = doc.lastAutoTable.finalY + 15;
    if (currentY > pageHeight - 60) { doc.addPage(); currentY = 20; }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text('CALENDÁRIO DE OBRIGAÇÕES EXTRAS', 20, currentY);

    const obRows = obligations.map(ob => [
      ob.name.toUpperCase(),
      ob.type === 'fiscal' ? 'FISCAL' : 'TRABALHISTA',
      `DIA ${ob.day}${ob.month > 0 ? ` DE ${MONTH_NAMES[ob.month].toUpperCase()}` : ' (MENSAL)'}`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      margin: { left: 20, right: 20 },
      head: [['NOME DA OBRIGAÇÃO', 'CATEGORIA', 'VENCIMENTO']],
      body: obRows.length > 0 ? obRows : [['-', 'Nenhuma obrigação customizada', '-']],
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 4 }
    });

    // 7. Rodapé Profissional
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Este documento é um relatório gerencial da plataforma BV Contabilidade.', 20, pageHeight - 18);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 18, { align: 'right' });
    }

    doc.save(`Relatorio_Premium_${company.name.replace(/\s+/g, '_')}.pdf`);
    toast('Relatório Premium gerado!', 'success');
  } catch (error) {
    console.error('Erro PDF Premium:', error);
    toast('Erro ao gerar relatório estilizado.', 'error');
  }
};



// ─── Componente principal ─────────────────────────────────────────────────────
const Companies = () => {
  const { companies, deleteCompany, addCompany, obligations = [], apurations = [] } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegime, setFilterRegime] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({ name: '', fantasyName: '', cnpj: '', regime: 'SIMPLES_NACIONAL' });
  
  const maskCNPJ = (v) =>
    v.replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);

  const safeCompanies = Array.isArray(companies) ? companies : [];
  const filteredCompanies = safeCompanies.filter(c => {
    if (!c) return false;
    const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.cnpj || '').includes(searchTerm);
    const matchRegime = filterRegime === 'ALL' || c.regime === filterRegime;
    return matchSearch && matchRegime;
  });

  const getRegimeLabel = (r) => ({
    SIMPLES_NACIONAL: 'Simples Nacional',
    LUCRO_PRESUMIDO: 'Lucro Presumido',
    LUCRO_REAL: 'Lucro Real',
  }[r] || r || 'Não definido');

  const handleSaveCompany = (e) => {
    e.preventDefault();
    if (formData.cnpj.length < 18) { toast('CNPJ inválido.', 'error'); return; }
    addCompany({ ...formData, status: 'ACTIVE', estimatedTax: 0 });
    toast('Empresa cadastrada!', 'success');
    setShowModal(false);
    setFormData({ name: '', fantasyName: '', cnpj: '', regime: 'SIMPLES_NACIONAL' });
  };

  const handleDelete = () => {
    if (companyToDelete) {
      deleteCompany(companyToDelete.id);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      toast('Empresa removida.', 'info');
    }
  };

  const handleReport = (company) => {
    const companyObs = obligations.filter(ob => ob.companyId === company.id);
    const companyApur = apurations.filter(ap => ap.companyId === company.id);
    generateCompanyReport(company, companyObs, companyApur);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Empresas</h1>
          <p className={styles.subtitle}>Gerencie o portfólio de clientes da BV Contabilidade.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Cadastrar Empresa
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <Search size={18} />
          <input type="text" placeholder="Pesquisar por nome ou CNPJ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className={styles.selectWrapper}>
          <Filter size={18} className={styles.filterIcon} />
          <select value={filterRegime} onChange={e => setFilterRegime(e.target.value)} className={styles.select}>
            <option value="ALL">Todos os Regimes</option>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </select>
          <ChevronDown size={16} className={styles.chevron} />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredCompanies.map((company) => (
          <div key={company?.id || Math.random()} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.companyInfo}>
                <div className={styles.avatar}>{(company?.name || 'E').charAt(0)}</div>
                <div>
                  <h3 className={styles.companyName}>{company?.name || 'Sem nome'}</h3>
                  <p className={styles.companyCnpj}>{company?.cnpj || 'Sem CNPJ'}</p>
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn}><Edit size={16} /></button>
                <button className={styles.iconBtn} onClick={() => { setCompanyToDelete(company); setShowDeleteModal(true); }}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span>Regime Tributário</span>
                <span className={styles.badge}>{getRegimeLabel(company.regime)}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Status Fiscal</span>
                <span className={`${styles.status} ${company.status === 'ACTIVE' ? styles.statusActive : styles.statusPending}`}>
                  {company.status === 'ACTIVE' ? 'Regular' : 'Pendente'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span>Imposto Estimado</span>
                <span className={styles.value}>R$ {Number(company.estimated_tax || 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <button className={styles.actionBtn} onClick={() => setSelectedCompany(company)}>
                <Calendar size={16} /> Obrigações
              </button>
              <button className={styles.actionBtn} onClick={() => handleReport(company)}>
                <FileText size={16} /> Relatório
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCompany && <ObligationsPanel company={selectedCompany} onClose={() => setSelectedCompany(null)} />}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCardForm}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cadastrar Nova Empresa</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCompany} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Razão Social</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Tech Solutions LTDA" />
              </div>
              <div className={styles.inputGroup}>
                <label>Nome Fantasia</label>
                <input required type="text" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value})} placeholder="Ex: Tech Solutions" />
              </div>
              <div className={styles.inputGroup}>
                <label>CNPJ</label>
                <input required type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})} placeholder="00.000.000/0000-00" maxLength="18" />
              </div>
              <div className={styles.inputGroup}>
                <label>Regime Tributário</label>
                <select value={formData.regime} onChange={e => setFormData({...formData, regime: e.target.value})}>
                  <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                </select>
              </div>
              <div className={styles.modalActionsForm}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIconWarning}><Trash2 size={32} /></div>
            <h3 className={styles.modalTitle}>Excluir Empresa</h3>
            <p className={styles.modalText}>Tem certeza que deseja remover <strong>{companyToDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
