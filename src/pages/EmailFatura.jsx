import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Copy, Check, AlertCircle, RefreshCw, Code, Send } from 'lucide-react';
import { COMPANY_INFO } from '@/lib/pricelist';
import EmailPreviewIframe from '@/components/email/EmailPreviewIframe';

const EMPTY_FORM = {
  tratamento: '',
  nome_cliente: '',
  email_cliente: '',
  numero_fatura: '',
  descricao_trabalho: '',
  valor_total: '',
  data_vencimento: '',
  iban: COMPANY_INFO.iban || '',
  nome_empresa: COMPANY_INFO.name || '',
  detalhes_servico: '',
};

function buildHtml(f) {
  const titulo = f.tratamento.trim()
    ? `${f.tratamento.trim()} ${f.nome_cliente.trim()}`
    : f.nome_cliente.trim() || '—';

  return `<html>
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin: 0; padding: 0; background-color: rgb(255,255,255); font-family: Arial, Helvetica, sans-serif; color: rgb(12,52,61);">
  <div style="padding: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61); line-height: 1.6;">
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Muito bom dia ${titulo},</p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Em anexo, encontra-se a fatura <strong style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">${f.numero_fatura.trim() || '—'}</strong>, referente a ${f.descricao_trabalho.trim() || '—'}.</p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);"><strong style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Detalhes das Faturas:</strong></p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Valor Total: ${f.valor_total.trim() ? f.valor_total.trim() + ' €' : '—'}<br/>Data de Vencimento: ${f.data_vencimento.trim() || '—'}</p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Para mais detalhes: ${f.detalhes_servico.trim() || '—'}</p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);"><strong style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Formas de Pagamento:</strong></p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Transferência bancária para o IBAN - ${f.iban.trim() || '—'}</p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Em caso de dúvidas ou para qualquer necessidade de informação adicional, não hesite em entrar em contacto.</p>
    <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Agradeço a preferência e espero colaborar novamente em breve.</p>
    <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(12,52,61);">Atenciosamente,<br/>Com os melhores cumprimentos,</p>
  </div>
</body>
</html>`;
}

// ── Texto plano (para copiar) ─────────────────────────────────────────────────
function buildPlainText(f) {
  const titulo = f.tratamento.trim()
    ? `${f.tratamento.trim()} ${f.nome_cliente.trim()}`
    : f.nome_cliente.trim();

  return `Muito bom dia ${titulo},

Em anexo, encontra-se a fatura ${f.numero_fatura.trim()}, referente a ${f.descricao_trabalho.trim()}.

Detalhes das Faturas:
Valor Total: ${f.valor_total.trim()} €
Data de Vencimento: ${f.data_vencimento.trim()}

Para mais detalhes: ${f.detalhes_servico.trim()}

Formas de Pagamento:
Transferência bancária para o IBAN - ${f.iban.trim()}

Em caso de dúvidas ou para qualquer necessidade de informação adicional, não hesite em entrar em contacto.

Agradeço a preferência e espero colaborar novamente em breve.

Atenciosamente,
Com os meus melhores cumprimentos,`;
}

const REQUIRED = [
  { key: 'nome_cliente',       label: 'Nome do cliente' },
  { key: 'numero_fatura',      label: 'Número da fatura' },
  { key: 'descricao_trabalho', label: 'Descrição do trabalho' },
  { key: 'valor_total',        label: 'Valor total' },
  { key: 'data_vencimento',    label: 'Data de vencimento' },
  { key: 'iban',               label: 'IBAN' },
  { key: 'detalhes_servico',   label: 'Detalhes do serviço' },
];

function ErrMsg() {
  return (
    <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
      <AlertCircle className="w-3 h-3" /> Campo obrigatório
    </p>
  );
}

