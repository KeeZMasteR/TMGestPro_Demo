import { base44 } from '@/api/base44Client';
import { PRICE_LIST } from './pricelist';
import { getCompanyProfile } from './companyProfile';

/**
 * Load price items from DB, falling back to hardcoded defaults.
 */
export async function loadPriceItems() {
  const items = await base44.entities.PriceItem.filter({ active: true });
  if (items && items.length > 0) return items;

  // Seed defaults on first load
  const defaults = PRICE_LIST.flatMap(cat =>
    cat.items.map(item => ({
      service: item.service,
      category: cat.category,
      unit: item.unit,
      unit_price: item.unitPrice,
      active: true,
    }))
  );
  await base44.entities.PriceItem.bulkCreate(defaults);
  return base44.entities.PriceItem.filter({ active: true });
}

/**
 * Load a single app setting by key, with a fallback default.
 * For 'iban', reads from CompanyProfile first.
 */
export async function getSetting(key, fallback = '') {
  if (key === 'iban') {
    const profile = await getCompanyProfile();
    if (profile.iban) return profile.iban;
  }
  const results = await base44.entities.AppSettings.filter({ key });
  return results.length > 0 ? results[0].value : fallback;
}

/**
 * Save (upsert) a setting.
 */
export async function saveSetting(key, value) {
  const results = await base44.entities.AppSettings.filter({ key });
  if (results.length > 0) {
    await base44.entities.AppSettings.update(results[0].id, { value });
  } else {
    await base44.entities.AppSettings.create({ key, value });
  }
}