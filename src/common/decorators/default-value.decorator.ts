import { Transform } from 'class-transformer';

/**
 * Decorator to set default values for optional fields when they are undefined or null
 * @param defaultValue The default value to use
 */
export function DefaultValue(defaultValue: any) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    return value;
  });
}

/**
 * Decorator specifically for numeric fields with default values
 * @param defaultValue The default numeric value
 */
export function DefaultNumber(defaultValue: number = 0) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '' || isNaN(value)) {
      return defaultValue;
    }
    return Number(value);
  });
}

/**
 * Decorator specifically for string fields with default values
 * @param defaultValue The default string value
 */
export function DefaultString(defaultValue: string = '') {
  return Transform(({ value }) => {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return String(value);
  });
}

/**
 * Decorator specifically for boolean fields with default values
 * @param defaultValue The default boolean value
 */
export function DefaultBoolean(defaultValue: boolean = false) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  });
}

/**
 * Decorator for date fields with default values
 * @param defaultValue The default date value (can be a Date object or a function that returns a Date)
 */
export function DefaultDate(defaultValue: Date | (() => Date) = () => new Date()) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
    return new Date(value);
  });
}
