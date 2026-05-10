import { z } from 'zod/v4'

const EnvSchema = z.object({
  VITE_DATABASE_URL: z.string().url('VITE_DATABASE_URL must be a valid URL'),
  VITE_PARTYKIT_HOST: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>

// Use process.env for server-side, import.meta.env for client-side
const envSource = typeof process !== 'undefined' ? process.env : import.meta.env

const { data: env, error } = EnvSchema.safeParse(envSource)

if (error) {
  console.error('❌ Invalid environment variables:')
  console.error(JSON.stringify(z.treeifyError(error), null, 2))
  throw new Error('Invalid environment variables')
}

export default env!
