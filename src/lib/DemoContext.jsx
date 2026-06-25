import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44, isDemoMode } from '@/api/base44Client';
import { clearMockData, seedMockData } from '@/api/mockDataStore';
import { clearAll } from '@/services/storage';

const DemoContext = createContext(null);
const SESSION_KEY = 'tmgestpro_demo_v5_session';

const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
    sessionId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export function DemoProvider({ children }) {
  const [demoSessionId, setDemoSessionId] = useState(getOrCreateSessionId);
  const [demoCounts, setDemoCounts] = useState({ orcamento: 0, nota_servico: 0, loading: true });

  const loadCounts = async () => {
  try {
    let allBudgets = [];

    try {
      const result = await base44.entities.Budget.list();
      allBudgets = Array.isArray(result) ? result : [];
    } catch (err) {
      console.error('Erro ao listar documentos:', err);
      allBudgets = [];
    }

    const budgets = allBudgets.filter(
      b => String(b.demo_session_id) === String(demoSessionId)
    );

    setDemoCounts({
      orcamento: budgets.filter(b => b.doc_type === 'orcamento').length,
      nota_servico: budgets.filter(b => b.doc_type === 'nota_servico').length,
      loading: false
    });

  } catch (e) {
    console.error(e);

    setDemoCounts({
      orcamento: 0,
      nota_servico: 0,
      loading: false
    });
  }
};

  useEffect(() => {
    loadCounts();
  }, [demoSessionId]);

  const reloadSession = () => {
    const newId = getOrCreateSessionId();
    setDemoSessionId(newId);
  };

  const resetDemoData = async () => {
    try {
      console.log('[DemoContext] Iniciando limpeza TOTAL do localStorage...');
      
      // Limpa COMPLETAMENTE o localStorage para garantir que a demo fica 100% limpa
      localStorage.clear();
      
      console.log('[DemoContext] localStorage completamente limpo. Redirecionando...');
      
      // Redireciona para a página inicial
      window.location.href = '/';
    } catch (e) {
      console.error('[DemoContext] Erro ao limpar dados:', e);
      // Mesmo em caso de erro, força limpeza total e recarrega
      try {
        localStorage.clear();
      } catch (clearError) {
        console.error('[DemoContext] Falha crítica ao limpar localStorage:', clearError);
      }
      window.location.reload();
    }
  };

  const value = {
    demoSessionId,
    demoCounts,
    canCreateDocument: (type) => {
  const list = base44.entities.Budget.list?.() || [];

  // se for async, isto pode vir de query (ver abaixo)
  const count = Array.isArray(list)
    ? list.filter(d =>
        String(d.demo_session_id) === String(demoSessionId) &&
        d.doc_type === type
      ).length
    : 0;

  return count < 2;
},
    incrementCount: (type) => {
      setDemoCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));
    },
    resetDemoData,
    reloadSession,
    base44: base44
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
};


















