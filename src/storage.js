const DATABASE_NAME = "agent-review-studio";
const DATABASE_VERSION = 1;
const RUN_STORE = "run-bundles";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("IndexedDB is unavailable in this browser."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(RUN_STORE)) {
        const store = database.createObjectStore(RUN_STORE, { keyPath: "storageKey" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local run storage."));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Local storage request failed."));
  });
}

export async function loadStoredRuns() {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(RUN_STORE, "readonly");
    const records = await requestResult(transaction.objectStore(RUN_STORE).getAll());
    database.close();

    return records.reduce((grouped, record) => {
      if (!grouped[record.projectId]) grouped[record.projectId] = [];
      grouped[record.projectId].push(record.run);
      return grouped;
    }, {});
  } catch {
    return {};
  }
}

export async function storeImportedRuns(projectId, runs) {
  const database = await openDatabase();
  const transaction = database.transaction(RUN_STORE, "readwrite");
  const store = transaction.objectStore(RUN_STORE);

  for (const run of runs) {
    store.put({
      storageKey: `${projectId}::${run.id}`,
      projectId,
      run,
      updatedAt: new Date().toISOString(),
    });
  }

  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Could not save imported runs."));
    transaction.onabort = () => reject(transaction.error || new Error("Saving imported runs was interrupted."));
  });
  database.close();
  return true;
}

export async function removeProjectRuns(projectId) {
  const database = await openDatabase();
  const transaction = database.transaction(RUN_STORE, "readwrite");
  const store = transaction.objectStore(RUN_STORE);
  const index = store.index("projectId");
  const keys = await requestResult(index.getAllKeys(projectId));
  keys.forEach((key) => store.delete(key));
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Could not remove local run data."));
  });
  database.close();
}
