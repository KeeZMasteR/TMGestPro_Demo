import { base44 } from '@/api/base44Client';

let _cache = null;

export const EMPTY_PROFILE = {
  company_name: 'A Minha Empresa',
  nif: '999 999 999',
  address: 'Rua Exemplo, nº 123, Lisboa',
  phone: '+351 210 000 000',
  email: 'demo@tmgestpro.pt',
  website: 'www.tmgestpro.pt',
  iban: 'PT50 0000 0000 0000 0000 0000 0',
  currency: 'EUR',
  logo_url: 'https://media.base44.com/images/public/69e7cf65e769dab3c40900be/23c86cf05_ChatGPTImageApr25202608_44_25PM.png',
  document_template: 'classic',
  budget_background_url: '',
  validity_days: 15,
  vat_rate: 23,
};

export async function getCompanyProfile(forceRefresh = false, scopedClient = null, demoSessionId = null ) {
  if (_cache && !forceRefresh) return _cache;
  const client = scopedClient || base44;
  const all = await client.entities.CompanyProfile.list('-created_date');
  const profile = demoSessionId ? all.find(p => String(p.demo_session_id) === String(demoSessionId)) : all[0];
  _cache = profile ? { ...EMPTY_PROFILE, ...profile } : { ...EMPTY_PROFILE };
  return _cache;
}

export function invalidateCompanyCache() { _cache = null; }

export async function saveCompanyProfile(data, scopedClient = null, demoSessionId = null) {
  const client = scopedClient || base44;
  const all = await client.entities.CompanyProfile.list('-created_date');
  const existing = demoSessionId ? all.find(p => String(p.demo_session_id) === String(demoSessionId)) : all[0];
  let saved;
  const payload = { ...data };
  if (demoSessionId) payload.demo_session_id = demoSessionId;
  if (existing) saved = await client.entities.CompanyProfile.update(existing.id, payload);
  else saved = await client.entities.CompanyProfile.create(payload);
  invalidateCompanyCache();
  return saved;
}

