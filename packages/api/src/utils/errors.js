export class HttpError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'not_found' });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || 'Internal Server Error';
  res.status(statusCode).json({
    error: 'request_failed',
    message,
    details: err?.details
  });
}
