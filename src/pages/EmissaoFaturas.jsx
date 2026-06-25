import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Copy, CheckCheck, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PORTAL_URL = 'https://sitfiscal.portaldasfinancas.gov.pt/geral/dashboard';

export default function EmissaoFaturas() {
  const [status, setStatus] = useState('idle'); // idle | opening | blocked
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Abrir automaticamente ao entrar na página
    openPortal();
  }, []);

  function openPortal() {
    setStatus('opening');
    const tab = window.open(PORTAL_URL, '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      if (!tab || tab.closed || typeof tab.closed === 'undefined') {
        setStatus('blocked');
      } else {
        setStatus('opened');
      }
    }, 800);
  }

  function copyUrl() {
    navigator.clipboard.writeText(PORTAL_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Receipt className="w-8 h-8 text-primary" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-heading font-bold text-foreground">Emissão de Faturas</h1>
        <p className="text-muted-foreground text-sm mt-1">Portal das Finanças · AT</p>
      </div>

      <Card className="border-0 shadow-sm p-8 max-w-md w-full text-center space-y-5">

        {status === 'opening' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">A abrir Portal das Finanças…</p>
          </div>
        )}

        {status === 'opened' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-foreground font-medium">Portal aberto numa nova aba</p>
            <p className="text-xs text-muted-foreground">Se a aba não abriu, verifique se o seu browser bloqueou pop-ups.</p>
          </div>
        )}

        {status === 'blocked' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-foreground font-medium">O browser bloqueou a nova aba</p>
            <p className="text-xs text-muted-foreground">Permita pop-ups para este site ou copie o endereço manualmente.</p>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground w-full justify-between">
              <span className="truncate">{PORTAL_URL}</span>
              <button onClick={copyUrl} className="flex-shrink-0 hover:text-foreground transition-colors">
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={openPortal} className="gap-2 w-full">
            <ExternalLink className="w-4 h-4" />
            Abrir Portal das Finanças
          </Button>
          {status === 'blocked' && (
            <Button variant="outline" onClick={copyUrl} className="gap-2 w-full">
              {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar endereço'}
            </Button>
          )}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center max-w-sm">
        Por razões de segurança e conformidade, o portal oficial da AT é sempre aberto externamente.
        Nenhuma credencial é armazenada ou processada por esta aplicação.
      </p>
    </div>
  );
}