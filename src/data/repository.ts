import type { AppData } from '@/domain/types'

export interface ChurnRepository {
  load(): AppData
  save(data: AppData): void
  clear(): void
}

export const STORAGE_KEY = 'churncenter.app.v1'
