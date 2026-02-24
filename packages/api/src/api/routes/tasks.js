import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createCrudControllers } from '../controllers/crudControllerFactory.js';

export const tasksRouter = Router();
const c = createCrudControllers('tasks');

tasksRouter.get('/', requireAuth, c.list);
tasksRouter.post('/', requireAuth, c.create);
tasksRouter.get('/:id', requireAuth, c.getById);
tasksRouter.put('/:id', requireAuth, c.update);
tasksRouter.delete('/:id', requireAuth, c.remove);
