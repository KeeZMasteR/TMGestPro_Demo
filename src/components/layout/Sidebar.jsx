import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FilePlus, History, Settings, ClipboardList, BarChart3, Receipt, ShieldCheck, MailCheck, Calendar, Lock, LogOut } from 'lucide-react';
import { useDemo } from '@/lib/DemoContext';

const navItems = [
  { label: 'Painel', icon: LayoutDashboard, path: '/' },
  { label: 'Clientes', icon: Users, path: '/clientes' },
  { label: 'Novo Orçamento', icon: FilePlus, path: '/novo-orcamento' },
  { label: 'Nova Nota de Serviço', icon: ClipboardList, path: '/nova-nota-servico' },
  { label: 'Histórico', icon: History, path: '/historico' },
  { label: 'Agenda', icon: Calendar, path: '/agenda' },
  { label: 'Relatórios', icon: BarChart3, path: '/relatorios' },
  { label: 'Emissão de Faturas', icon: Receipt, path: '/emissao-faturas', locked: true },
  { label: 'Email de Faturação', icon: MailCheck, path: '/email-fatura', locked: true },
  { label: 'Segurança Social', icon: ShieldCheck, path: '/seguranca-social', locked: true },
  { label: 'Configurações', icon: Settings, path: '/configuracoes' },
];

export default function Sidebar() {
  const location = useLocation();
  const { resetDemoData } = useDemo();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src="https://media.base44.com/images/public/69e7cf65e769dab3c40900be/23c86cf05_ChatGPTImageApr25202608_44_25PM.png" 
            alt="TMGestPro" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="font-heading font-bold text-white text-lg leading-tight">TMGestPro</h1>
            <p className="text-xs text-sidebar-foreground/60">Versão Demo</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item ) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              } ${item.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {item.locked && <Lock className="w-3 h-3 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Botão de Terminar */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={resetDemoData}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Terminar Demonstração
        </button>
      </div>
    </aside>
  );
}
