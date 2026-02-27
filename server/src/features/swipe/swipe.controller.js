import { swipeSchema } from '../../validations/swipe.schema.js'
import swipeService from './swipe.service.js'

export const handleSwipe = async (req, res, next) => {
  try {
    const parsed = swipeSchema.parse(req.body)

    const result = await swipeService.processSwipe(
      req.session.userId,
      parsed.repoId,
      parsed.type,
      req.ip,
      req.headers['user-agent']
    )

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}