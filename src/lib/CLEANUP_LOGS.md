# 🧹 Instruções para Limpeza de Logs de Auditoria

Após validação bem-sucedida, você pode remover ou reduzir os logs de auditoria.

---

## Opção 1: Manter Logs (Recomendado para Produção Inicial)

Os logs estão em `console.log()` e **não impactam performance**.

**Benefícios:**
- Rastreabilidade contínua
- Fácil debugging em caso de problemas
- Sem custo de performance

**Como usar:**
- F12 → Console
- Filtro: `AUDIT-`
- Vê fluxo completo

---

## Opção 2: Converter para console.debug()

**Modificação:**
```javascript
// Antes:
console.log(`[AUDIT-LOAD] ...`)

// Depois:
console.debug(`[AUDIT-LOAD] ...`)
```

**Benefício:** Logs ocultos por padrão (mostrados apenas em DevTools com "Verbose")

**Como fazer:**
1. Em cada arquivo, substituir `console.log('[AUDIT-` por `console.debug('[AUDIT-`
2. Arquivos afetados:
   - `pages/BudgetDetail.js` — 3 ocorrências
   - `pages/NewBudget.js` — 3 ocorrências
   - `pages/NewServiceNote.js` — 3 ocorrências
   - `components/budget/LineItemEditor.js` — 5 ocorrências

---

## Opção 3: Remover Logs Completamente

**Quando:**
- Após múltiplos testes bem-sucedidos
- Em produção "stable"
- Apenas se tiver confiança no código

**Como fazer:**

### BudgetDetail.js
```javascript
// REMOVER estas linhas:
console.log(`[AUDIT-LOAD] BudgetDetail #${budget.budget_number}: ${loadedItems.length} items carregados da BD`, loadedItems);
console.log(`[AUDIT-STATE] BudgetDetail editor antes de save: ${editForm.items.length} items`, editForm.items);
console.log(`[AUDIT-PREPARED] Após prepareItemsForSave: ${readyItems.length} items`, readyItems);
console.log(`[AUDIT-SAVE] Guardando ${itemsToSave.length} items na BD (substituição total, não merge)`, itemsToSave);
```

### NewBudget.js
```javascript
// REMOVER estas linhas:
console.log(`[AUDIT-STATE] NewBudget editor: ${form.items.length} items antes de save`, form.items);
console.log(`[AUDIT-PREPARED] Após prepareItemsForSave: ${readyItems.length} items`, readyItems);
console.log(`[AUDIT-SAVE] Guardando novo orçamento com ${itemsToSave.length} items`, itemsToSave);
```

### NewServiceNote.js
```javascript
// REMOVER estas linhas:
console.log(`[AUDIT-STATE] NewServiceNote editor: ${form.items.length} items`, form.items);
console.log(`[AUDIT-PREPARED] Após prepareItemsForSave: ${readyItems.length} items`, readyItems);
if (!isExistingDoc) {
  console.log(`[AUDIT-SAVE] Guardando nova nota de serviço com ${itemsToSave.length} items`, itemsToSave);
}
```

### LineItemEditor.js
```javascript
// REMOVER estas linhas:
console.log(`[AUDIT-EDITOR] LineItemEditor renderizado com ${items.length} items`, items);
console.log(`[AUDIT-EDIT] Item atualizado no índice ${idx}, total de items agora: ${next.length}`, next);
console.log(`[AUDIT-EDIT] Item removido no índice ${idx}, total de items agora: ${next.length}`, next);
console.log(`[AUDIT-EDIT] Novo item adicionado (${type}), total agora: ${next.length}`, next);
```

---

## Opção 4: Criar Utilitário de Toggle de Logs

**Arquivo:** `lib/auditToggle.js`

```javascript
// Toggle para ativar/desativar logs de auditoria
const AUDIT_ENABLED = process.env.DEBUG_AUDIT === 'true' || localStorage.getItem('DEBUG_AUDIT') === 'true';

export function auditLog(message, data) {
  if (AUDIT_ENABLED) {
    console.log(message, data);
  }
}

// Uso:
// auditLog('[AUDIT-LOAD] ...', data);

// Ativar no console:
// localStorage.setItem('DEBUG_AUDIT', 'true'); location.reload();

// Desativar:
// localStorage.removeItem('DEBUG_AUDIT'); location.reload();
```

**Como usar:**
1. Substitua todos `console.log` por `auditLog`
2. Para ativar logs em produção: abra console e execute
   ```javascript
   localStorage.setItem('DEBUG_AUDIT', 'true');
   location.reload();
   ```

---

## ✅ Checklist de Limpeza

- [ ] Decidir estratégia (manter, debug, remover, toggle)
- [ ] Se remover: backup dos arquivos com logs
- [ ] Se debug: testar que logs aparecem em DevTools
- [ ] Se toggle: testar ativação/desativação
- [ ] Testar fluxo completo após mudança
- [ ] Documentar escolha para futuro

---

## 🎯 Recomendação

**Para Produção:**
→ **Opção 4 (Toggle)** — Oferece melhor custo-benefício

- Logs ocultos por padrão
- Disponível para debugging quando necessário
- Zero impacto de performance
- Ativação simples

---

## 📞 Se Problemas Reaparecerem

Se houver regressão (items vazios, duplicação, etc.):

1. Ativar logs: `localStorage.setItem('DEBUG_AUDIT', 'true'); location.reload();`
2. Reproduzir operação
3. Consultar console com filtro `AUDIT-`
4. Usar `lib/AUDIT_LOG_GUIDE.md` para interpretar logs
5. Contactar desenvolvimento com screenshot dos logs