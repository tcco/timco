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
  const querySnapshot = await getDocs(collection(db, 'current_sections'));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
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
  const q = query(
    collection(db, 'current_items'),
    where('section_id', '==', sectionId),
    orderBy('order', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
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
}: {
  title: string;
  section_id: string;
  description?: string;
  link?: string;
}) {
  const newItem = { title, section_id, description, link };
  const docRef = await addDoc(collection(db, 'current_items'), newItem);
  return [{ id: docRef.id, ...newItem }];
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
  await updateDoc(docRef, { title, description, link });
  return [{ id, title, description, link }];
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
