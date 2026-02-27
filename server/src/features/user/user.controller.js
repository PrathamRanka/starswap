import userService from './user.service.js';

export const getMe = async (req, res, next) => {
  try {
    const profile = await userService.getPrivateProfile(req.session.userId);
    res.json({ success: true, data: profile });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: 'HTTP_ERROR', message: err.message } });
    }
    next(err);
  }
};

export const getMyRepos = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || null;

    const repos = await userService.getUserRepositories(req.session.userId, limit, cursor);
    res.json({ success: true, data: repos });
  } catch (err) {
    next(err);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await userService.getPublicProfileById(id);
    res.json({ success: true, data: profile });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: 'HTTP_ERROR', message: err.message } });
    }
    next(err);
  }
};
