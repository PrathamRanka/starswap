import { z } from 'zod'

export const swipeSchema = z.object({
  repoId: z.string().uuid(),
  type: z.enum(['STAR', 'SKIP'])
})