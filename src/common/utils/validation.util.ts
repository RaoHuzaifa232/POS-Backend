import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id The ID string to validate
 * @returns boolean indicating if the ID is valid
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && id !== 'undefined' && id !== 'null' && id.trim() !== '';
}

/**
 * Validates and throws an exception if the ID is not valid
 * @param id The ID string to validate
 * @param entityName The name of the entity for error messages
 * @throws BadRequestException if the ID is invalid
 */
export function validateObjectId(id: string, entityName: string = 'Entity'): void {
  if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
    throw new BadRequestException(`${entityName} ID is required and cannot be empty`);
  }
  
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ${entityName} ID format: ${id}`);
  }
}

/**
 * Sanitizes and validates an ObjectId parameter
 * @param id The ID string to sanitize
 * @param entityName The name of the entity for error messages
 * @returns The validated ID string
 * @throws BadRequestException if the ID is invalid
 */
export function sanitizeObjectId(id: string, entityName: string = 'Entity'): string {
  validateObjectId(id, entityName);
  return id.trim();
}
