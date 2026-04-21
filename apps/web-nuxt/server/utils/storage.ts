export type StorageProvider = 'none' | 's3' | 'custom'

export interface StorageObjectInput {
  key: string
  contentType: string
  body: Buffer
}

export interface StorageAdapter {
  provider: StorageProvider
  storeObject(input: StorageObjectInput): Promise<{ objectUrl: string }>
}

export function resolveStorageProvider(): StorageProvider {
  const config = useRuntimeConfig()
  const provider = (config.storageProvider ?? 'none') as StorageProvider
  return provider
}
