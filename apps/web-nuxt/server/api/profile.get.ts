import { getCurrentProfile } from '../utils/current-user'

export default defineEventHandler(async () => {
  const profile = await getCurrentProfile()
  return { profile }
})
