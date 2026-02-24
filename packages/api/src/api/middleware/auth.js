import { getAuth } from '../../config/firebaseAdmin.js';
import { HttpError } from '../../utils/errors.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new HttpError('Missing Authorization bearer token', 401);

    const decoded = await getAuth().verifyIdToken(match[1]);
    req.user = decoded;
    next();
  } catch (err) {
    next(err.statusCode ? err : new HttpError('Unauthorized', 401));
  }
}
