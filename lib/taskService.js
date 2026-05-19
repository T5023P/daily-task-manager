import { db } from './firebase';
import { 
  doc, 
  collection,
  onSnapshot, 
  setDoc, 
  updateDoc, 
  getDoc,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { addDays, format, parseISO } from 'date-fns';

const COLLECTION_NAME = "dailyTasks";

// Simple ID generator to avoid uuid version issues
const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

/**
 * Helper to get a document reference
 */
const getTaskDocRef = (dateStr) => {
  if (!dateStr) throw new Error("dateStr is required for Firestore operations");
  return doc(db, COLLECTION_NAME, dateStr);
};

/**
 * 1. getTasksForDate
 */
export const getTasksForDate = (dateStr, onUpdate) => {
  if (!dateStr) return () => {};
  try {
    const docRef = getTaskDocRef(dateStr);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate(data.tasks || []);
      } else {
        onUpdate([]);
      }
    }, (error) => {
      console.error("Firestore onSnapshot error (DailyTasks):", error);
      onUpdate([]);
    });
  } catch (err) {
    console.error("Error setting up onSnapshot:", err);
    onUpdate([]);
    return () => {};
  }
};

/**
 * 2. addTask
 */
export const addTask = async (dateStr, taskText, section = "A") => {
  try {
    const docRef = getTaskDocRef(dateStr);
    const docSnap = await getDoc(docRef);
    let order = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      order = data.tasks ? data.tasks.length : 0;
    }

    const newTask = {
      id: generateId(),
      text: taskText,
      color: "yellow",
      section: section,
      createdAt: new Date().toISOString(),
      order: order
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        tasks: arrayUnion(newTask)
      });
    } else {
      await setDoc(docRef, { tasks: [newTask] });
    }
    console.log("Task saved successfully:", newTask.id);
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

/**
 * 3. updateTask
 */
