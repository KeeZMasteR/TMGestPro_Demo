import React from 'react';
import { ShieldX, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">
            O teu email não está autorizado a aceder a esta aplicação.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Contacta o administrador para solicitar acesso.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </div>
    </div>
  );
}