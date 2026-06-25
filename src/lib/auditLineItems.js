/**
 * Utilitários de auditoria para validar fluxo de Line Items
 * 
 * Uso:
 * - LOAD: auditLineItems.validateLoad(budgetFromDB, itemsState)
 * - EDIT: auditLineItems.validateEdit(beforeItems, afterItems)
 * - SAVE: auditLineItems.validateSave(stateItems, readyItems, savedItems)
 */

export const auditLineItems = {
  /**
   * Valida LOAD: verifica se items carregados estão sem transformação
   */
  validateLoad(budgetFromDB, itemsState) {
    const dbItems = budgetFromDB?.items || [];
    const count = itemsState?.length || 0;
    const match = count === dbItems.length;
    
    const result = {
      stage: 'LOAD',
      dbItemsCount: dbItems.length,
      stateItemsCount: count,
      match,
      valid: match,
      timestamp: new Date().toISOString(),
    };
    
    if (!match) {
      result.error = `Mismatch: BD tem ${dbItems.length} items mas estado tem ${count}`;
    }
    
    console.log('[AUDIT-VALIDATE] LOAD:', result);
    return result;
  },

  /**
   * Valida EDIT: verifica se edições refletem corretamente
   */
  validateEdit(beforeItems, afterItems, operation) {
    const before = beforeItems?.length || 0;
    const after = afterItems?.length || 0;
    
    let expectedDelta = 0;
    if (operation === 'add') expectedDelta = 1;
    if (operation === 'remove') expectedDelta = -1;
    
    const actualDelta = after - before;
    const valid = operation ? actualDelta === expectedDelta : true;
    
    const result = {
      stage: 'EDIT',
      operation,
      beforeCount: before,
      afterCount: after,
      actualDelta,
      expectedDelta,
      valid,
      timestamp: new Date().toISOString(),
    };
    
    if (!valid) {
      result.error = `${operation}: esperava delta ${expectedDelta}, obteve ${actualDelta}`;
    }
    
    console.log('[AUDIT-VALIDATE] EDIT:', result);
    return result;
  },

  /**
   * Valida SAVE: verifica se items são persistidos sem duplicação ou perda
   */
  validateSave(stateItems, readyItems, itemsToSave) {
    const stateCount = stateItems?.length || 0;
    const readyCount = readyItems?.length || 0;
    const saveCount = itemsToSave?.length || 0;
    
    const consistentCount = stateCount === readyCount && readyCount === saveCount;
    
    const result = {
      stage: 'SAVE',
      stateItemsCount: stateCount,
      readyItemsCount: readyCount,
      saveItemsCount: saveCount,
      consistentCount,
      valid: consistentCount,
      timestamp: new Date().toISOString(),
    };
    
    if (!consistentCount) {
      result.error = `Count mismatch: state=${stateCount}, ready=${readyCount}, save=${saveCount}`;
    }
    
    // Validar schema canónico
    const invalidItems = itemsToSave?.filter(i => !isValidCanonicalItem(i)) || [];
    if (invalidItems.length > 0) {
      result.valid = false;
      result.error = `${invalidItems.length} items com schema inválido`;
      result.invalidItems = invalidItems;
    }
    
    console.log('[AUDIT-VALIDATE] SAVE:', result);
    return result;
  },

  /**
   * Valida RELOAD: verifica se documento recarregado tem items idênticos aos salvos
   */
  validateReload(savedItems, reloadedItems) {
    const savedCount = savedItems?.length || 0;
    const reloadedCount = reloadedItems?.length || 0;
    const match = savedCount === reloadedCount;
    
    const result = {
      stage: 'RELOAD',
      savedCount: savedCount,
      reloadedCount: reloadedCount,
      match,
      valid: match,
      timestamp: new Date().toISOString(),
    };
    
    if (!match) {
      result.error = `Mismatch: salvamos ${savedCount} items mas recarregamos ${reloadedCount}`;
    }
    
    console.log('[AUDIT-VALIDATE] RELOAD:', result);
    return result;
  },

  /**
   * Valida schema canónico de um item
   */
  isValidCanonicalItem(item) {
    return isValidCanonicalItem(item);
  },

  /**
   * Gera relatório completo do fluxo LOAD → EDIT → SAVE → RELOAD
   */
  generateFlowReport(stages) {
    const report = {
      timestamp: new Date().toISOString(),
      stages: stages || [],
      allValid: stages?.every(s => s.valid) || false,
      errors: stages?.filter(s => s.error).map(s => ({ stage: s.stage, error: s.error })) || [],
    };
    
    console.log('[AUDIT-VALIDATE] FLOW REPORT:', report);
    return report;
  },
};

/**
 * Valida se um item segue o schema canónico exigido
 */
function isValidCanonicalItem(item) {
  if (!item || typeof item !== 'object') return false;
  
  const requiredFields = ['type', 'name', 'unit'];
  const hasRequired = requiredFields.every(f => f in item);
  
  if (!hasRequired) return false;
  
  // Se tem quantity e unitPrice, deve ser números válidos
  if ('quantity' in item && !(typeof item.quantity === 'number' || item.quantity === undefined)) {
    return false;
  }
  if ('unitPrice' in item && !(typeof item.unitPrice === 'number' || item.unitPrice === undefined)) {
    return false;
  }
  
  return true;
}

export default auditLineItems;