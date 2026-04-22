import { clearAuthSession } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  await clearAuthSession(event)
  return { status: 'logged_out' }
})
