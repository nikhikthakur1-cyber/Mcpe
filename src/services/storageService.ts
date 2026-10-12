import { ProjectData } from '../types';

const DB_NAME = 'bedrock_texture_studio_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const ACTIVE_PROJECT_KEY = 'active_project_id';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectToStorage(project: ProjectData): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const updated = {
      ...project,
      updatedAt: Date.now(),
    };
    const req = store.put(updated);

    req.onsuccess = () => {
      try {
        localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
      } catch {
        // LocalStorage fallback if quota or cookies restricted
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadProjectFromStorage(id?: string): Promise<ProjectData | null> {
  const targetId = id || (typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_PROJECT_KEY) : null);
  if (!targetId) return null;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.get(targetId);

    req.onsuccess = () => {
      if (req.result) {
        resolve(req.result as ProjectData);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listSavedProjects(): Promise<{ id: string; name: string; updatedAt: number }[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as ProjectData[]).map((p) => ({
          id: p.id,
          name: p.name || 'Untitled Pack',
          updatedAt: p.updatedAt || 0,
        }));
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteProjectFromStorage(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.delete(id);

    req.onsuccess = () => {
      if (localStorage.getItem(ACTIVE_PROJECT_KEY) === id) {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}
