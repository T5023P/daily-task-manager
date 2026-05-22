/**
 * ONE-TIME MIGRATION SCRIPT
 * 
 * Moves data from old top-level collections:
 *   dailyTasks/{date} → users/{YOUR_UID}/dailyTasks/{date}
 *   longTermOrders/{id} → users/{YOUR_UID}/longTermOrders/{id}
 * 
 * Usage:
 *   1. Set YOUR_UID below to your Firebase Auth UID
 *   2. Temporarily set Firestore rules to allow all reads:
 *      match /{document=**} { allow read, write: if request.auth != null; }
 *   3. Run: node scripts/migrate-data.js
 *   4. After migration, restore the proper rules
 * 
 * NOTE: This uses the Firebase client SDK (not admin) so you need to be authenticated.
 *       Alternatively, run this from the Firebase Console's "Run query" or use Admin SDK.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, getDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// ⚠️ SET THIS TO YOUR UID (find it in Firebase Console → Authentication → Users)
const YOUR_UID = 'PASTE_YOUR_UID_HERE';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  if (YOUR_UID === 'PASTE_YOUR_UID_HERE') {
    console.error('ERROR: Set YOUR_UID in the script before running.');
    process.exit(1);
  }

  console.log(`Migrating data to users/${YOUR_UID}/...`);

  // Migrate dailyTasks
  console.log('\n--- Migrating dailyTasks ---');
  const dailySnap = await getDocs(collection(db, 'dailyTasks'));
  let dailyCount = 0;
  for (const docSnap of dailySnap.docs) {
    const targetRef = doc(db, 'users', YOUR_UID, 'dailyTasks', docSnap.id);
    const existing = await getDoc(targetRef);
    if (!existing.exists()) {
      await setDoc(targetRef, docSnap.data());
      console.log(`  ✓ Copied dailyTasks/${docSnap.id}`);
      dailyCount++;
    } else {
      console.log(`  - Skipped dailyTasks/${docSnap.id} (already exists)`);
    }
  }
  console.log(`Migrated ${dailyCount} daily task documents.`);

  // Migrate longTermOrders
  console.log('\n--- Migrating longTermOrders ---');
  const ltoSnap = await getDocs(collection(db, 'longTermOrders'));
  let ltoCount = 0;
  for (const docSnap of ltoSnap.docs) {
    const targetRef = doc(db, 'users', YOUR_UID, 'longTermOrders', docSnap.id);
    const existing = await getDoc(targetRef);
    if (!existing.exists()) {
      await setDoc(targetRef, docSnap.data());
      console.log(`  ✓ Copied longTermOrders/${docSnap.id}`);
      ltoCount++;
    } else {
      console.log(`  - Skipped longTermOrders/${docSnap.id} (already exists)`);
    }
  }
  console.log(`Migrated ${ltoCount} long-term order documents.`);

  console.log('\n✅ Migration complete!');
  console.log('You can now restore the proper Firestore rules.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
