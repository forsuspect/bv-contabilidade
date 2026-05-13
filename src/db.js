import Dexie from 'dexie';

// Criação do banco de dados local usando IndexedDB
export const db = new Dexie('BVContabilidadeDB');

// Definição das tabelas e seus índices primários
db.version(3).stores({
  companies: 'id, name, cnpj, status, regime, userId',
  users: 'id, username, role, status',
  employees: 'id, name, companyId, role, status, userId',
  documents: 'id, companyId, type, status, uploadDate, userId',
  payroll: 'id, companyId, month, status, totalValue, userId',
  activities: '++id, type, description, timestamp, userRole, userId'
});
