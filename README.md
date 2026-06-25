# 🎭 TMGestPro - Demo Autónoma

**Aplicação de Gestão de Orçamentos e Serviços**

Esta é uma versão **demo autónoma** do TMGestPro que funciona **sem conexão** com servidor externo.

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em modo demo (já configurado)
npm run dev
```

➡️ **Ver**: [QUICK_START.md](./QUICK_START.md) para guia detalhado

---

## 🎯 Modos de Operação

### 🎭 Modo Demo (Padrão)
- ✅ **Autonomia total** - Funciona offline
- ✅ **Dados locais** - Armazenados no localStorage
- ✅ **Sem autenticação** - Acesso direto
- ✅ **Perfeito para demonstrações**

Configurado em `.env.local`:
```bash
VITE_IS_DEMO=true
```

### 🌐 Modo Produção (Base44)
- Conecta ao backend Base44
- Requer autenticação JWT
- Dados persistidos no Supabase

Para ativar, edite `.env.local`:
```bash
VITE_IS_DEMO=false
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [QUICK_START.md](./QUICK_START.md) | Setup rápido em 3 passos |
| [DEMO_MODE.md](./DEMO_MODE.md) | Documentação completa do modo demo |
| [src/PUBLIC_APP_SETUP.md](./src/PUBLIC_APP_SETUP.md) | Configuração para app pública |

---

## 🏗️ Estrutura do Projeto

```
tmgestpro-demo/
├── src/
│   ├── api/
│   │   ├── base44Client.js      # Cliente SDK (real ou mock)
│   │   └── mockDataStore.js     # Sistema de armazenamento mock
│   ├── components/              # Componentes React
│   ├── pages/                   # Páginas da aplicação
│   ├── lib/                     # Utilitários e contextos
│   └── hooks/                   # Custom hooks
├── base44/
│   └── entities/                # Schemas das entidades
├── .env.local                   # Configuração do modo demo
├── DEMO_MODE.md                 # Documentação do modo demo
└── QUICK_START.md              # Guia de início rápido
```

---

## 🛠️ Funcionalidades

### ✅ Implementadas
- 📊 Dashboard com estatísticas
- 👥 Gestão de clientes
- 📋 Criação de orçamentos
- 📝 Notas de serviço
- 💰 Catálogo de preços
- ⚙️ Configurações da empresa
- 📅 Agenda de trabalhos
- 📊 Relatórios
- 🎭 **Modo demo offline**

### 🔒 Bloqueadas em Demo
- 💳 Emissão de faturas
- 📧 Envio de emails
- 🏛️ Integração Segurança Social

---

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Produção
npm run build            # Build para produção
npm run preview          # Preview do build

# Qualidade de código
npm run lint             # Verificar código
npm run lint:fix         # Corrigir automaticamente
npm run typecheck        # Verificar tipos TypeScript
```

---

## 🎨 Tecnologias

- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **UI**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **Backend (Demo)**: localStorage
- **Backend (Produção)**: Base44 + Supabase

---

## 📦 Dados de Demonstração

Ao iniciar em modo demo, são criados automaticamente:

### Clientes
- João Silva (Lisboa)
- Maria Santos (Porto)

### Perfil da Empresa
- TMGestPro Demo
- Configurações padrão

### Itens de Preço
- Pedreiro (25€/h)
- Telha Cerâmica (15€/m²)

---

## 🐛 Troubleshooting

### Aplicação não inicia
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Dados não aparecem
1. Verifique `VITE_IS_DEMO=true` em `.env.local`
2. Abra DevTools e veja o console
3. Verifique localStorage (F12 > Application > Local Storage)

### Erros de build
```bash
npm run typecheck  # Verificar erros de tipo
npm run lint       # Verificar problemas de código
```

---

## 📋 Requisitos do Sistema

- **Node.js**: 18.x ou superior
- **npm**: 9.x ou superior
- **Browser**: Chrome, Firefox, Safari, Edge (últimas versões)

---

## 🔐 Segurança

**⚠️ IMPORTANTE**: Esta é uma aplicação DEMO

- Não usar em produção com dados reais
- Dados armazenados em localStorage (não criptografados)
- Sem autenticação em modo demo
- Perfeito para demonstrações e testes

---

## 📄 Licença

Este projeto é uma demonstração do TMGestPro.

---

## 🆘 Suporte

Para dúvidas sobre o modo demo, consulte:
- [DEMO_MODE.md](./DEMO_MODE.md) - Documentação completa
- [QUICK_START.md](./QUICK_START.md) - Guia rápido

Para suporte Base44 (modo produção):
- Documentação: [https://docs.base44.com](https://docs.base44.com)
- Support: [https://app.base44.com/support](https://app.base44.com/support)

---

**Versão**: 1.0.0 (Demo Autónoma)  
**Última Atualização**: Janeiro 2026
