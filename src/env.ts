import { z } from 'zod/v4'

const EnvSchema = z.object({
  VITE_DATABASE_URL: z.string().url('VITE_DATABASE_URL must be a valid URL'),
  VITE_PARTYKIT_HOST: z.string().min(1, 'VITE_PARTYKIT_HOST is required'),
})

export type Env = z.infer<typeof EnvSchema>

const { data: env, error } = EnvSchema.safeParse(import.meta.env)

if (error) {
  console.error('❌ Invalid environment variables:')
  console.error(JSON.stringify(z.treeifyError(error), null, 2))
  throw new Error('Invalid environment variables')
}

export default env!
