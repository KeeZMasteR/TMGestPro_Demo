import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ShieldAlert } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        {/* Banner de Privacidade e Segurança */}
        <div className="bg-amber-50 border-b border-amber-100 px-8 py-2 flex items-center gap-3 text-amber-800 text-xs font-medium">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Sessão Isolada: Os seus dados são privados e serão eliminados permanentemente ao fechar o navegador ou terminar a demonstração.</span>
        </div>
        
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
