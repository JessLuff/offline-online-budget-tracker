let db;
let budgetVersion;

// Connect to database
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log('Databse update required');

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Error code: ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('Confirm database');

  // Create new database entry
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  // Set all entries from storage to variable
  const store = transaction.objectStore('BudgetStore');
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If offline entries exist, add them in bulk
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
          // If our returned response is not empty
          if (res.length !== 0) {
            // Create new database entry
            transaction = db.transaction(['BudgetStore'], 'readwrite');

            // Assign current storage
            const currentStore = transaction.objectStore('BudgetStore');

            // Clear processed offline entries
            currentStore.clear();
            console.log('Storage cleared');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Confirm app has connected to database
  if (navigator.onLine) {
    console.log('Backend connected');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Create new database entry
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  // Add offline entry to storage
  const store = transaction.objectStore('BudgetStore');
  store.add(record);
};

// Listen for app to reconnect
window.addEventListener('online', checkDatabase);
