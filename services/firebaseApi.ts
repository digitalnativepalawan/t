import { db } from './firebaseConfig';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { Vendor, AnyTransaction } from '../types';

// Helper to convert Firestore Timestamps to ISO strings recursively in an object.
const convertTimestamps = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(item => convertTimestamps(item));
    }
    if (typeof data === 'object' && data !== null) {
        if (data instanceof Timestamp) {
            return data.toDate().toISOString();
        }
        const convertedObject: { [key: string]: any } = {};
        for (const key in data) {
            convertedObject[key] = convertTimestamps(data[key]);
        }
        return convertedObject;
    }
    return data;
};


const fetchDataFromCollection = async <T>(collectionName: string, orderByField: string = 'createdAt', orderDirection: 'desc' | 'asc' = 'desc'): Promise<T[]> => {
    const coll = collection(db, collectionName);
    const q = query(coll, orderBy(orderByField, orderDirection));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
    } as T));
}

// --- Vendor Functions ---

export const getVendorsFirestore = () => fetchDataFromCollection<Vendor>('vendors');

export const addVendorFirestore = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
    const docRef = await addDoc(collection(db, 'vendors'), {
        ...vendorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    // Note: Returning a local object for immediate UI update. `fetchData` will get the server timestamp.
    return {
        ...vendorData,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};

export const updateVendorFirestore = async (vendorId: string, updates: Partial<Omit<Vendor, 'id'>>): Promise<void> => {
    const vendorDoc = doc(db, 'vendors', vendorId);
    await updateDoc(vendorDoc, {
        ...updates,
        updatedAt: serverTimestamp()
    });
};

export const deleteVendorFirestore = async (vendorId: string): Promise<void> => {
    const vendorDoc = doc(db, 'vendors', vendorId);
    await deleteDoc(vendorDoc);
};


// --- Transaction Functions ---

export const getTransactionsFirestore = () => fetchDataFromCollection<AnyTransaction>('transactions', 'date');


export const addTransactionFirestore = async (transactionData: Omit<AnyTransaction, 'id'>): Promise<AnyTransaction> => {
    const docRef = await addDoc(collection(db, 'transactions'), transactionData);
    // Fix: Cast the return object to AnyTransaction. Spreading a discriminated union type like
    // AnyTransaction can cause TypeScript to lose the specific type (Income or Expense),
    // leading to a type error. The cast ensures the compiler that the object is valid.
    return {
        ...transactionData,
        id: docRef.id
    } as AnyTransaction;
};