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
    if (err.message && (err.message.includes('Already swiped') || err.message.includes('P2002'))) {
      // Gracefully sink duplicate race-condition requests
      return res.status(200).json({ 
        success: true, 
        message: 'Swipe already registered (Ghost duplicate suppressed)' 
      });
    }
    next(err)
  }
}