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

  const snapshot = await getDocs(query(collection(db, 'gallery'), orderBy('order', 'desc')));
  const lastOrder = snapshot.docs[0]?.data()?.order || 0;

  const docRef = await addDoc(collection(db, 'gallery'), {
    img: url,
    name: file.name,
    storageName: imageName,
    order: lastOrder + 1,
  });

  return [{ id: docRef.id, img: url, name: file.name, order: lastOrder + 1 }];
}

export async function getImages() {
  try {
    console.log('Fetching gallery images...');
    const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const images = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    console.log('Gallery images fetched:', images);
    return images;
  } catch (error) {
    console.error('Error in getImages:', error);
    throw error;
  }
}

export async function deleteImage({
  id,
  imageName,
  imageUrl,
}: {
  id: string;
  imageName?: string;
  imageUrl?: string;
}) {
  await deleteDoc(doc(db, 'gallery', id));

  let finalPath = '';
  if (imageName) {
    finalPath = `images/${imageName}`;
  } else if (imageUrl) {
    // Extract path from Firebase Storage URL
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[PATH]?alt=media
    const match = imageUrl.match(/\/o\/([^?]+)/);
    if (match) {
      finalPath = decodeURIComponent(match[1]);
    }
  }

  if (finalPath) {
    const fileRef = ref(storage, finalPath);
    await deleteObject(fileRef);
  }
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
