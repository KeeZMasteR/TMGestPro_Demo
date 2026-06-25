// Sistema de armazenamento mock para modo demo
// Simula o comportamento do @base44/sdk usando localStorage

const STORAGE_PREFIX = 'tmgestpro_mock_';

// Gera ID único
const generateId = () => {
  return 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Obter todos os items de uma entidade
const getAll = (entityName) => {
  const key = STORAGE_PREFIX + entityName;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Salvar todos os items de uma entidade
const saveAll = (entityName, items) => {
  const key = STORAGE_PREFIX + entityName;
  localStorage.setItem(key, JSON.stringify(items));
};

// Criar entity mock com operações CRUD
const createMockEntity = (entityName) => {
  return {
    // LIST - Listar todos os itens (com ordenação opcional)
    list: async (sortBy = '-created_date', limit = 1000) => {
      const items = getAll(entityName);
      
      // Aplicar ordenação se especificada
      if (sortBy) {
        const isDesc = sortBy.startsWith('-');
        const field = isDesc ? sortBy.substring(1) : sortBy;
        
        items.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal === bVal) return 0;
          if (aVal === undefined) return 1;
          if (bVal === undefined) return -1;
          
          const result = aVal > bVal ? 1 : -1;
          return isDesc ? -result : result;
        });
      }
      
      // Aplicar limite
      return items.slice(0, limit);
    },

    // FILTER - Filtrar itens por critérios
    filter: async (criteria) => {
      const items = getAll(entityName);
      
      return items.filter(item => {
        return Object.keys(criteria).every(key => {
          return item[key] === criteria[key];
        });
      });
    },

    // GET - Obter um item específico por ID
    get: async (id) => {
      const items = getAll(entityName);
      const item = items.find(item => item.id === id);
      
      if (!item) {
        throw new Error(`${entityName} com id ${id} não encontrado`);
      }
      
      return item;
    },

    // CREATE - Criar novo item
    create: async (data) => {
      const items = getAll(entityName);
      
      const newItem = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      
      items.push(newItem);
      saveAll(entityName, items);
      
      return newItem;
    },

    // BULK CREATE - Criar múltiplos itens
    bulkCreate: async (dataArray) => {
      const items = getAll(entityName);
      
      const newItems = dataArray.map(data => ({
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      }));
      
      items.push(...newItems);
      saveAll(entityName, items);
      
      return newItems;
    },

    // UPDATE - Atualizar item existente
    update: async (id, data) => {
      const items = getAll(entityName);
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`${entityName} com id ${id} não encontrado`);
      }
      
      const updatedItem = {
        ...items[index],
        ...data,
        id, // Manter o ID original
        updated_date: new Date().toISOString(),
      };
      
      items[index] = updatedItem;
      saveAll(entityName, items);
      
      return updatedItem;
    },

    // DELETE - Remover item
    delete: async (id) => {
      const items = getAll(entityName);
      const filteredItems = items.filter(item => item.id !== id);
      
      if (items.length === filteredItems.length) {
        throw new Error(`${entityName} com id ${id} não encontrado`);
      }
      
      saveAll(entityName, filteredItems);
      
      return { success: true, id };
    },
  };
};

// Mock do cliente base44 completo
export const createMockClient = () => {
  const entities = {
    Budget: createMockEntity('Budget'),
    Client: createMockEntity('Client'),
    PriceItem: createMockEntity('PriceItem'),
    CompanyProfile: createMockEntity('CompanyProfile'),
    ScheduledWork: createMockEntity('ScheduledWork'),
    AllowedEmail: createMockEntity('AllowedEmail'),
    AppSettings: createMockEntity('AppSettings'),
  };

  return {
    entities,
    
    // Mock de autenticação
    auth: {
      me: async () => ({
        id: 'demo_user',
        email: 'demo@tmgestpro.com',
        name: 'Demo User',
      }),
      
      logout: () => {
        console.log('[DEMO MODE] Logout simulado');
      },
      
      redirectToLogin: () => {
        console.log('[DEMO MODE] Redirect to login simulado');
      },
    },
    
    // Mock de integrações
    integrations: {
      Core: {
        UploadFile: async ({ file }) => {
          // Simula upload de arquivo convertendo para base64
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                file_url: reader.result, // Retorna data URL
                success: true,
              });
            };
            reader.readAsDataURL(file);
          });
        },
      },
    },
  };
};

// Função para popular dados iniciais de demo (se necessário)
export const seedMockData = () => {
  // Verifica se já existe dados
  const existingBudgets = getAll('Budget');
  if (existingBudgets.length > 0) {
    return; // Já tem dados, não precisa seed
  }

  console.log('[DEMO MODE] Inicializando dados de demonstração...');
  
  // Criar alguns clientes de exemplo
  const mockClients = [
    {
      id: 'client_1',
      name: 'João Silva',
      address: 'Rua das Flores, 123',
      postal_code: '1000-100',
      city: 'Lisboa',
      phone: '210000000',
      email: 'joao@example.com',
      nif: '123456789',
      created_date: new Date().toISOString(),
    },
    {
      id: 'client_2',
      name: 'Maria Santos',
      address: 'Avenida Central, 456',
      postal_code: '4000-200',
      city: 'Porto',
      phone: '220000000',
      email: 'maria@example.com',
      nif: '987654321',
      created_date: new Date().toISOString(),
    },
  ];
  
  saveAll('Client', mockClients);

  // Criar perfil da empresa de exemplo
  const mockCompanyProfile = [
    {
      id: 'company_1',
      company_name: 'TMGestPro Demo',
      nif: '500000000',
      address: 'Rua da Empresa, 1',
      phone: '210000000',
      email: 'info@tmgestpro.com',
      iban: 'PT50000000000000000000000',
      currency: 'EUR',
      logo_url: 'https://media.base44.com/images/public/69e7cf65e769dab3c40900be/23c86cf05_ChatGPTImageApr25202608_44_25PM.png',
      document_template: 'classic',
      validity_days: 15,
      vat_rate: 23,
      created_date: new Date().toISOString(),
    },
  ];
  
  saveAll('CompanyProfile', mockCompanyProfile);

  // Criar alguns itens de preço de exemplo
  const mockPriceItems = [
    {
      id: 'price_1',
      tipo: 'Prestação de Serviços',
      categoria: 'Mão de Obra',
      nome: 'Pedreiro',
      unidade: 'H',
      preco_unitario: 25,
      active: true,
      created_date: new Date().toISOString(),
    },
    {
      id: 'price_2',
      tipo: 'Material',
      categoria: 'Coberturas',
      nome: 'Telha Cerâmica',
      unidade: 'm2',
      preco_unitario: 15,
      active: true,
      created_date: new Date().toISOString(),
    },
  ];
  
  saveAll('PriceItem', mockPriceItems);

  console.log('[DEMO MODE] Dados de demonstração criados com sucesso!');
};

// Função para limpar todos os dados mock
export const clearMockData = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('[DEMO MODE] Todos os dados mock foram limpos');
};
