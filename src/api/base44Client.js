import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { createMockClient, seedMockData } from './mockDataStore';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Verifica se está em modo DEMO
const IS_DEMO_MODE = import.meta.env.VITE_IS_DEMO === 'true';

// Log do modo ativo
if (IS_DEMO_MODE) {
  console.log('🎭 [DEMO MODE] Aplicação em modo demonstração - Usando dados mock locais');
  // Inicializa dados de demonstração se necessário
  seedMockData();
}

// Exporta o cliente apropriado baseado no modo
export const base44 = IS_DEMO_MODE
  ? createMockClient()
  : createClient({
      appId,
      token,
      functionsVersion: functionsVersion || 'prod',
      serverUrl: undefined,
      requiresAuth: false,
      appBaseUrl
    });

// Exporta flag de modo demo para uso em componentes
export const isDemoMode = IS_DEMO_MODE;





