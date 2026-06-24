import { Router } from 'express';
import { createEvent } from '../controllers/eventController.js';
import { validateEvent } from '../middlewares/validateEvent.js';

const router = Router();

router.post('/', validateEvent, createEvent);

export default router;
