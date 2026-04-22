import { getCurrentProfile } from '../utils/current-user'

export default defineEventHandler(async (event) => {
  const profile = await getCurrentProfile(event)
  return { profile }
})
