import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc 
} from 'firebase/firestore';

/**
 * One-time utility function to migrate legacy shared data into a specific user's subcollections.
 * Can be run from the client console or admin scripts.
 * 
 * @param {string} targetUid - The Firebase Auth UID of the user who should own the legacy data.
 */
export async function migrateLegacyDataToUser(targetUid) {
  if (!targetUid) {
    throw new Error('Target UID is required for migration');
  }

  console.log(`Starting migration of legacy data to user: ${targetUid}...`);

  let dailyTasksMigrated = 0;
  let longTermOrdersMigrated = 0;

  try {
    // 1. Migrate Daily Tasks
    const legacyDailyTasksCol = collection(db, 'dailyTasks');
    const dailyTasksSnapshot = await getDocs(legacyDailyTasksCol);
    
    for (const docSnap of dailyTasksSnapshot.docs) {
      const dateStr = docSnap.id;
      const data = docSnap.data();
      
      // Target path: users/{targetUid}/dailyTasks/{dateStr}
      const targetDocRef = doc(db, 'users', targetUid, 'dailyTasks', dateStr);
      await setDoc(targetDocRef, data, { merge: true });
      dailyTasksMigrated++;
    }

    console.log(`Successfully migrated ${dailyTasksMigrated} daily tasks documents.`);

    // 2. Migrate Long Term Orders
    const legacyLtoCol = collection(db, 'longTermOrders');
    const ltoSnapshot = await getDocs(legacyLtoCol);
    
    for (const docSnap of ltoSnapshot.docs) {
      const orderId = docSnap.id;
      const data = docSnap.data();
      
      // Target path: users/{targetUid}/longTermOrders/{orderId}
      const targetDocRef = doc(db, 'users', targetUid, 'longTermOrders', orderId);
      await setDoc(targetDocRef, data, { merge: true });
      longTermOrdersMigrated++;
    }

    console.log(`Successfully migrated ${longTermOrdersMigrated} long-term order documents.`);
    console.log('Migration completed successfully!');
    
    return {
      success: true,
      dailyTasksMigrated,
      longTermOrdersMigrated
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
