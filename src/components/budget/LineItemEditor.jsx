import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { usePriceItems } from '@/hooks/usePriceItems';

const TIPOS = [
  'Prestação de Serviços',
  'Material',
  'Outros'
];

const UNITS = [
  'H',
  'm2',
  'm3',
  'ml',
  'Kg',
  'Und',
  'Deslocação'
];

const TIPO_COLORS = {
  'Prestação de Serviços': {
    bg: 'bg-blue-50 border-blue-200',
    label: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700'
  },

  'Material': {
    bg: 'bg-green-50 border-green-200',
    label: 'text-green-800',
    badge: 'bg-green-100 text-green-700'
  },

  'Outros': {
    bg: 'bg-gray-50 border-gray-200',
    label: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-600'
  }
};

export default function LineItemEditor({
  items = [],
  onChange
}) {
  const { data: catalog = [] } = usePriceItems();

  const safeItems = Array.isArray(items)
    ? items
    : [];

  const groupedCatalog = (catalog || []).reduce(
    (acc, pi) => {
      const tipo = pi.tipo || 'Outros';
      const cat = pi.categoria || 'Geral';

      if (!acc[tipo]) acc[tipo] = {};
      if (!acc[tipo][cat]) acc[tipo][cat] = [];

      acc[tipo][cat].push(pi);

      return acc;
    },
    {}
  );

  const updateItem = (idx, updated) => {
    const next = [...safeItems];
    next[idx] = updated;

    if (typeof onChange === 'function') {
      onChange(next);
    }
  };

  const removeItem = (idx) => {
    const next = safeItems.filter(
      (_, i) => i !== idx
    );

    if (typeof onChange === 'function') {
      onChange(next);
    }
  };

  const addItem = (
    tipo,
    isOpcional = false
  ) => {
    const newItem = {
      tipo,
      block_type: isOpcional
        ? 'opcionais'
        : 'servicos',

      nome: '',
      descricao: '',
      unidade: 'H',
      quantidade: 1,
      preco_unit: 0,
      is_night: false,
      isNight: false,
      total: 0
    };

    if (typeof onChange === 'function') {
      onChange([...safeItems, newItem]);
    }
  };

  const recalc = (item) => {
    const q =
      parseFloat(item.quantidade) || 0;

    const p =
      parseFloat(item.preco_unit) || 0;

    const total = q * p;

    return {
      ...item,
      total: parseFloat(total.toFixed(2))
    };
  };

  const grandTotal = safeItems
    .filter(i => i.block_type !== 'opcionais')
    .reduce((s, i) => {
      const base = i.total || 0;

      const isNight =
        i.is_night || i.isNight;

      const extra = isNight
        ? base * 0.25
        : 0;

      return s + base + extra;
    }, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {safeItems.map((item, idx) => {
          const colors =
            TIPO_COLORS[item.tipo] ||
            TIPO_COLORS['Outros'];

          const isOpcional =
            item.block_type === 'opcionais';

          return (
            <div
              key={idx}
              className={`rounded-xl border ${colors.bg} shadow-sm overflow-hidden`}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-white/60">
                <Select
                  value={
                    item.tipo ||
                    'Prestação de Serviços'
                  }
                  onValueChange={(v) =>
                    updateItem(
                      idx,
                      recalc({
                        ...item,
                        tipo: v
                      })
                    )
                  }
                >
                  <SelectTrigger className="h-7 w-48 text-xs border-dashed">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className="text-xs"
                      >
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isOpcional && (
                  <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Opcional
                  </span>
                )}

                <div className="flex-1" />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive/60"
                  onClick={() =>
                    removeItem(idx)
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                  {/* CATALOGO */}
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">
                      Catálogo
                    </label>

                    <Select
                      value={
                        item.catalog_item_id
                          ? String(
                              item.catalog_item_id
                            )
                          : undefined
                      }
                      onValueChange={(id) => {
                        if (!id) return;

                        const pi =
                          catalog.find(
                            (p) =>
                              String(p.id) ===
                              String(id)
                          );

                        if (!pi) return;

                        updateItem(
                          idx,
                          recalc({
                            ...item,

                            catalog_item_id:
                              String(id),

                            nome:
                              pi.nome || '',

                            unidade:
                              pi.unidade ||
                              'Und',

                            preco_unit:
                              pi.preco_unitario ||
                              0,

                            tipo:
                              pi.tipo ||
                              item.tipo
                          })
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs mt-0.5">
                        <SelectValue placeholder="Importar..." />
                      </SelectTrigger>

                      <SelectContent>

                        {catalog.length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground">
                            Sem items no catálogo
                          </div>
                        )}

                        {Object.entries(
                          groupedCatalog
                        ).map(
                          ([tipo, cats]) => (
                            <React.Fragment
                              key={tipo}
                            >
                              <div className="px-2 py-1 text-[10px] font-bold text-primary uppercase bg-primary/5">
                                {tipo}
                              </div>

                              {Object.entries(
                                cats
                              ).map(
                                ([
                                  cat,
                                  catsItems
                                ]) => (
                                  <React.Fragment
                                    key={cat}
                                  >
                                    <div className="px-3 py-0.5 text-[9px] text-muted-foreground uppercase bg-muted/40">
                                      {cat}
                                    </div>

                                    {catsItems.map(
                                      (pi) => (
                                        <SelectItem
                                          key={String(
                                            pi.id
                                          )}
                                          value={String(
                                            pi.id
                                          )}
                                          className="text-xs pl-5"
                                        >
                                          {pi.nome}
                                        </SelectItem>
                                      )
                                    )}
                                  </React.Fragment>
                                )
                              )}
                            </React.Fragment>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* NOME */}
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">
                      Nome do Item
                    </label>

                    <Input
                      className="h-8 text-sm mt-0.5"
                      value={item.nome || ''}
                      onChange={(e) => {
                        let v = e.target.value;

                        v = v
                          .replace(
                            /\s*\(NOTURNO \+25%\)\s*/gi,
                            ''
                          )
                          .trim();

                        updateItem(
                          idx,
                          recalc({
                            ...item,
                            nome: v
                          })
                        );
                      }}
                    />
                  </div>
                </div>

                <Input
                  placeholder="Descrição adicional..."
                  className="h-8 text-sm"
                  value={
                    item.descricao ||
                    item.description ||
                    ''
                  }
                  onChange={(e) =>
                    updateItem(idx, {
                      ...item,
                      descricao:
                        e.target.value,
                      description:
                        e.target.value
                    })
                  }
                />

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">
                      Unid.
                    </label>

                    <Select
                      value={
                        item.unidade || 'H'
                      }
                      onValueChange={(v) =>
                        updateItem(
                          idx,
                          recalc({
                            ...item,
                            unidade: v
                          })
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-sm mt-0.5">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem
                            key={u}
                            value={u}
                          >
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">
                      Qtd
                    </label>

                    <Input
                      type="number"
                      className="h-8 text-sm text-center mt-0.5"
                      value={
                        item.quantidade ?? 1
                      }
                      onChange={(e) =>
                        updateItem(
                          idx,
                          recalc({
                            ...item,
                            quantidade:
                              e.target.value
                          })
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground text-right block">
                      Preço
                    </label>

                    <Input
                      type="number"
                      className="h-8 text-sm text-right mt-0.5"
                      value={
                        item.preco_unit ?? 0
                      }
                      onChange={(e) =>
                        updateItem(
                          idx,
                          recalc({
                            ...item,
                            preco_unit:
                              e.target.value
                          })
                        )
                      }
                    />
                  </div>

                  <div className="h-8 flex items-center justify-end font-bold text-sm bg-muted/50 rounded border px-2">
                    {(item.total || 0).toFixed(
                      2
                    )}{' '}
                    €
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id={`not-${idx}`}
                    checked={
                      item.is_night ||
                      item.isNight ||
                      false
                    }
                    onCheckedChange={(v) =>
                      updateItem(
                        idx,
                        recalc({
                          ...item,
                          is_night: v,
                          isNight: v
                        })
                      )
                    }
                  />

                  <label
                    htmlFor={`not-${idx}`}
                    className="text-xs font-medium cursor-pointer"
                  >
                    Horário Noturno (+25%)
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t">
        {TIPOS.map((tipo) => (
          <Button
            key={tipo}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() =>
              addItem(tipo, false)
            }
          >
            + {tipo}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="text-xs border-amber-400 text-amber-700"
          onClick={() =>
            addItem('Outros', true)
          }
        >
          + Item Opcional
        </Button>
      </div>

      <div className="flex justify-end pt-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl min-w-[220px] text-right shadow-lg">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Total Orçamento
          </p>

          <p className="text-3xl font-bold">
            € {grandTotal.toFixed(2)}
          </p>

          <p className="text-[10px] text-slate-500 italic mt-1">
            IVA não incluído
          </p>
        </div>
      </div>
    </div>
  );
}