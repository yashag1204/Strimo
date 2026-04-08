import { openDB } from 'idb';

const DB_NAME = 'StrimoDB';
const DB_VERSION = 1;

let dbPromise;

export const initDB = () => {
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('shows')) {
        db.createObjectStore('shows', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    },
  });
};

export const saveShows = async (shows) => {
  const db = await dbPromise;
  const tx = db.transaction('shows', 'readwrite');
  const store = tx.objectStore('shows');
  for (const show of shows) {
    await store.put(show);
  }
  await tx.done;
};

export const getAllShows = async () => {
  const db = await dbPromise;
  return db.getAll('shows');
};

export const getShowById = async (id) => {
  const db = await dbPromise;
  return db.get('shows', id);
};

export const setLastSync = async (timestamp) => {
  const db = await dbPromise;
  await db.put('metadata', timestamp, 'lastSync');
};

export const getLastSync = async () => {
  const db = await dbPromise;
  return db.get('metadata', 'lastSync');
};
