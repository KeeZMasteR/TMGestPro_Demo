# 🎭 Modo Demo - TMGestPro

Este repositório está configurado para funcionar **autonomamente** sem dependência da Base44 em produção.

## Como Funciona

O modo demo intercepta todas as chamadas ao `@base44/sdk` e redireciona para um sistema de armazenamento mock local baseado em `localStorage`.

### Arquitetura

```
┌─────────────────┐
│  Componentes    │
│   React         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  base44Client   │ ◄─── Ponto de entrada
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│ SDK  │  │   Mock   │
│ Real │  │  Store   │
└──────┘  └──────────┘
```

## Ativação do Modo Demo

### 1. Configure a variável de ambiente

Crie ou edite o arquivo `.env.local`:

```bash
VITE_IS_DEMO=true
```

### 2. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Você verá no console:
```
🎭 [DEMO MODE] Aplicação em modo demonstração - Usando dados mock locais
```

## Arquivos Principais

### `/src/api/mockDataStore.js`
- Sistema completo de armazenamento mock
- Simula todas as operações CRUD (Create, Read, Update, Delete)
- Implementa ordenação, filtros e bulk operations
- Usa `localStorage` para persistência entre sessões

### `/src/api/base44Client.js`
- Interceptor que decide entre SDK real ou mock
- Detecta `VITE_IS_DEMO` automaticamente
- Inicializa dados de exemplo na primeira execução

### `/src/lib/DemoContext.jsx`
- Gerencia sessões de demonstração
- Controla limites de documentos demo
- Suporta reset de dados mock

## Dados Mock Incluídos

Ao iniciar em modo demo pela primeira vez, são criados automaticamente:

### Clientes
- João Silva (Lisboa)
- Maria Santos (Porto)

### Perfil da Empresa
- TMGestPro Demo
- Configurações padrão (IVA 23%, validade 15 dias)

### Itens de Preço
- Pedreiro (Mão de Obra - 25€/h)
- Telha Cerâmica (Material - 15€/m²)

## Operações Suportadas

Todas as operações do SDK são suportadas no modo mock:

```javascript
// LIST
await base44.entities.Budget.list('-created_date', 100);

// FILTER
await base44.entities.Client.filter({ city: 'Lisboa' });

// GET
await base44.entities.Budget.get('id_123');

// CREATE
await base44.entities.Client.create({ name: 'Novo Cliente', ... });

// UPDATE
await base44.entities.Budget.update('id_123', { status: 'aceite' });

// DELETE
await base44.entities.Client.delete('id_123');

// BULK CREATE
await base44.entities.PriceItem.bulkCreate([...]);
```

## Integrações Mock

### Upload de Ficheiros
O upload de ficheiros converte o arquivo para base64 (data URL):

```javascript
const result = await base44.integrations.Core.UploadFile({ file });
// result.file_url = "data:image/png;base64,..."
```

### Autenticação
Sempre retorna um utilizador demo:

```javascript
const user = await base44.auth.me();
// { id: 'demo_user', email: 'demo@tmgestpro.com', name: 'Demo User' }
```

## Gestão de Dados

### Ver dados armazenados
Abra o DevTools (F12) > Application > Local Storage > `localhost`

Procure por chaves com prefixo `tmgestpro_mock_`:
- `tmgestpro_mock_Budget`
- `tmgestpro_mock_Client`
- `tmgestpro_mock_PriceItem`
- etc.

### Limpar todos os dados mock

No console do browser:

```javascript
// Importar função
import { clearMockData } from './src/api/mockDataStore.js';

// Limpar tudo
clearMockData();

// Recarregar a página
location.reload();
```

Ou use o botão "Limpar Dados Demo" na interface (se disponível).

## Desenvolvimento

### Adicionar nova entidade

1. Crie o schema em `base44/entities/NovaEntidade.jsonc`

2. Adicione ao mock em `mockDataStore.js`:

```javascript
const entities = {
  // ... entidades existentes
  NovaEntidade: createMockEntity('NovaEntidade'),
};
```

3. (Opcional) Adicione dados seed em `seedMockData()`:

```javascript
const mockNovaEntidade = [
  { id: 'example_1', campo: 'valor', ... }
];
saveAll('NovaEntidade', mockNovaEntidade);
```

### Adicionar nova integração

Em `mockDataStore.js`, adicione ao objeto `integrations`:

```javascript
integrations: {
  Core: { ... },
  NovaIntegracao: {
    metodo: async (params) => {
      // Lógica mock
      return { resultado: 'mock' };
    }
  }
}
```

## Desativar Modo Demo

Para voltar a usar a Base44 real:

1. Edite `.env.local`:
```bash
VITE_IS_DEMO=false
```

2. Reinicie o servidor:
```bash
npm run dev
```

## Troubleshooting

### "Dados não aparecem"
- Verifique se `VITE_IS_DEMO=true` está em `.env.local`
- Reinicie o servidor de desenvolvimento
- Verifique o console para a mensagem: `🎭 [DEMO MODE]`

### "Dados desaparecem ao recarregar"
- O mock usa localStorage, que persiste automaticamente
- Se limpar o cache do browser, os dados serão perdidos
- Use o seed para recriar dados iniciais

### "Erros de autenticação"
- Em modo demo, a autenticação é sempre bem-sucedida
- Não há validação de JWT
- Todos os endpoints são acessíveis

## Vantagens do Modo Demo

✅ **Autonomia total** - Funciona sem internet ou servidor Base44  
✅ **Demonstrações offline** - Perfeito para apresentações  
✅ **Desenvolvimento rápido** - Sem latência de rede  
✅ **Testes isolados** - Dados controlados e previsíveis  
✅ **Sem custos** - Não consome recursos de produção  
✅ **Fácil reset** - Limpa e reinicia dados instantaneamente  

## Limitações

⚠️ **Apenas localStorage** - Dados limitados a ~5-10MB  
⚠️ **Sem sincronização** - Dados são locais ao browser  
⚠️ **Sem validação complexa** - Schema validation simplificada  
⚠️ **Upload básico** - Arquivos convertidos para base64  
⚠️ **Sem relacionamentos** - Foreign keys não são validadas  

## Produção

Para deploy em produção sem Base44:

1. Configure `VITE_IS_DEMO=true` no servidor
2. Build da aplicação:
   ```bash
   npm run build
   ```
3. Sirva a pasta `dist/` em qualquer servidor estático
4. A aplicação funcionará 100% no cliente

---

**Criado para**: Demonstração autônoma do TMGestPro  
**Versão**: 1.0.0  
**Data**: Janeiro 2026
