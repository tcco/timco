import { orderBy, where } from 'firebase/firestore';
import {
  getCollection,
  createDocument,
  removeDocument,
  patchDocument,
} from '@/services/firestoreService';
import { db } from '@/services/firebase';
import { writeBatch, doc } from 'firebase/firestore';

const SECTIONS_COLLECTION = 'current_sections';
const ITEMS_COLLECTION = 'current_items';

export async function getSections() {
  return getCollection(SECTIONS_COLLECTION);
}

export async function deleteSection(id: string) {
  await removeDocument(SECTIONS_COLLECTION, id);
  return [{ id }];
}

export async function addSection(title: string) {
  const newSection = await createDocument(SECTIONS_COLLECTION, { title });
  return [newSection];
}

export async function editSection({ title, id }: { title: string; id: string }) {
  await patchDocument(SECTIONS_COLLECTION, id, { title });
  return [{ id, title }];
}

export async function getItems(sectionId: string) {
  return getCollection(ITEMS_COLLECTION, [
    where('section_id', '==', sectionId),
    orderBy('order', 'asc'),
  ]);
}

export async function deleteItem(id: string) {
  await removeDocument(ITEMS_COLLECTION, id);
  return [{ id }];
}

export async function addItem(item: {
  title: string;
  section_id: string;
  description?: string;
  link?: string;
  order?: number;
}) {
  const newItem = await createDocument(ITEMS_COLLECTION, item);
  return [newItem];
}

export async function editItem({
  id,
  ...fields
}: {
  id: string;
  title: string;
  description: string;
  link: string;
}) {
  await patchDocument(ITEMS_COLLECTION, id, fields);
  return [{ id, ...fields }];
}

export async function updateOrder(newOrder: { id: string; order: number }[]) {
  const batch = writeBatch(db);
  newOrder.forEach((item) => {
    const docRef = doc(db, ITEMS_COLLECTION, item.id);
    batch.update(docRef, { order: item.order });
  });
  await batch.commit();
  return newOrder;
}
