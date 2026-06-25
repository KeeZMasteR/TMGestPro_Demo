import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Save, Palette, Lock, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCompanyProfile, saveCompanyProfile, EMPTY_PROFILE } from '@/lib/companyProfile';
import { base44 } from '@/api/base44Client';
import { useDemo } from '@/lib/DemoContext';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL', 'CHF'];

export default function CompanyProfileSection() {
  const { isDemoMode } = useDemo();
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgInputRef = useRef();

  useEffect(() => {
    getCompanyProfile(true).then(p => { setForm(p); setLoading(false); });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.company_name?.trim()) { toast.error('O nome da empresa é obrigatório'); return; }
    setSaving(true);
    await saveCompanyProfile(form);
    setSaving(false);
    toast.success('Perfil da empresa guardado');
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('budget_background_url', file_url);
    setUploadingBg(false);
    toast.success('Fundo personalizado carregado');
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">A carregar...</div>;

  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-heading font-semibold">Perfil da Empresa</h2>
            <p className="text-xs text-muted-foreground">Estes dados aparecem automaticamente em todos os documentos gerados.</p>
          </div>
        </div>
        {isDemoMode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-800">Versão Demo</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Nome da Empresa *</Label>
          <Input className="mt-1" placeholder="Ex: Construções Silva, Lda." value={form.company_name} onChange={e => set('company_name', e.target.value)} />
        </div>

        <div>
          <Label>Telefone</Label>
          <Input className="mt-1" placeholder="Ex: (+351) 912 345 678" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>

        <div>
          <Label>Email</Label>
          <Input type="email" className="mt-1" placeholder="geral@empresa.pt" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>

        <div>
          <Label>Website</Label>
          <Input className="mt-1" placeholder="https://www.empresa.pt" value={form.website} onChange={e => set('website', e.target.value)} />
        </div>

        <div>
          <Label>Moeda Padrão</Label>
          <Select value={form.currency} onValueChange={v => set('currency', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label>Morada</Label>
          <Input className="mt-1" placeholder="Rua, Nº, Código Postal, Cidade" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>

        <div>
          <Label>Validade dos Orçamentos (dias)</Label>
          <Input type="number" min="1" className="mt-1" value={form.validity_days} onChange={e => set('validity_days', parseInt(e.target.value) || 15)} />
        </div>

        <div>
          <Label>Taxa de IVA Padrão (%)</Label>
          <Input type="number" min="0" max="100" className="mt-1" value={form.vat_rate} onChange={e => set('vat_rate', parseFloat(e.target.value) || 23)} />
        </div>

        {isDemoMode && (
          <div className="sm:col-span-2 space-y-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Funcionalidades não disponíveis na demonstração:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Carregar logótipo da empresa</li>
                    <li>Adicionar NIF</li>
                    <li>Adicionar IBAN</li>
                    <li>Carregar fundo personalizado para PDF</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Layout - Classic Only in Demo */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-semibold text-base">Layout dos Documentos</h3>
          </div>
          {isDemoMode && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Layout Clássico (fixo)</span>
            </div>
          )}
        </div>
        
        {isDemoMode ? (
          <div className="p-4 rounded-xl border-2 border-primary bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">Layout Clássico</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fundo de template em PDF com cabeçalho integrado. Disponível na versão completa.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {[
              { value: 'classic', label: 'Clássico', desc: 'Fundo de template em PDF com cabeçalho integrado' },
              { value: 'modern', label: 'Moderno', desc: 'Layout limpo e minimalista, sem fundo externo' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => set('document_template', opt.value)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  form.document_template === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        )}

        {!isDemoMode && form.document_template === 'classic' && (
          <div className="mt-4 max-w-md">
            <Label className="text-sm">Fundo Personalizado para Orçamentos (PDF)</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Carregue um PDF de 1 página que será usado como fundo dos orçamentos.</p>
            <div className="flex gap-2">
              <input ref={bgInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleBgUpload} />
              <Button variant="outline" className="gap-2" onClick={() => bgInputRef.current?.click()} disabled={uploadingBg}>
                <Upload className="w-4 h-4" />
                {uploadingBg ? 'A carregar...' : 'Carregar Fundo'}
              </Button>
              {form.budget_background_url && (
                <Button variant="ghost" size="icon" onClick={() => set('budget_background_url', '')} className="text-destructive/70 hover:text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {form.budget_background_url && (
              <p className="text-xs text-emerald-600 mt-1">✓ Fundo personalizado configurado</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'A guardar...' : 'Guardar Perfil'}
        </Button>
      </div>
    </Card>
  );
}