export const updateTask = async (dateStr, taskId, updates) => {
  try {
    const docRef = getTaskDocRef(dateStr);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedTasks = data.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      
      await updateDoc(docRef, { tasks: updatedTasks });
    }
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

/**
 * 4. deleteTask
 */
export const deleteTask = async (dateStr, taskId) => {
  try {
    const docRef = getTaskDocRef(dateStr);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const taskToRemove = data.tasks.find(task => task.id === taskId);
      
      if (taskToRemove) {
        await updateDoc(docRef, {
          tasks: arrayRemove(taskToRemove)
        });
      }
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

/**
 * 5. copyUnfinishedTasksToToday
 */
export const copyUnfinishedTasksToToday = async (dateStr) => {
  try {
    const currentDocRef = getTaskDocRef(dateStr);
    const currentSnap = await getDoc(currentDocRef);
    
    if (!currentSnap.exists()) return { copiedCount: 0 };
    
    const currentTasks = currentSnap.data().tasks || [];
    const unfinishedTasks = currentTasks.filter(task => task.color !== 'green');
    
    if (unfinishedTasks.length === 0) return { copiedCount: 0 };
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const todayDocRef = getTaskDocRef(todayStr);
    const todaySnap = await getDoc(todayDocRef);
    
    let todayTasks = todaySnap.exists() ? (todaySnap.data().tasks || []) : [];
    
    const tasksToCopy = unfinishedTasks.filter(unfTask => 
      !todayTasks.some(nt => nt.text?.toLowerCase() === unfTask.text?.toLowerCase())
    );
    
    if (tasksToCopy.length === 0) return { copiedCount: 0, todayStr };

    const newTasksToCopy = tasksToCopy.map((task, index) => ({
      ...task,
      id: generateId(),
      color: 'yellow',
      createdAt: new Date().toISOString(),
      order: index
    }));

    const shiftedExistingTasks = todayTasks.map(task => ({
      ...task,
      order: task.order + newTasksToCopy.length
    }));

    const combinedTasks = [...newTasksToCopy, ...shiftedExistingTasks];

    if (todaySnap.exists()) {
      await updateDoc(todayDocRef, { tasks: combinedTasks });
    } else {
      await setDoc(todayDocRef, { tasks: combinedTasks });
    }

    return { copiedCount: tasksToCopy.length, todayStr };
  } catch (error) {
    console.error("Error copying tasks:", error);
    throw error;
  }
};

/**
 * 5b. copySelectedTasksToDate - copies specific tasks to a chosen date, color becomes yellow
 */
export const copySelectedTasksToDate = async (sourceDateStr, taskIds, targetDateStr) => {
  try {
    const sourceDocRef = getTaskDocRef(sourceDateStr);
    const sourceSnap = await getDoc(sourceDocRef);
    
    if (!sourceSnap.exists()) return { copiedCount: 0 };
    
    const sourceTasks = sourceSnap.data().tasks || [];
    const selectedTasks = sourceTasks.filter(t => taskIds.includes(t.id));
    
    if (selectedTasks.length === 0) return { copiedCount: 0 };
    
    const targetDocRef = getTaskDocRef(targetDateStr);
    const targetSnap = await getDoc(targetDocRef);
    
    let targetTasks = targetSnap.exists() ? (targetSnap.data().tasks || []) : [];
    
    const tasksToCopy = selectedTasks.filter(st => 
      !targetTasks.some(tt => tt.text?.toLowerCase() === st.text?.toLowerCase())
    );
    
    if (tasksToCopy.length === 0) return { copiedCount: 0 };

    const newTasks = tasksToCopy.map((task, index) => ({
      ...task,
      id: generateId(),
      color: 'yellow',
      createdAt: new Date().toISOString(),
      order: index
    }));

    const shiftedExisting = targetTasks.map(task => ({
      ...task,
      order: (task.order || 0) + newTasks.length
    }));

    const combined = [...newTasks, ...shiftedExisting];

    if (targetSnap.exists()) {
      await updateDoc(targetDocRef, { tasks: combined });
    } else {
      await setDoc(targetDocRef, { tasks: combined });
    }

    return { copiedCount: tasksToCopy.length };
  } catch (error) {
    console.error("Error copying selected tasks:", error);
    throw error;
  }
};

/**
 * 6. addPayment
 */
export const addPayment = async (dateStr, paymentData) => {
  try {
    const docRef = getTaskDocRef(dateStr);
    const docSnap = await getDoc(docRef);
    
    let order = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      order = data.tasks ? data.tasks.length : 0;
    }

    const newPayment = {
      id: generateId(),
      type: 'payment',
      section: 'C',
      color: 'red',
      text: paymentData.name || 'New Payment', 
      name: paymentData.name || '',
      amount: paymentData.amount || 0,
      expectedTime: paymentData.expectedTime || 'Today EOD',
      createdAt: new Date().toISOString(),
      order: order
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        tasks: arrayUnion(newPayment)
      });
    } else {
      await setDoc(docRef, { tasks: [newPayment] });
    }
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

// ============================================================
// LONG-TERM ORDERS
// ============================================================

const LONG_TERM_COLLECTION = "longTermOrders";

export const getLongTermOrders = (currentDateStr, onUpdate) => {
  try {
    const colRef = collection(db, LONG_TERM_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = allOrders.filter(order => {
        if (order.color !== 'green') return true;
        return order.completedDate === currentDateStr;
      });
      onUpdate(filtered);
    }, (error) => {
      console.error("Firestore onSnapshot error (LongTermOrders):", error);
      onUpdate([]);
    });
  } catch (err) {
    console.error("Error setting up onSnapshot (LongTerm):", err);
    onUpdate([]);
    return () => {};
  }
};

export const addLongTermOrder = async (orderData) => {
  try {
    const colRef = collection(db, LONG_TERM_COLLECTION);
    await addDoc(colRef, {
      text: orderData.text || '',
      deliveryDate: orderData.deliveryDate || '',
      color: 'red',
      completedDate: null,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding long term order:", error);
    throw error;
  }
};

export const updateLongTermOrder = async (orderId, updates, currentDateStr) => {
  try {
    const docRef = doc(db, LONG_TERM_COLLECTION, orderId);
    if (updates.color === 'green') {
      updates.completedDate = currentDateStr;
    } else if (updates.color && updates.color !== 'green') {
      updates.completedDate = null;
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating long term order:", error);
    throw error;
  }
};

export const deleteLongTermOrder = async (orderId) => {
  try {
    const docRef = doc(db, LONG_TERM_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting long term order:", error);
    throw error;
  }
};

export const getDaysWithTasks = async (yearMonthStr) => {
  const startId = `${yearMonthStr}-01`;
  const endId = `${yearMonthStr}-31`;
  const q = query(
    collection(db, COLLECTION_NAME),
    where('__name__', '>=', startId),
    where('__name__', '<=', endId)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    const days = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.tasks && data.tasks.length > 0) {
        days.push(doc.id);
      }
    });
    return days;
  } catch (error) {
    console.error("Error fetching days with tasks:", error);
    return [];
  }
};
