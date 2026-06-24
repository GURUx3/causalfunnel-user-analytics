import { Router } from 'express';
import { getHeatmap, getPageUrls } from '../controllers/eventController.js';
import eventRoutes from './eventRoutes.js';
import sessionRoutes from './sessionRoutes.js';

const router = Router();

router.use('/events', eventRoutes);
router.use('/sessions', sessionRoutes);
router.get('/heatmap', getHeatmap);
router.get('/pages', getPageUrls);

export default router;
