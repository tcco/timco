import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, storage } from './firebase';

export async function uploadImage(file: File) {
  const imageName = `${Math.random()}-${file.name}`
    .replace(' ', '_')
    .replace('/', '');

  const storageRef = ref(storage, `images/${imageName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, 'gallery'), {
    img: url,
    name: file.name,
    storageName: imageName, // Storing this to easily delete later
  });

  return [{ id: docRef.id, img: url, name: file.name }];
}

export async function getImages() {
  const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function deleteImage({
  id,
  imageName,
}: {
  id: string;
  imageName: string; // This needs to be the storage path/name now
}) {
  await deleteDoc(doc(db, 'gallery', id));

  // Assuming imageName passed here is the stored file name (not the full URL)
  // If the previous code passed the full URL, we might need to extract the ref.
  // Based on the old code: it passed `imageName` which was used in `storage.remove`.
  // So it should be fine.

  // Create a reference to the file to delete
  const fileRef = ref(storage, `images/${imageName}`);
  await deleteObject(fileRef);
}

export async function downloadImage(imageName: string) {
  const starsRef = ref(storage, `images/${imageName}`);
  // Get the download URL
  return await getDownloadURL(starsRef)
}

export async function reorderGallery(
  newOrder: { id: string; order: number }[]
) {
  const batch = writeBatch(db);

  newOrder.forEach((item) => {
    const docRef = doc(db, 'gallery', item.id);
    batch.update(docRef, { order: item.order });
  });

  await batch.commit();

  return newOrder;
}
