interface SignerResponse {
  signature: string
  key_id_used: string
}

export async function signHashWithSigner(contentHash: string, keyId?: string): Promise<string> {
  const config = useRuntimeConfig()
  const signerUrl = config.signerServiceUrl || 'http://signer:4000'
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
