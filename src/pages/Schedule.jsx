import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Clock, User, FileText, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import { useDemo } from '@/lib/DemoContext';

const emptyWork = { title: '', client_name: '', date: '', time: '', duration: '1h', description: '' };

export default function Schedule() {
  const { base44: scopedBase44 } = useDemo();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWork, setNewWork] = useState(emptyWork);

  // Carregar trabalhos agendados apenas desta sessão
  const { data: works = [] } = useQuery({
    queryKey: ['scheduled-works', scopedBase44.demoSessionId],
    queryFn: () => scopedBase44.entities.ScheduledWork.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => scopedBase44.entities.ScheduledWork.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-works'] });
      setDialogOpen(false);
      setNewWork(emptyWork);
      toast.success('Trabalho agendado com sucesso');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => scopedBase44.entities.ScheduledWork.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-works'] });
      toast.success('Agendamento removido');
    }
  });

  // Lógica do Calendário
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (date) => {
    setNewWork({ ...emptyWork, date: format(date, 'yyyy-MM-dd') });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">Planeamento de trabalhos privado</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-primary">
          <Plus className="w-4 h-4" /> Agendar Trabalho
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-2 p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: pt })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2 uppercase tracking-wider">{d}</div>
            ))}
            {Array(startOfMonth(currentMonth).getDay()).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const dayWorks = works.filter(w => isSameDay(new Date(w.date), day));
              return (
                <div 
                  key={day.toString()} 
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square p-1 border rounded-lg cursor-pointer transition-all hover:border-primary group relative ${
                    isToday(day) ? 'bg-primary/5 border-primary/30' : 'border-border'
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayWorks.slice(0, 2).map(w => (
                      <div key={w.id} className="h-1.5 w-full bg-primary/40 rounded-full" title={w.title} />
                    ))}
                    {dayWorks.length > 2 && <div className="text-[10px] text-muted-foreground text-center">+{dayWorks.length - 2}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Lista de Próximos Trabalhos */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Próximos Trabalhos
          </h3>
          <div className="space-y-3">
            {works.length === 0 ? (
              <p className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-lg">Nenhum trabalho agendado para esta sessão.</p>
            ) : (
              works
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
                .map(work => (
                  <Card key={work.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{work.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(work.date), 'dd MMM yyyy', { locale: pt })}
                          {work.time && ` às ${work.time}`}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          {work.client_name || 'Sem cliente'}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(work.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar Novo Trabalho</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título do Trabalho *</Label>
              <Input value={newWork.title} onChange={e => setNewWork({...newWork, title: e.target.value})} placeholder="Ex: Manutenção AC" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newWork.date} onChange={e => setNewWork({...newWork, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={newWork.time} onChange={e => setNewWork({...newWork, time: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={newWork.client_name} onChange={e => setNewWork({...newWork, client_name: e.target.value})} placeholder="Nome do cliente" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate(newWork)} disabled={!newWork.title || !newWork.date}>Guardar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
