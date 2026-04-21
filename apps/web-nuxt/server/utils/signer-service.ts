interface SignerResponse {
  signature: string
  key_id_used: string
}

interface SignerGenerateKeyResponse {
  fingerprint: string
  key_id: string
  algorithm: string
}

interface SignerVerifyResponse {
  valid: boolean
}

function getSignerBaseUrl() {
  const config = useRuntimeConfig()
  return config.signerServiceUrl || 'http://signer:4000'
}

export async function signHashWithSigner(contentHash: string, keyId?: string): Promise<string> {
  const signerUrl = getSignerBaseUrl()
  const response = await $fetch<SignerResponse>(`${signerUrl}/sign`, {
    method: 'POST',
    body: {
      content_hash: contentHash,
      key_id: keyId || undefined,
    },
  })

  if (!response.signature?.trim())
    throw createError({ statusCode: 500, statusMessage: 'Signer service returned empty signature' })

  return response.signature.trim()
}

export async function generateKeyWithSigner(name: string, handle: string) {
  const signerUrl = getSignerBaseUrl()
  return await $fetch<SignerGenerateKeyResponse>(`${signerUrl}/keys/generate`, {
    method: 'POST',
    body: {
      name,
      handle,
    },
  })
}

export async function verifySignatureWithSigner(signature: string, contentHash: string) {
  const signerUrl = getSignerBaseUrl()
  const response = await $fetch<SignerVerifyResponse>(`${signerUrl}/verify`, {
    method: 'POST',
    body: {
      signature,
      content_hash: contentHash,
    },
  })

  return response.valid
}
