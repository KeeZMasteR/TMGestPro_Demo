/**
 * CATÁLOGO CENTRAL DE PREÇOS
 */

export const PRICE_LIST = [
  {
    category: 'Mão de Obra por Hora',
    unit: 'H',
    items: [
      { service: 'Pedreiro', unit: 'H', unitPrice: 28.00 },
      { service: 'Canalizador', unit: 'H', unitPrice: 30.00 },
      { service: 'Serralheiro', unit: 'H', unitPrice: 30.00 },
      { service: 'Estucador', unit: 'H', unitPrice: 26.00 },
      { service: 'Ladrilhador (Paredes)', unit: 'H', unitPrice: 28.00 },
      { service: 'Ladrilhador (Pavimento)', unit: 'H', unitPrice: 27.00 },
      { service: 'Eletricista (Manutenção)', unit: 'H', unitPrice: 35.00 },
      { service: 'Carpinteiro', unit: 'H', unitPrice: 28.00 },
      { service: 'Pintor', unit: 'H', unitPrice: 25.00 },
      { service: 'Pladur (Montagem)', unit: 'H', unitPrice: 26.00 },
      { service: 'Pladur (Barramento)', unit: 'H', unitPrice: 28.00 },
      { service: 'Acabamentos Gerais', unit: 'H', unitPrice: 30.00 },
      { service: 'Jardinagem', unit: 'H', unitPrice: 23.00 },
      { service: 'Demolições', unit: 'H', unitPrice: 28.00 },
      { service: 'Mão de Obra Técnica (Coberturas)', unit: 'H', unitPrice: 22.50 },
      { service: 'Mão Obra Ajudante', unit: 'H', unitPrice: 15.00 },
    ],
  },
  {
    category: 'Estrutura e Construção Bruta',
    unit: 'm²',
    items: [
      { service: 'Cofragem (Montagem e Desmontagem)', unit: 'm²', unitPrice: 25.00 },
      { service: 'Reboco Tradicional', unit: 'm²', unitPrice: 13.50 },
      { service: 'Alvenarias', unit: 'm²', unitPrice: 15.00 },
      { service: 'Betonilha', unit: 'm²', unitPrice: 20.00 },
    ],
  },
  {
    category: 'Isolamentos',
    unit: 'm²',
    items: [
      { service: 'Impermeabilizações (Telas/Cimentícios)', unit: 'm²', unitPrice: 14.00 },
      { service: 'Isolamento de Coberturas (XPS/Lã)', unit: 'm²', unitPrice: 8.50 },
      { service: 'Capoto', unit: 'm²', unitPrice: 35.00 },
      { service: 'Tela Asfáltica', unit: 'm²', unitPrice: 18.00 },
    ],
  },
  {
    category: 'Interiores e Acabamentos',
    unit: 'm²',
    items: [
      { service: 'Estucagem (Projetado/Manual)', unit: 'm²', unitPrice: 10.00 },
      { service: 'Barramento Armado', unit: 'm²', unitPrice: 18.00 },
      { service: 'Pladur', unit: 'm²', unitPrice: 20.00 },
      { service: 'Pintura Interior', unit: 'm²', unitPrice: 11.00 },
      { service: 'Pintura Exterior', unit: 'm²', unitPrice: 12.00 },
      { service: 'Assentamento de Soalho Flutuante', unit: 'm²', unitPrice: 10.00 },
      { service: 'Assentamento de Cerâmica', unit: 'm²', unitPrice: 18.00 },
      { service: 'Assentamento de Cerâmica (>60x60)', unit: 'm²', unitPrice: 28.00 },
      { service: 'Betume / Rejunte', unit: 'm²', unitPrice: 5.00 },
      { service: 'Lavagem (c/ pressão)', unit: 'm²', unitPrice: 3.00 },
      { service: 'Instalação de Caixilharia (Alu/PVC)', unit: 'm²', unitPrice: 40.00 },
    ],
  },
  {
    category: 'Coberturas e Telhados',
    unit: 'm²',
    items: [
      { service: 'Aplicação de Telha Tradicional', unit: 'm²', unitPrice: 18.50 },
      { service: 'Montagem de Painel Sandwich', unit: 'm²', unitPrice: 15.00 },
      { service: 'Aplicação de Chapa Metálica', unit: 'm²', unitPrice: 12.50 },
    ],
  },
  {
    category: 'Demolições e Remoções',
    unit: 'm³',
    items: [
      { service: 'Remoção de Entulhos', unit: 'm³', unitPrice: 150.00 },
    ],
  },
  {
    category: 'Outros (Unidade / Kg)',
    unit: 'Und',
    items: [
      { service: 'Armação de Ferro (Aço)', unit: 'Kg', unitPrice: 0.75 },
      { service: 'Montagem de Portas e Aros', unit: 'Und', unitPrice: 65.00 },
      { service: 'Serviço de Vazadouro', unit: 'Und', unitPrice: 300.00 },
    ],
  },
  {
    category: 'Deslocações',
    unit: 'km',
    items: [
      { service: 'Deslocação Normal', unit: 'km', unitPrice: 1.50 },
      { service: 'Deslocação Urgente', unit: 'km', unitPrice: 2.00 },
      { service: 'Alojamento (Diária)', unit: 'Und', unitPrice: 65.00 },
    ],
  },
];

export const ALL_ITEMS = PRICE_LIST.flatMap(cat => cat.items);

export function getItemGroup(unit, categoria = '') {
  const u = (unit || '').toLowerCase().replace('²', '2').replace('³', '3');
  if (u === 'h') return 'Mão de Obra por Hora';
  if (u === 'm3') return 'Demolições e Remoções';
  if (u === 'km') return 'Deslocações';
  if (u === 'm2') {
    const cat = (categoria || '').toLowerCase();
    if (cat.includes('estrutura') || cat.includes('construção')) return 'Estrutura e Construção Bruta';
    if (cat.includes('isolamento')) return 'Isolamentos';
    if (cat.includes('cobertura') || cat.includes('telhado')) return 'Coberturas e Telhados';
    return 'Interiores e Acabamentos';
  }
  return 'Outros';
}

export const GROUP_ORDER = [
  'Mão de Obra por Hora',
  'Estrutura e Construção Bruta',
  'Isolamentos',
  'Interiores e Acabamentos',
  'Coberturas e Telhados',
  'Demolições e Remoções',
  'Outros',
  'Deslocações',
];

/**
 * COMPANY_INFO — mantido por compatibilidade retroativa com imports existentes.
 * Os dados reais vêm agora do entity CompanyProfile via lib/companyProfile.js
 * Use getCompanyProfile() em vez deste objeto para novos desenvolvimentos.
 */
export const COMPANY_INFO = {
  name: '',
  shortName: '',
  nif: '',
  address: '',
  phone: '',
  email: '',
  iban: '',
  website: '',
  validityDays: 15,
  validityObras: 30,
};