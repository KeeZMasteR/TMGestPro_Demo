/**
 * Serviço de Storage para persistência local de dados
 * Utiliza localStorage do navegador para manter dados da demonstração
 */

const STORAGE_PREFIX = 'tmgestpro_';

/**
 * Guarda dados no localStorage
 * @param {string} key - Chave para identificar os dados
 * @param {*} data - Dados a serem guardados (será convertido em JSON)
 * @returns {boolean} - True se guardado com sucesso, False caso contrário
 */
export const saveData = (key, data) => {
  try {
    const fullKey = STORAGE_PREFIX + key;
    const jsonData = JSON.stringify(data);
    localStorage.setItem(fullKey, jsonData);
    return true;
  } catch (error) {
    console.error(`[Storage] Erro ao guardar dados com chave "${key}":`, error);
    return false;
  }
};

/**
 * Lê dados do localStorage
 * @param {string} key - Chave dos dados a serem lidos
 * @param {*} defaultValue - Valor padrão caso não existam dados (default: null)
 * @returns {*} - Dados parseados ou valor padrão
 */
export const getData = (key, defaultValue = null) => {
  try {
    const fullKey = STORAGE_PREFIX + key;
    const data = localStorage.getItem(fullKey);
    
    if (data === null || data === undefined) {
      return defaultValue;
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error(`[Storage] Erro ao ler dados com chave "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Remove dados específicos do localStorage
 * @param {string} key - Chave dos dados a serem removidos
 * @returns {boolean} - True se removido com sucesso
 */
export const removeData = (key) => {
  try {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.removeItem(fullKey);
    return true;
  } catch (error) {
    console.error(`[Storage] Erro ao remover dados com chave "${key}":`, error);
    return false;
  }
};

/**
 * Limpa TODOS os dados da aplicação do localStorage
 * Remove apenas itens com o prefixo da aplicação
 * @returns {number} - Número de itens removidos
 */
export const clearAll = () => {
  try {
    let removedCount = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX) || key.startsWith('tmgestpro_mock_')) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });
    
    console.log(`[Storage] Limpeza completa: ${removedCount} itens removidos`);
    return removedCount;
  } catch (error) {
    console.error('[Storage] Erro ao limpar todos os dados:', error);
    return 0;
  }
};

/**
 * Limpa completamente o localStorage (remove TUDO, não apenas dados da app)
 * CUIDADO: Use apenas em situações específicas
 */
export const clearAllStorage = () => {
  try {
    localStorage.clear();
    console.log('[Storage] localStorage completamente limpo');
    return true;
  } catch (error) {
    console.error('[Storage] Erro ao limpar localStorage:', error);
    return false;
  }
};

/**
 * Verifica se existem dados guardados para uma chave específica
 * @param {string} key - Chave a verificar
 * @returns {boolean} - True se existem dados, False caso contrário
 */
export const hasData = (key) => {
  const fullKey = STORAGE_PREFIX + key;
  return localStorage.getItem(fullKey) !== null;
};

/**
 * Obtém todas as chaves guardadas pela aplicação
 * @returns {string[]} - Array com todas as chaves (sem prefixo)
 */
export const getAllKeys = () => {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  } catch (error) {
    console.error('[Storage] Erro ao obter todas as chaves:', error);
    return [];
  }
};

/**
 * Obtém o tamanho aproximado dos dados guardados em bytes
 * @returns {number} - Tamanho aproximado em bytes
 */
export const getStorageSize = () => {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const item = localStorage.getItem(key);
        size += key.length + (item?.length || 0);
      }
    });
    
    return size;
  } catch (error) {
    console.error('[Storage] Erro ao calcular tamanho do storage:', error);
    return 0;
  }
};

/**
 * Formata o tamanho em bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} - Tamanho formatado (ex: "1.5 MB")
 */
export const formatStorageSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default {
  saveData,
  getData,
  removeData,
  clearAll,
  clearAllStorage,
  hasData,
  getAllKeys,
  getStorageSize,
  formatStorageSize,
};
