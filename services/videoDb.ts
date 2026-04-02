import { VideoContent } from '../types';
import { INITIAL_VIDEOS } from '../components/VideoModule';

const DB_NAME = 'DrNinaDB';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllVideos = async (): Promise<VideoContent[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let videos = request.result as VideoContent[];
      // If DB is empty, initialize with default videos
      if (videos.length === 0) {
        videos = INITIAL_VIDEOS;
        // Seed the DB
        const seedTx = db.transaction(STORE_NAME, 'readwrite');
        const seedStore = seedTx.objectStore(STORE_NAME);
        INITIAL_VIDEOS.forEach(v => seedStore.add(v));
      }
      resolve(videos);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveVideoToDB = async (video: VideoContent): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(video); // put handles both add and update

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteVideoFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
