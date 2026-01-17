import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export async function getSections() {
  try {
    console.log('Fetching current_sections from Firestore...');
    const querySnapshot = await getDocs(collection(db, 'current_sections'));
    const sections = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    console.log(`Found ${sections.length} sections:`, sections);
    return sections;
  } catch (error) {
    console.error('Error in getSections:', error);
    throw error;
  }
}

export async function deleteSection(id: string) {
  await deleteDoc(doc(db, 'current_sections', id));
  // Note: This does not automatically delete items in this section.
  // In a real app we might want to query and batch delete items with section_id == id
  return [{ id }];
}

export async function addSection(title: string) {
  const docRef = await addDoc(collection(db, 'current_sections'), { title });
  return [{ id: docRef.id, title }];
}

export async function editSection({
  title,
  id,
}: {
  title: string;
  id: string; // Changed to string for Firestore ID
}) {
  const docRef = doc(db, 'current_sections', id);
  await updateDoc(docRef, { title });
  return [{ id, title }];
}

export async function getItems(sectionId: string) {
  try {
    console.log(`Fetching items for section ID: ${sectionId}`);
    const q = query(
      collection(db, 'current_items'),
      where('section_id', '==', sectionId),
      orderBy('order', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    console.log(`Items found for section ${sectionId}:`, items);
    return items;
  } catch (error) {
    console.error(`Error in getItems for section ${sectionId}:`, error);
    // Many Firestore errors (like missing index) provide a link in the error object.
    throw error;
  }
}

export async function deleteItem(id: string) {
  await deleteDoc(doc(db, 'current_items', id));
  return [{ id }];
}

export async function addItem({
  title,
  section_id,
  description,
  link,
  order,
}: {
  title: string;
  section_id: string;
  description?: string;
  link?: string;
  order?: number;
}) {
  const newItem = { title, section_id, description, link, order };
  // Remove undefined fields to prevent Firebase invalid-argument error
  const sanitizedItem = Object.fromEntries(
    Object.entries(newItem).filter(([_, v]) => v !== undefined)
  );

  const docRef = await addDoc(collection(db, 'current_items'), sanitizedItem);
  return [{ id: docRef.id, title, ...sanitizedItem }];
}

export async function editItem({
  id,
  title,
  description,
  link,
}: {
  id: string;
  title: string;
  description: string;
  link: string;
}) {
  const docRef = doc(db, 'current_items', id);
  const updatedFields = { title, description, link };
  // Remove undefined fields to prevent Firebase invalid-argument error
  const sanitizedFields = Object.fromEntries(
    Object.entries(updatedFields).filter(([_, v]) => v !== undefined)
  );

  await updateDoc(docRef, sanitizedFields);
  return [{ id, title, ...sanitizedFields }];
}

export async function updateOrder(newOrder: { id: string; order: number }[]) {
  const batch = writeBatch(db);

  newOrder.forEach((item) => {
    const docRef = doc(db, 'current_items', item.id);
    batch.update(docRef, { order: item.order });
  });

  await batch.commit();
  return newOrder;
}
