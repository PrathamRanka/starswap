import express from 'express';
import { getMe, getMyRepos, getPublicProfile } from './user.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.get('/me/repos', getMyRepos);
router.get('/:id', getPublicProfile);

export default router;
