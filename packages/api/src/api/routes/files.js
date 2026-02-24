import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createCrudControllers } from '../controllers/crudControllerFactory.js';

export const filesRouter = Router();
const c = createCrudControllers('files');

filesRouter.get('/', requireAuth, c.list);
filesRouter.post('/', requireAuth, c.create);
filesRouter.get('/:id', requireAuth, c.getById);
filesRouter.put('/:id', requireAuth, c.update);
filesRouter.delete('/:id', requireAuth, c.remove);
