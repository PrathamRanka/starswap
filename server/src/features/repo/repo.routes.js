import express from 'express';
import { submitRepo, syncRepo, getFeed } from './repo.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', submitRepo);
router.post('/:id/sync', syncRepo);
router.get('/feed', getFeed);

export default router;
