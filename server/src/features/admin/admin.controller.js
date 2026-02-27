import adminService from './admin.service.js';

export const getAbuseLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const logs = await adminService.fetchAbuseLogs(limit, offset);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

export const getFlaggedUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const users = await adminService.fetchFlaggedUsers(limit);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const toggleUserBlock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.toggleUserBlock(req.session.userId, id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: 'HTTP_ERROR', message: err.message } });
    }
    next(err);
  }
};

export const resetUserTrust = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.resetUserTrust(req.session.userId, id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: 'HTTP_ERROR', message: err.message } });
    }
    next(err);
  }
};
