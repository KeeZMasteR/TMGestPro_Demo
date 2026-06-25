import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ALLOWED_EMAILS } from '@/lib/pricelist';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-500">A verificar acesso...</p>
    </div>
  </div>
);

export default function ProtectedRoute({
  fallback = <DefaultFallback />,
  unauthenticatedElement,
}) {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    authError,
    checkUserAuth,
  } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  // 1. ESTADO DE CARREGAMENTO
  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  // 2. ERRO DE UTILIZADOR NÃO REGISTADO (Base44)
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // 3. SE NÃO ESTIVER AUTENTICADO
  if (!isAuthenticated) {
    return unauthenticatedElement || <Navigate to="/login" replace />;
  }

  // 4. VERIFICAÇÃO DE EMAIL (VERSÃO RELAXADA PARA EVITAR BLOQUEIOS FALSOS)
  if (user && user.email) {
    const userEmail = user.email.toLowerCase().trim();
    const isAllowed = ALLOWED_EMAILS.some(email => 
      email.toLowerCase().trim() === userEmail
    );

    // Só bloqueia se tivermos a certeza absoluta que o email NÃO está na lista
    // Se o email for de administrador (telmo), deixamos passar sempre
    const isAdmin = userEmail.includes('telmo.a.marcalo');

    if (!isAllowed && !isAdmin) {
      console.warn("Acesso negado para:", userEmail);
      return <Navigate to="/access-denied" replace />;
    }
  }

  // 5. TUDO OK
  return <Outlet />;
}
