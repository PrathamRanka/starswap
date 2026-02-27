import { z } from 'zod';

export const submitRepoSchema = z.object({
  githubRepoId: z.string().min(1, 'GitHub Repo ID is required'),
  pitch: z.string().max(180, 'Pitch must be under 180 characters').optional()
});
