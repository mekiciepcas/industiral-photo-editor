import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DeviceType } from "./templates";

export interface PhotoRecord {
  id: string;
  deviceType: DeviceType;
  blob: Blob;
  upscaledBlob?: Blob;
  createdAt: number;
  width: number;
  height: number;
  upscaledWidth?: number;
  upscaledHeight?: number;
  note?: string;
}

interface PhotoDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoRecord;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "ups-photo-studio";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PhotoDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PhotoDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  if (!dbPromise) {
    dbPromise = openDB<PhotoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("photos")) {
          const store = db.createObjectStore("photos", { keyPath: "id" });
          store.createIndex("by-createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function savePhoto(
  record: Omit<PhotoRecord, "id" | "createdAt"> & { id?: string; createdAt?: number }
): Promise<string> {
  const db = await getDB();
  const id =
    record.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const full: PhotoRecord = {
    ...record,
    id,
    createdAt: record.createdAt ?? Date.now(),
  };
  await db.put("photos", full);
  return id;
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await getDB();
  return db.get("photos", id);
}

export async function updatePhoto(
  id: string,
  patch: Partial<PhotoRecord>
): Promise<PhotoRecord | undefined> {
  const db = await getDB();
  const existing = await db.get("photos", id);
  if (!existing) return undefined;
  const updated: PhotoRecord = { ...existing, ...patch, id };
  await db.put("photos", updated);
  return updated;
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("photos", id);
}

export async function listPhotos(): Promise<PhotoRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("photos", "by-createdAt");
  return all.reverse();
}

export async function clearPhotos(): Promise<void> {
  const db = await getDB();
  await db.clear("photos");
}
