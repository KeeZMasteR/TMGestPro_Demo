# 🚀 Quick Start - TMGestPro Demo

## Setup Rápido (3 passos)

### 1. Instalar dependências
```bash
npm install
```

### 2. Modo Demo está ativo por padrão
O arquivo `.env.local` já está configurado com:
```
VITE_IS_DEMO=true
```

### 3. Iniciar a aplicação
```bash
npm run dev
```

Abra o browser em `http://localhost:5173` (ou a porta indicada no terminal).

## ✅ Verificação

Se tudo estiver correto, você verá no console do browser:

```
🎭 [DEMO MODE] Aplicação em modo demonstração - Usando dados mock locais
[DEMO MODE] Inicializando dados de demonstração...
[DEMO MODE] Dados de demonstração criados com sucesso!
```

## 🎯 Primeiros Passos

### 1. Dashboard
Acesse a página inicial para ver o resumo da aplicação.

### 2. Criar Cliente
- Vá para "Clientes"
- Clique em "Novo Cliente"
- Preencha os dados e salve
- Os dados serão salvos no localStorage

### 3. Criar Orçamento
- Vá para "Novo Orçamento"
- Selecione um cliente
- Adicione itens de serviço
- Salve o orçamento

### 4. Ver Dados Mock
Abra DevTools (F12) > Application > Local Storage > localhost
Procure por chaves `tmgestpro_mock_*`

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint do código
npm run lint

# Fix de lint
npm run lint:fix
```

## 📦 Dados Incluídos

Ao iniciar pela primeira vez, são criados:

**2 Clientes de exemplo:**
- João Silva (Lisboa)
- Maria Santos (Porto)

**1 Perfil de Empresa:**
- TMGestPro Demo

**2 Itens de Preço:**
- Pedreiro (25€/h)
- Telha Cerâmica (15€/m²)

## 🎭 Modo Demo vs Produção

### Modo Demo (Atual)
- ✅ Funciona offline
- ✅ Dados locais (localStorage)
- ✅ Sem autenticação JWT
- ✅ Perfeito para demonstrações

### Modo Produção (Base44)
Para usar com Base44 real:

1. Edite `.env.local`:
   ```bash
   VITE_IS_DEMO=false
   ```

2. Configure as variáveis da Base44 (se necessário)

3. Reinicie: `npm run dev`

## ❓ Problemas?

### A aplicação não inicia
```bash
# Limpe node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Dados não aparecem
1. Verifique se `VITE_IS_DEMO=true` em `.env.local`
2. Verifique o console do browser para erros
3. Limpe localStorage e recarregue

### Erro ao salvar dados
1. Verifique se localStorage está disponível
2. Verifique se não ultrapassou o limite (~5MB)
3. Use modo privado do browser para testar

## 📚 Documentação Completa

- [DEMO_MODE.md](./DEMO_MODE.md) - Documentação completa do modo demo
- [README.md](./README.md) - Informações gerais do projeto

## 🆘 Suporte

Para mais informações sobre o modo demo, consulte `DEMO_MODE.md`.
