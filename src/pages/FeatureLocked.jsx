import React from 'react';
import { Lock, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function FeatureLocked() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-heading font-bold text-foreground">Funcionalidade Bloqueada</h1>
        <p className="text-muted-foreground text-sm mt-1">Disponível apenas na versão completa</p>
      </div>

      <Card className="border-0 shadow-md p-8 max-w-md w-full text-center space-y-4 bg-gradient-to-br from-muted/50 to-muted/30">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Esta funcionalidade está disponível apenas na versão paga.
          </p>
          <p className="text-xs text-muted-foreground">
            Adquira a licença completa para desbloquear todas as funcionalidades.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium">
          <Key className="w-4 h-4" />
          <span>Acesso no plano pago</span>
        </div>
      </Card>
    </div>
  );
}