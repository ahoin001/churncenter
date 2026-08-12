import { createEmptyAppData, SCHEMA_VERSION, type AppData } from '@/domain/types'
import { STORAGE_KEY, type ChurnRepository } from './repository'
import { migrate } from './migrations'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export class LocalStorageRepository implements ChurnRepository {
  load(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return createEmptyAppData()
      const parsed: unknown = JSON.parse(raw)
      if (!isObject(parsed)) return createEmptyAppData()
      return migrate(parsed)
    } catch {
      return createEmptyAppData()
    }
  }

  save(data: AppData): void {
    const payload: AppData = {
      ...data,
      meta: {
        ...data.meta,
        schemaVersion: SCHEMA_VERSION,
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const localRepository = new LocalStorageRepository()
