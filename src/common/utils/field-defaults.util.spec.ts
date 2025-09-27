import { applyDefaults, cleanObject, DEFAULT_VALUES } from './field-defaults.util';

describe('Field Defaults Utility', () => {
  describe('applyDefaults', () => {
    it('should apply default values for missing fields', () => {
      const input = {
        name: 'Test Product',
        price: 100,
      };

      const defaults = {
        name: 'Default Name',
        price: 0,
        description: 'Default Description',
        stock: 0,
      };

      const result = applyDefaults(input, defaults);

      expect(result).toEqual({
        name: 'Test Product',
        price: 100,
        description: 'Default Description',
        stock: 0,
      });
    });

    it('should not override existing values', () => {
      const input = {
        name: 'Test Product',
        description: 'Existing Description',
      };

      const defaults = {
        name: 'Default Name',
        description: 'Default Description',
        stock: 0,
      };

      const result = applyDefaults(input, defaults);

      expect(result).toEqual({
        name: 'Test Product',
        description: 'Existing Description',
        stock: 0,
      });
    });

    it('should handle null and undefined values', () => {
      const input: any = {
        name: 'Test Product',
        description: null,
        stock: undefined,
        price: '',
      };

      const defaults = {
        description: 'Default Description',
        stock: 0,
        price: 100,
      };

      const result = applyDefaults(input, defaults);

      expect(result).toEqual({
        name: 'Test Product',
        description: 'Default Description',
        stock: 0,
        price: 100,
      });
    });
  });

  describe('cleanObject', () => {
    it('should remove undefined and null values', () => {
      const input = {
        name: 'Test Product',
        description: null,
        stock: undefined,
        price: 100,
        category: '',
      };

      const result = cleanObject(input);

      expect(result).toEqual({
        name: 'Test Product',
        price: 100,
      });
    });

    it('should apply defaults for cleaned values', () => {
      const input: any = {
        name: 'Test Product',
        description: null,
        stock: undefined,
      };

      const defaults = {
        description: 'Default Description',
        stock: 0,
      };

      const result = cleanObject(input, defaults);

      expect(result).toEqual({
        name: 'Test Product',
        description: 'Default Description',
        stock: 0,
      });
    });
  });

  describe('DEFAULT_VALUES', () => {
    it('should have product defaults', () => {
      expect(DEFAULT_VALUES.product).toBeDefined();
      expect(DEFAULT_VALUES.product.stock).toBe(0);
      expect(DEFAULT_VALUES.product.minStock).toBe(0);
      expect(DEFAULT_VALUES.product.description).toBe('');
    });

    it('should have order defaults', () => {
      expect(DEFAULT_VALUES.order).toBeDefined();
      expect(DEFAULT_VALUES.order.discount).toBe(0);
      expect(DEFAULT_VALUES.order.customerName).toBe('');
      expect(typeof DEFAULT_VALUES.order.timestamp).toBe('function');
    });

    it('should have supplier defaults', () => {
      expect(DEFAULT_VALUES.supplier).toBeDefined();
      expect(DEFAULT_VALUES.supplier.email).toBe('');
      expect(DEFAULT_VALUES.supplier.address).toBe('');
      expect(DEFAULT_VALUES.supplier.phone).toBe('');
    });
  });

  describe('Function default values', () => {
    it('should execute function defaults when applying defaults', () => {
      const input: any = {
        name: 'Test Order',
      };

      const defaults: any = {
        name: 'Default Name',
        timestamp: () => new Date('2023-01-01'),
        discount: 0,
      };

      const result = applyDefaults(input, defaults);

      expect(result.name).toBe('Test Order');
      expect(result.timestamp).toEqual(new Date('2023-01-01'));
      expect(result.discount).toBe(0);
    });

    it('should execute function defaults in cleanObject', () => {
      const input: any = {
        name: 'Test Order',
        timestamp: undefined,
      };

      const defaults: any = {
        timestamp: () => new Date('2023-01-01'),
        discount: 0,
      };

      const result = cleanObject(input, defaults);

      expect(result.name).toBe('Test Order');
      expect(result.timestamp).toEqual(new Date('2023-01-01'));
      expect(result.discount).toBe(0);
    });
  });
});
