import { Router } from 'express';
import { getSessionDetail, getSessions } from '../controllers/sessionController.js';

const router = Router();

router.get('/', getSessions);
router.get('/:sessionId', getSessionDetail);

export default router;
