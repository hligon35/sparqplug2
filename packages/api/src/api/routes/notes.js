import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createCrudControllers } from '../controllers/crudControllerFactory.js';

export const notesRouter = Router();
const c = createCrudControllers('notes');

notesRouter.get('/', requireAuth, c.list);
notesRouter.post('/', requireAuth, c.create);
notesRouter.get('/:id', requireAuth, c.getById);
notesRouter.put('/:id', requireAuth, c.update);
notesRouter.delete('/:id', requireAuth, c.remove);
