import express from 'express';
import { getAbuseLogs, getFlaggedUsers, toggleUserBlock, resetUserTrust } from './admin.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import adminMiddleware from '../../middleware/admin.middleware.js';

const router = express.Router();

// Apply auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/abuse-logs', getAbuseLogs);
router.get('/flagged-users', getFlaggedUsers);
router.post('/users/:id/block', toggleUserBlock);
router.post('/users/:id/reset-trust', resetUserTrust);

export default router;
