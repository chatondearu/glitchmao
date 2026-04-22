import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getCurrentProfile } from './current-user'

export interface ProfilePermissions {
  canRead: boolean
  canWrite: boolean
  canManageKeys: boolean
}

export async function getActiveProfilePermissions(event: H3Event): Promise<ProfilePermissions> {
  const profile = await getCurrentProfile(event)
  if (!profile) {
    return {
      canRead: false,
      canWrite: false,
      canManageKeys: false,
    }
  }

  return {
    canRead: true,
    canWrite: true,
    canManageKeys: true,
  }
}

export async function requireWritePermission(event: H3Event) {
  const permissions = await getActiveProfilePermissions(event)
  if (!permissions.canWrite)
    throw createError({ statusCode: 403, statusMessage: 'Write permission required' })
}

export async function requireKeyManagementPermission(event: H3Event) {
  const permissions = await getActiveProfilePermissions(event)
  if (!permissions.canManageKeys)
    throw createError({ statusCode: 403, statusMessage: 'Key management permission required' })
}
