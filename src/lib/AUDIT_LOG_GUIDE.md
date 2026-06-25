# Auditoria de Fluxo de Line Items — Guia de Validação

## 🔍 Propósito

Este guia documenta o fluxo completo de carregamento, edição e persistência de items em Orçamentos e Notas de Serviço para garantir total consistência entre UI e BD.

---

## 📋 Fluxo Esperado (LOAD → EDIT → SAVE)

### 1️⃣ LOAD (Carregamento da BD para a UI)

**Onde ocorre:**
- `BudgetDetail.startEdit()` — Linha ~119
- `NewBudget.handleSave()` — Faz parte do formulário existente
- `NewServiceNote.buildDoc()` — Faz parte do formulário existente

**O que deve acontecer:**
```
BD (items[]) → sem transformação → estado local (editForm.items ou form.items)
```

**Logs esperados no console:**
```
[AUDIT-LOAD] BudgetDetail #ORÇ001: 5 items carregados da BD [...]
```

**Validação:**
- ✅ Items vêm diretamente da BD sem `hydrateItems` ou mapping
- ✅ Nenhuma transformação de schema
- ✅ Estado local = estado da BD (inicialmente)
- ❌ Não deve haver `normalizeType`, `serializeItems` ou similares

---

### 2️⃣ EDIT (Edição no LineItemEditor)

**Onde ocorre:**
- `LineItemEditor` — componente que gerencia estado local puro

**O que deve acontecer:**
```
Estado local (items) → useEffect/onChange → estado local atualizado
```

**Logs esperados no console:**
```
[AUDIT-EDITOR] LineItemEditor renderizado com 5 items [...]
[AUDIT-EDIT] Item atualizado no índice 0, total de items agora: 5 [...]
[AUDIT-EDIT] Novo item adicionado (Prestação de Serviços), total agora: 6 [...]
[AUDIT-EDIT] Item removido no índice 2, total de items agora: 5 [...]
```

**Validação:**
- ✅ Edições refletem imediatamente no estado local
- ✅ Nenhum reset automático via `useEffect`
- ✅ Nenhuma sincronização paralela com múltiplos estados
- ❌ Não deve haver `setItems([])` ou reset durante edição

---

### 3️⃣ SAVE (Persistência na BD)

**Onde ocorre:**
- `BudgetDetail.handleSave()` — Linha ~129
- `NewBudget.handleSave()` — Linha ~46
- `NewServiceNote.buildDoc()` → `handleSave()` — Linha ~91

**O que deve acontecer:**
```
Estado local (editForm.items ou form.items) 
  → prepareItemsForSave() 
  → .map(serializeLineItem) 
  → items: [...] (substituição total, não merge)
  → base44.entities.Budget.update/create()
```

**Logs esperados no console:**
```
[AUDIT-STATE] BudgetDetail editor antes de save: 5 items [...]
[AUDIT-PREPARED] Após prepareItemsForSave: 5 items [...]
[AUDIT-SAVE] Guardando 5 items na BD (substituição total, não merge) [...]
```

**Validação:**
- ✅ Nenhuma concatenação com dados antigos (`[...old, ...new]`)
- ✅ Nenhum merge de arrays
- ✅ `items` é substituído completamente (não append)
- ✅ Schema canónico: `{type, name, description, unit, quantity, unitPrice, total, isNocturno, isOptional, subRows}`
- ❌ Não deve haver `spread de items antigos` ou `concat`

---

## 🐛 Problemas Detectados & Soluções

### ❌ Problema 1: Items vazios ao abrir documento
**Causa:** Transformação durante LOAD (hydrateItems no load)
**Solução:** Remover qualquer transformação no startEdit, carregar raw items direto da BD
**Status:** ✅ CORRIGIDO

### ❌ Problema 2: Duplicação de items ao guardar
**Causa:** Merge/concat de arrays antigos com novos no SAVE
**Solução:** Substituir completamente via `items.map()` sem concatenação
**Status:** ✅ CORRIGIDO

### ❌ Problema 3: Resets inesperados durante edição
**Causa:** useEffect que reinicializa items ou sincroniza com estado paralelo
**Solução:** Estado local = fonte única, sem sincronização paralela
**Status:** ✅ VERIFICADO (não encontrado)

---

## 📊 Checklist de Validação

### LOAD
- [ ] Items carregados diretamente da BD (`budget.items || []`)
- [ ] Log `[AUDIT-LOAD]` aparece no console
- [ ] Nenhuma transformação visível

### EDIT
- [ ] Cada mudança gera log `[AUDIT-EDIT]`
- [ ] Quantidade de items aumenta/diminui conforme esperado
- [ ] Edições são refletidas imediatamente na UI

### SAVE
- [ ] Log `[AUDIT-STATE]` mostra número exato de items antes de save
- [ ] Log `[AUDIT-PREPARED]` mostra número idêntico após prepareItemsForSave
- [ ] Log `[AUDIT-SAVE]` confirma substituição total
- [ ] Documento recarregado mostra exatamente os items salvos

---

## 🔧 Como Usar Esta Auditoria

### 1. Abra a consola do navegador (F12)
### 2. Filtre por `AUDIT-` para ver apenas logs relevantes
### 3. Siga o fluxo:
   - `[AUDIT-LOAD]` → BD para UI
   - `[AUDIT-EDIT]` → Alterações locais
   - `[AUDIT-STATE]` → Estado antes de save
   - `[AUDIT-PREPARED]` → Validação de items
   - `[AUDIT-SAVE]` → Confirmação de persistência

### 4. Recarregue o documento
### 5. Verifique que `[AUDIT-LOAD]` mostra os items salvos

---

## ✅ Resultado Esperado Final

Após implementação completa:

```
[AUDIT-LOAD] BudgetDetail #ORÇ001: 5 items carregados da BD
[AUDIT-EDITOR] LineItemEditor renderizado com 5 items
[AUDIT-EDIT] Item atualizado no índice 0...
[AUDIT-EDIT] Novo item adicionado...
[AUDIT-STATE] BudgetDetail editor antes de save: 6 items
[AUDIT-PREPARED] Após prepareItemsForSave: 6 items
[AUDIT-SAVE] Guardando 6 items na BD (substituição total, não merge)
(documento salvo com sucesso)
[AUDIT-LOAD] BudgetDetail #ORÇ001: 6 items carregados da BD
```

---

## 🚀 Próximos Passos

1. Testar cada fluxo (NewBudget, NewServiceNote, BudgetDetail EDIT)
2. Verificar logs no console
3. Validar que número de items é consistente ao longo do fluxo
4. Recarregar documento e confirmar persistência
5. Remover logs após validação bem-sucedida (comentar ou manter para produção)