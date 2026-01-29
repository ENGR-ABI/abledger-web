/**
 * Currency formatting utility
 * Uses tenant settings to format currency values
 */

// Default currency if not set (NGN as per requirements)
const DEFAULT_CURRENCY = 'NGN';

// Cache for tenant currency (will be updated via context/hook)
let tenantCurrency: string = DEFAULT_CURRENCY;

/**
 * Set the tenant currency (called from settings context)
 */
export function setTenantCurrency(currency: string) {
  tenantCurrency = currency || DEFAULT_CURRENCY;
}

/**
 * Get the current tenant currency
 */
export function getTenantCurrency(): string {
  return tenantCurrency;
}

/**
 * Get locale based on currency code
 */
function getLocaleForCurrency(currency: string): string {
  const localeMap: Record<string, string> = {
    'NGN': 'en-NG',
    'USD': 'en-US',
    'GBP': 'en-GB',
    'EUR': 'en-EU',
    'KES': 'en-KE',
    'GHS': 'en-GH',
    'ZAR': 'en-ZA',
  };

  return localeMap[currency] || 'en-US';
}

/**
 * Get the currency symbol for a given currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'NGN', 'EUR')
 * @returns The currency symbol (e.g., '$', '₦', '€')
 */
export function getCurrencySymbol(currencyCode?: string): string {
  const currency = currencyCode || tenantCurrency || DEFAULT_CURRENCY;
  const locale = getLocaleForCurrency(currency);

  try {
    // Use Intl.NumberFormat to get the currency symbol
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Format a sample number and extract the symbol
    const parts = formatter.formatToParts(1);
    const symbolPart = parts.find(part => part.type === 'currency');
    return symbolPart?.value || currency;
  } catch (error) {
    // Fallback to currency code if formatting fails
    console.warn(`Failed to get symbol for currency ${currency}:`, error);
    return currency;
  }
}

/**
 * Format a number as currency using the tenant's currency setting
 * @param amount - The amount to format
 * @param options - Additional Intl.NumberFormat options
 */
export function formatCurrency(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const currency = tenantCurrency || DEFAULT_CURRENCY;
  const locale = getLocaleForCurrency(currency);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits,
  }).format(amount);
}

