// Sistema de armazenamento mock para modo demo
// Simula o comportamento do @base44/sdk usando localStorage

const STORAGE_PREFIX = 'tmgestpro_mock_';

// Gera ID único
const generateId = () => {
  return 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Obter todos os items de uma entidade
const getAll = (entityName) => {
  try {
    const key = STORAGE_PREFIX + entityName;
    const data = localStorage.getItem(key);
    
    // Se não existir dados, retorna array vazio
    if (!data || data === 'null' || data === 'undefined') {
      return [];
    }
    
    // Tenta fazer parse do JSON
    const parsed = JSON.parse(data);
    
    // Garante que retorna um array
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`[MockDataStore] Erro ao ler ${entityName}:`, error);
    // Em caso de erro, retorna array vazio para não crashar a aplicação
    return [];
  }
};

// Salvar todos os items de uma entidade
const saveAll = (entityName, items) => {
  try {
    const key = STORAGE_PREFIX + entityName;
    
    // Garante que items é um array
    const dataToSave = Array.isArray(items) ? items : [];
    
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (error) {
    console.error(`[MockDataStore] Erro ao guardar ${entityName}:`, error);
    
    // Se falhar por quota excedida, tenta limpar dados antigos
    if (error.name === 'QuotaExceededError') {
      console.warn('[MockDataStore] Quota do localStorage excedida. A limpar dados...');
      clearMockData();
      // Tenta novamente após limpar
      try {
        const key = STORAGE_PREFIX + entityName;
        localStorage.setItem(key, JSON.stringify(items));
      } catch (retryError) {
        console.error('[MockDataStore] Falha ao guardar mesmo após limpeza:', retryError);
      }
    }
  }
};

// Criar entity mock com operações CRUD
const createMockEntity = (entityName) => {
  return {
    // LIST - Listar todos os itens (com ordenação opcional)
    list: async (sortBy = '-created_date', limit = 1000) => {
      try {
        const items = getAll(entityName);
        
        // Se não houver itens, retorna array vazio
        if (!items || items.length === 0) {
          return [];
        }
        
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
      } catch (error) {
        console.error(`[MockDataStore] Erro ao listar ${entityName}:`, error);
        return [];
      }
    },

    // FILTER - Filtrar itens por critérios
    filter: async (criteria) => {
      try {
        const items = getAll(entityName);
        
        if (!items || items.length === 0) {
          return [];
        }
        
        return items.filter(item => {
          return Object.keys(criteria).every(key => {
            return item[key] === criteria[key];
          });
        });
      } catch (error) {
        console.error(`[MockDataStore] Erro ao filtrar ${entityName}:`, error);
        return [];
      }
    },

    // GET - Obter um item específico por ID
    get: async (id) => {
      try {
        const items = getAll(entityName);
        const item = items.find(item => item.id === id);
        
        if (!item) {
          throw new Error(`${entityName} com id ${id} não encontrado`);
        }
        
        return item;
      } catch (error) {
        console.error(`[MockDataStore] Erro ao obter ${entityName} com id ${id}:`, error);
        throw error;
      }
    },

    // CREATE - Criar novo item
    create: async (data) => {
      try {
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
      } catch (error) {
        console.error(`[MockDataStore] Erro ao criar ${entityName}:`, error);
        throw error;
      }
    },

    // BULK CREATE - Criar múltiplos itens
    bulkCreate: async (dataArray) => {
      try {
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
      } catch (error) {
        console.error(`[MockDataStore] Erro ao criar múltiplos ${entityName}:`, error);
        throw error;
      }
    },

    // UPDATE - Atualizar item existente
    update: async (id, data) => {
      try {
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
      } catch (error) {
        console.error(`[MockDataStore] Erro ao atualizar ${entityName} com id ${id}:`, error);
        throw error;
      }
    },

    // DELETE - Remover item
    delete: async (id) => {
      try {
        const items = getAll(entityName);
        const filteredItems = items.filter(item => item.id !== id);
        
        if (items.length === filteredItems.length) {
          throw new Error(`${entityName} com id ${id} não encontrado`);
        }
        
        saveAll(entityName, filteredItems);
        
        return { success: true, id };
      } catch (error) {
        console.error(`[MockDataStore] Erro ao deletar ${entityName} com id ${id}:`, error);
        throw error;
      }
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
