import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { DemoProvider } from '@/lib/DemoContext';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import NewBudget from '@/pages/NewBudget';
import BudgetHistory from '@/pages/BudgetHistory';
import BudgetDetail from '@/pages/BudgetDetail';
import Settings from '@/pages/Settings';
import NewServiceNote from '@/pages/NewServiceNote';
import Reports from '@/pages/Reports';
import Schedule from '@/pages/Schedule';
import FeatureLocked from '@/pages/FeatureLocked';
import DocumentLimitReached from '@/pages/DocumentLimitReached';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="novo-orcamento" element={<NewBudget />} />
        <Route path="historico" element={<BudgetHistory />} />
        
        {/* Detalhes de Documentos */}
        <Route path="orcamento/:id" element={<BudgetDetail />} />
        <Route path="nota-servico/:id" element={<BudgetDetail />} />
        
        <Route path="agenda" element={<Schedule />} />
        <Route path="configuracoes" element={<Settings />} />
        <Route path="relatorios" element={<Reports />} />
        
        <Route path="emissao-faturas" element={<FeatureLocked />} />
        <Route path="email-fatura" element={<FeatureLocked />} />
        <Route path="seguranca-social" element={<FeatureLocked />} />
        
        <Route path="nova-nota-servico" element={<NewServiceNote />} />
        <Route path="document-limit-reached/:type" element={<DocumentLimitReached />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <DemoProvider>
            <AuthenticatedApp />
            <Toaster />
            <SonnerToaster />
          </DemoProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App
