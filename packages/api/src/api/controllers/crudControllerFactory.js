import { getFirestore } from '../../config/firebaseAdmin.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/errors.js';

export function createCrudControllers(collectionName) {
  const col = () => getFirestore().collection(collectionName);

  const list = asyncHandler(async (req, res) => {
    const snap = await col().limit(50).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ items });
  });

  const getById = asyncHandler(async (req, res) => {
    const doc = await col().doc(req.params.id).get();
    if (!doc.exists) throw new HttpError('Not found', 404);
    res.json({ item: { id: doc.id, ...doc.data() } });
  });

  const create = asyncHandler(async (req, res) => {
    const data = req.body || {};
    const createdAt = Date.now();
    const ref = await col().add({ ...data, createdAt });
    const doc = await ref.get();
    res.status(201).json({ item: { id: doc.id, ...doc.data() } });
  });

  const update = asyncHandler(async (req, res) => {
    const data = req.body || {};
    const ref = col().doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) throw new HttpError('Not found', 404);
    await ref.set({ ...data, updatedAt: Date.now() }, { merge: true });
    const updated = await ref.get();
    res.json({ item: { id: updated.id, ...updated.data() } });
  });

  const remove = asyncHandler(async (req, res) => {
    await col().doc(req.params.id).delete();
    res.status(204).send();
  });

  return { list, getById, create, update, remove };
}
