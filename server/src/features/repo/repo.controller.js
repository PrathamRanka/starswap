import repoService from './repo.service.js';
import { submitRepoSchema, updatePitchSchema } from '../../validations/repo.schema.js';

export const submitRepo = async (req, res, next) => {
  try {
    const parsed = submitRepoSchema.parse(req.body);

    const result = await repoService.submitRepository(
      req.session.userId,
      parsed.githubRepoId,
      parsed.pitch
    );

    res.json({ success: true, data: { repositoryId: result.id } });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: err.errors[0].message } });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: 'HTTP_ERROR', message: err.message } });
    }
    next(err);
  }
};

export const updatePitch = async (req, res, next) => {
  try {
    const parsed = updatePitchSchema.parse(req.body);

    const result = await repoService.updatePitch(
      req.session.userId,
      parsed.githubRepoId,
      parsed.pitch
    );

    res.json({ success: true, data: { repositoryId: result.id } });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: err.errors[0].message } });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: 'HTTP_ERROR', message: err.message } });
    }
    next(err);
  }
};

export const syncRepo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await repoService.syncRepository(id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: 'HTTP_ERROR', message: err.message } });
    }
    next(err);
  }
};

export const getFeed = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor || null;

    const result = await repoService.generateFeed(req.session.userId, cursor, Math.min(limit, 20));

    res.json({
      success: true,
      data: result.feed,
      meta: {
        nextCursor: result.nextCursor
      }
    });
  } catch (err) {
    next(err);
  }
};
