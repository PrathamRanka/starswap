import { z } from 'zod';

// Matches standard github owner/repo structure (no trailing slashes, exact segments)
const githubRepoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

export const submitRepoSchema = z.object({
  githubRepoId: z.string().regex(githubRepoRegex, 'Invalid format. Must be owner/repo (e.g. facebook/react)'),
  pitch: z.string().max(180, 'Pitch must be under 180 characters').optional()
});

export const updatePitchSchema = z.object({
  githubRepoId: z.string().regex(githubRepoRegex, 'Invalid format. Must be owner/repo (e.g. facebook/react)'),
  pitch: z.string().max(180, 'Pitch must be under 180 characters').optional()
});
