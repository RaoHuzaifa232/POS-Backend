/**
 * Utility functions for handling default values in services
 */

/**
 * Apply default values to an object based on a defaults configuration
 * @param data The input data object
 * @param defaults Object containing default values for fields
 * @returns Object with default values applied
 */
export function applyDefaults<T extends Record<string, any>>(data: Partial<T>, defaults: Partial<T>): T {
  const result = { ...data } as T;
  
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (result[key as keyof T] === undefined || result[key as keyof T] === null || result[key as keyof T] === '') {
      // If the default value is a function, execute it to get the actual value
      (result as any)[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
  }
  
  return result;
}

/**
 * Clean undefined and null values from an object, optionally replacing with defaults
 * @param obj The object to clean
 * @param defaults Optional default values to apply
 * @returns Cleaned object
 */
export function cleanObject<T extends Record<string, any>>(obj: Partial<T>, defaults?: Partial<T>): Partial<T> {
  const cleaned: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      (cleaned as any)[key] = value;
    } else if (defaults && defaults[key as keyof T] !== undefined) {
      const defaultValue = defaults[key as keyof T];
      // If the default value is a function, execute it to get the actual value
      (cleaned as any)[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
  }
  
  return cleaned;
}

/**
 * Default values for common entity types
 */
export const DEFAULT_VALUES = {
  product: {
    stock: 0,
    minStock: 0,
    image: '',
    barcode: '',
    supplier: '',
    description: '',
  },
  order: {
    discount: 0,
    customerName: '',
    tax: 0,
    timestamp: () => new Date(),
  },
  supplier: {
    email: '',
    address: '',
    phone: '',
  },
  category: {
    description: '',
  },
  paymentMethod: {
    accountNumber: '',
    isActive: true,
  },
  purchase: {
    invoiceNumber: '',
    notes: '',
  },
  salesReturn: {
    reason: '',
    notes: '',
    status: 'pending',
  },
  purchaseReturn: {
    reason: '',
    notes: '',
    status: 'pending',
  },
  stockMovement: {
    reference: '',
  },
} as const;
