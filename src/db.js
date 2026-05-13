import Dexie from 'dexie';

// Criação do banco de dados local usando IndexedDB
export const db = new Dexie('BVContabilidadeDB');

// Definição das tabelas e seus índices primários
db.version(4).stores({
  companies: 'id, name, cnpj, status, regime, userId',
  users: 'id, username, role, status',
  employees: 'id, name, companyId, role, status, userId',
  documents: 'id, companyId, type, status, uploadDate, userId',
  payroll: 'id, companyId, month, status, totalValue, userId',
  activities: '++id, type, description, timestamp, userRole, userId'
});

// Função para garantir que o banco está persistente e tem usuários iniciais
export const initDB = async () => {
  const usersCount = await db.users.count();
  if (usersCount === 0) {
    // Se o banco estiver vazio, cria o usuário mestre para evitar perda de acesso
    await db.users.add({
      id: '1',
      username: 'admin',
      password: 'bv',
      name: 'Administrador BV',
      role: 'DESENVOLVEDOR',
      status: 'ACTIVE'
    });
    console.log('Usuário mestre criado para persistência.');
  }
};

initDB();
