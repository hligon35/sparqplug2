export function assertNonEmptyString(value, fieldName = 'value') {
  if (typeof value !== 'string' || value.trim().length === 0) {
    const error = new Error(`${fieldName} must be a non-empty string`);
    error.statusCode = 400;
    throw error;
  }
}

export function assertObject(value, fieldName = 'value') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error(`${fieldName} must be an object`);
    error.statusCode = 400;
    throw error;
  }
}
