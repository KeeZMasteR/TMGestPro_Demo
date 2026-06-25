import { useQuery } from '@tanstack/react-query';
import { useDemo } from '@/lib/DemoContext';

export function usePriceItems() {
  const { base44, demoSessionId } = useDemo();

  return useQuery({
    queryKey: ['price-items', demoSessionId],

    queryFn: async () => {
      const all = await base44.entities.PriceItem.list('-created_date');

      return (all || [])
        .filter(item =>
          !item.demo_session_id ||
          String(item.demo_session_id) === String(demoSessionId)
        )
        .map(item => ({
          ...item,
          id: String(item.id),
          nome: item.nome || item.name || '',
          preco_unitario:
            item.preco_unitario ||
            item.price ||
            item.preco ||
            0,
          unidade: item.unidade || item.unit || 'Und',
          tipo: item.tipo || item.type || 'Outros',
          categoria: item.categoria || '',
          subcategoria: item.subcategoria || '',
        }));
    },

    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}





