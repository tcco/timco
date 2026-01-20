import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    query,
    getDoc,
    QueryConstraint,
    DocumentData,
    WithFieldValue,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sanitizes an object by removing all undefined fields.
 */
export function sanitizeData<T extends object>(data: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as Partial<T>;
}

/**
 * Fetches all documents from a collection with optional constraints.
 */
export async function getCollection<T = DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[] = []
): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
    }));
}

/**
 * Fetches a single document by ID.
 */
export async function getDocument<T = DocumentData>(
    collectionName: string,
    id: string
): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...(docSnap.data() as T), id: docSnap.id };
    }
    return null;
}

/**
 * Adds a new document to a collection.
 */
export async function createDocument<T extends WithFieldValue<DocumentData>>(
    collectionName: string,
    data: T
): Promise<{ id: string } & T> {
    const sanitized = sanitizeData(data as any) as T;
    const docRef = await addDoc(collection(db, collectionName), sanitized);
    return { id: docRef.id, ...sanitized };
}

/**
 * Updates an existing document.
 */
export async function patchDocument<T extends object>(
    collectionName: string,
    id: string,
    data: Partial<T>
): Promise<void> {
    const sanitized = sanitizeData(data);
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, sanitized as any);
}

/**
 * Deletes a document by ID.
 */
export async function removeDocument(
    collectionName: string,
    id: string
): Promise<void> {
    await deleteDoc(doc(db, collectionName, id));
}