export default function EmailFatura() {
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState([]);
  const [copied, setCopied]         = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Live preview — actualiza a cada keystroke
  const html = useMemo(() => buildHtml(form), [form]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => e.filter(err => err !== field));
  }

  function validate() {
    const missing = REQUIRED.filter(r => !form[r.key].trim()).map(r => r.key);
    setErrors(missing);
    return missing.length === 0;
  }

  function handleCopyText() {
    if (!validate()) return;
    navigator.clipboard.writeText(buildPlainText(form));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleCopyHtml() {
    if (!validate()) return;
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([buildPlainText(form)], { type: 'text/plain' }),
      }),
    ]);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 3000);
  }

  function handleOpenGmail() {
    if (!validate()) return;
    const subject = encodeURIComponent(
      form.numero_fatura.trim() ? `Fatura ${form.numero_fatura.trim()}` : 'Fatura'
    );
    const body = encodeURIComponent(buildPlainText(form));
    const to = encodeURIComponent(form.email_cliente?.trim() || '');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank');
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setErrors([]);
    setCopied(false);
    setCopiedHtml(false);
  }

  const hasError = key => errors.includes(key);

  const toLabel = form.tratamento.trim() && form.nome_cliente.trim()
    ? `${form.tratamento.trim()} ${form.nome_cliente.trim()}`
    : form.nome_cliente.trim() || '—';

  const subject = form.numero_fatura.trim() ? `Fatura ${form.numero_fatura.trim()}` : 'Fatura —';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
          <Mail className="w-7 h-7 text-primary" />
          Gerador de Email de Faturação
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preview em tempo real — o email é gerado a partir de um template fixo com estilos inline.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Formulário ── */}
        <Card className="border-0 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Dados do Email</h2>

          <div className="space-y-1">
            <Label className="text-xs">Email do cliente <span className="text-muted-foreground">(para abrir no Gmail)</span></Label>
            <Input
              type="email"
              placeholder="cliente@email.com"
              value={form.email_cliente}
              onChange={e => set('email_cliente', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tratamento <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                placeholder="Ex: Eng., Sr., Dra."
                value={form.tratamento}
                onChange={e => set('tratamento', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome do cliente <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Nome completo"
                value={form.nome_cliente}
                onChange={e => set('nome_cliente', e.target.value)}
                className={hasError('nome_cliente') ? 'border-destructive' : ''}
              />
              {hasError('nome_cliente') && <ErrMsg />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nº da fatura <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ex: 2025/001"
                value={form.numero_fatura}
                onChange={e => set('numero_fatura', e.target.value)}
                className={hasError('numero_fatura') ? 'border-destructive' : ''}
              />
              {hasError('numero_fatura') && <ErrMsg />}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor total (€) <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ex: 1.250,00"
                value={form.valor_total}
                onChange={e => set('valor_total', e.target.value)}
                className={hasError('valor_total') ? 'border-destructive' : ''}
              />
              {hasError('valor_total') && <ErrMsg />}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição do trabalho <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Ex: impermeabilização em cobertura plana"
              value={form.descricao_trabalho}
              onChange={e => set('descricao_trabalho', e.target.value)}
              className={hasError('descricao_trabalho') ? 'border-destructive' : ''}
            />
            {hasError('descricao_trabalho') && <ErrMsg />}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Detalhes do serviço <span className="text-destructive">*</span>
              <span className="ml-1 text-amber-600 font-normal">— sempre manual</span>
            </Label>
            <Textarea
              placeholder="Descreva os detalhes específicos do serviço prestado..."
              value={form.detalhes_servico}
              onChange={e => set('detalhes_servico', e.target.value)}
              className={`min-h-[80px] text-sm ${hasError('detalhes_servico') ? 'border-destructive' : ''}`}
            />
            {hasError('detalhes_servico') && <ErrMsg />}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Data de vencimento <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.data_vencimento}
              onChange={e => set('data_vencimento', e.target.value)}
              className={hasError('data_vencimento') ? 'border-destructive' : ''}
            />
            {hasError('data_vencimento') && <ErrMsg />}
          </div>

          <hr className="border-border" />
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Dados da Empresa</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">IBAN <span className="text-destructive">*</span></Label>
              <Input
                placeholder="PT50 ..."
                value={form.iban}
                onChange={e => set('iban', e.target.value)}
                className={hasError('iban') ? 'border-destructive' : ''}
              />
              {hasError('iban') && <ErrMsg />}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome da empresa</Label>
              <Input
                value={form.nome_empresa}
                onChange={e => set('nome_empresa', e.target.value)}
              />
            </div>
          </div>

          {errors.length > 0 && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Preencha todos os campos obrigatórios.
            </p>
          )}

          {copiedHtml && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              Email copiado com formatação. Cole diretamente no Gmail.
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={handleCopyHtml} className="w-full gap-2">
              {copiedHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedHtml ? 'Copiado com formatação!' : 'Copiar Email (com formatação)'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyText} className="flex-1 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar texto simples'}
              </Button>
              <Button variant="outline" onClick={handleOpenGmail} className="flex-1 gap-2">
                <Send className="w-4 h-4" />
                Abrir Gmail
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} title="Limpar">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* ── RIGHT: Preview Gmail ── */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Preview em tempo real
          </h2>
          <EmailPreviewIframe html={html} />
        </div>
      </div>
    </div>
  );
}