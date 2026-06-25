import React from 'react';
import { AlertCircle, FileText, ClipboardList, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function DocumentLimitReached({ type }) {
  const navigate = useNavigate();

  const config = {
    orcamento: {
      title: 'Limite de Orçamentos Atingido',
      icon: FileText,
      message: 'Na versão de demonstração, pode criar apenas 2 orçamentos.',
    },
    nota_servico: {
      title: 'Limite de Notas de Serviço Atingido',
      icon: ClipboardList,
      message: 'Na versão de demonstração, pode criar apenas 2 notas de serviço.',
    },
  };

  const { title, icon: Icon, message } = config[type] || config.orcamento;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-amber-600" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-heading font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">Versão de Demonstração</p>
      </div>

      <Card className="border-0 shadow-md p-8 max-w-md w-full text-center space-y-4 bg-gradient-to-br from-amber-50/50 to-amber-50/30">
        <div className="space-y-2">
          <p className="text-sm text-amber-800 font-medium">{message}</p>
          <p className="text-xs text-amber-700">
            Adquira a licença completa para criar documentos ilimitados.
          </p>
        </div>

        <Button 
          onClick={() => navigate(-1)} 
          className="gap-2 bg-amber-600 hover:bg-amber-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </Card>
    </div>
  );
}