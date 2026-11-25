/**
 * Shared class-transformer helpers for normalizing optional DTO fields.
 * Converts null, undefined, and empty/whitespace strings into undefined
 * so @IsOptional() skips validation and filters are treated as omitted.
 */

/** Normalizes null, undefined, and empty/whitespace strings to undefined. */
export const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return value;
};

/** Normalizes null, undefined, and empty/whitespace strings to undefined, otherwise converts to Number. */
export const emptyToNumber = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : Number(trimmed);
  }
  return value;
};

/** Normalizes null, undefined, and empty/whitespace strings to undefined, otherwise converts boolean strings. */
export const emptyToBoolean = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === '') return undefined;
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
  }
  return value;
};
