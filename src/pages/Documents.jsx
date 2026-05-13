import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Building2, 
  FileText, 
  Download, 
  Upload,
  Search,
  Filter,
  File,
  FolderOpen,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import styles from './Documents.module.css';

const Documents = () => {
  const { companies, documents = [], addDocument, deleteDocument } = useData();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos os Arquivos');
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    category: 'Contábil',
    type: 'PDF',
    file: null
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        file: file,
        name: file.name.split('.')[0],
        type: file.name.split('.').pop().toUpperCase()
      }));
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!formData.companyId || (!formData.file && !formData.name)) return;

    const saveDoc = (fileData = null) => {
      addDocument({
        name: formData.name,
        companyId: formData.companyId,
        category: formData.category,
        type: formData.type,
        size: formData.file ? `${(formData.file.size / (1024 * 1024)).toFixed(2)} MB` : '0 KB',
        date: new Date().toLocaleDateString('pt-BR'),
        fileData: fileData
      });
      setShowModal(false);
      setFormData({ name: '', companyId: '', category: 'Contábil', type: 'PDF', file: null });
    };

    if (formData.file) {
      const reader = new FileReader();
      reader.onload = () => saveDoc(reader.result);
      reader.readAsDataURL(formData.file);
    } else {
      saveDoc();
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchCompany = selectedCompanyId === '' || doc.companyId === selectedCompanyId;
    const matchSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'Todos os Arquivos' || doc.category === activeCategory;
    return matchCompany && matchSearch && matchCategory;
  });

  const handleView = (doc) => {
    if (doc.fileData) {
      const win = window.open();
      win.document.write(`<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      alert('Este é um documento de exemplo e não possui visualização real.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Documentos</h1>
          <p className={styles.subtitle}>Armazene, organize e compartilhe documentos contábeis com segurança.</p>
        </div>
        <button className={styles.uploadBtn} onClick={() => setShowModal(true)}>
          <Upload size={18} />
          Fazer Upload
        </button>
      </header>

      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar documento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.selectWrapper}>
          <Building2 size={18} className={styles.filterIcon} />
          <select 
            value={selectedCompanyId} 
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className={styles.select}
          >
            <option value="">Todas as Empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar Folders */}
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Categorias</h3>
          <ul className={styles.folderList}>
            <li className={activeCategory === 'Todos os Arquivos' ? styles.activeFolder : ''} onClick={() => setActiveCategory('Todos os Arquivos')}>
              <FolderOpen size={18} />
              <span>Todos os Arquivos</span>
            </li>
            <li className={activeCategory === 'Contábil' ? styles.activeFolder : ''} onClick={() => setActiveCategory('Contábil')}>
              <FolderOpen size={18} />
              <span>Contábil</span>
            </li>
            <li className={activeCategory === 'Fiscal & Tributário' ? styles.activeFolder : ''} onClick={() => setActiveCategory('Fiscal & Tributário')}>
              <FolderOpen size={18} />
              <span>Fiscal & Tributário</span>
            </li>
            <li className={activeCategory === 'Departamento Pessoal' ? styles.activeFolder : ''} onClick={() => setActiveCategory('Departamento Pessoal')}>
              <FolderOpen size={18} />
              <span>Departamento Pessoal</span>
            </li>
            <li className={activeCategory === 'Legalização' ? styles.activeFolder : ''} onClick={() => setActiveCategory('Legalização')}>
              <FolderOpen size={18} />
              <span>Legalização</span>
            </li>
          </ul>
        </div>

        {/* Main Content Area */}
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome do Arquivo</th>
                    <th>Empresa</th>
                    <th>Categoria</th>
                    <th>Tamanho</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => {
                      const company = companies.find(c => c.id === doc.companyId);
                      return (
                        <tr key={doc.id}>
                          <td>
                            <div className={styles.fileInfo}>
                              <div className={`${styles.fileIcon} ${doc.type === 'PDF' ? styles.iconPdf : styles.iconExcel}`}>
                                <FileText size={18} />
                              </div>
                              <span className={styles.fileName}>{doc.name}</span>
                            </div>
                          </td>
                          <td className={styles.companyName}>{company ? company.name : 'Empresa não encontrada'}</td>
                          <td><span className={styles.categoryBadge}>{doc.category}</span></td>
                          <td className={styles.fileMeta}>{doc.size}</td>
                          <td className={styles.fileMeta}>{doc.date}</td>
                          <td>
                            <div className={styles.actions}>
                              <button className={styles.actionBtn} title="Visualizar" onClick={() => handleView(doc)}>
                                <Eye size={16} />
                              </button>
                              {doc.fileData && (
                                <a 
                                  href={doc.fileData} 
                                  download={doc.name} 
                                  className={styles.actionBtn}
                                  title="Baixar"
                                >
                                  <Download size={16} />
                                </a>
                              )}
                              {!doc.fileData && (
                                <button className={styles.actionBtn} title="Baixar">
                                  <Download size={16} />
                                </button>
                              )}
                              <button 
                                className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                                title="Excluir"
                                onClick={() => deleteDocument(doc.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className={styles.emptyState}>
                        <File size={48} className={styles.emptyIcon} />
                        <p>Nenhum documento encontrado.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Upload de Documento</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Selecionar Arquivo Real</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  accept=".pdf,.xlsx,.docx,.jpg,.png"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nome para Exibição</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Balanço Patrimonial 2023"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Empresa Vinculada</label>
                <select 
                  required 
                  value={formData.companyId}
                  onChange={e => setFormData({...formData, companyId: e.target.value})}
                >
                  <option value="">Selecione a empresa</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Categoria</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Contábil">Contábil</option>
                  <option value="Fiscal & Tributário">Fiscal & Tributário</option>
                  <option value="Departamento Pessoal">Departamento Pessoal</option>
                  <option value="Legalização">Legalização</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Formato</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="PDF">PDF (.pdf)</option>
                  <option value="Excel">Excel (.xlsx)</option>
                  <option value="Doc">Word (.docx)</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Salvar Documento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
