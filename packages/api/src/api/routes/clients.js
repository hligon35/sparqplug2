import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createCrudControllers } from '../controllers/crudControllerFactory.js';

export const clientsRouter = Router();
const c = createCrudControllers('clients');

clientsRouter.get('/', requireAuth, c.list);
clientsRouter.post('/', requireAuth, c.create);
clientsRouter.get('/:id', requireAuth, c.getById);
clientsRouter.put('/:id', requireAuth, c.update);
clientsRouter.delete('/:id', requireAuth, c.remove);
