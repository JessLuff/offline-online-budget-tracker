let db;
let offlineBudget;

// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDB', offlineBudget || 21);

request.onupgradeneeded = function (e) {
  console.log('DB needs update');

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('OfflineStorage', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Whoops! ${e.target.errorCode}`);
};

function checkDatabase() {
  
  // Create new entry in database
  let transaction = db.transaction(['OfflineStorage'], 'readwrite');

  const store = transaction.objectStore('OfflineStorage');

  // Get all entries
  const getAll = store.getAll();

  // On successful return,
  getAll.onsuccess = function () {
    // Add offline entries in bulk
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If there are offline entries
          if (res.length !== 0) {
            //  Create new database entry
            transaction = db.transaction(['OfflineStorage'], 'readwrite');

            // Assign current entry to variable
            const currentStore = transaction.objectStore('OfflineStorage');

            // Clear saved offline entries
            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Create a transaction on the OfflineStorage db with readwrite access
  const transaction = db.transaction(['OfflineStorage'], 'readwrite');

  // Access your OfflineStorage object store
  const store = transaction.objectStore('OfflineStorage');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
