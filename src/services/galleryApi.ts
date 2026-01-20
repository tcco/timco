import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  query,
  orderBy,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import {
  getCollection,
  createDocument,
  removeDocument,
} from '@/services/firestoreService';

const GALLERY_COLLECTION = 'gallery';

export async function uploadImage(file: File) {
  const imageName = `${Math.random()}-${file.name}`
    .replace(' ', '_')
    .replace('/', '');

  const storageRef = ref(storage, `images/${imageName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  const snapshot = await getDocs(
    query(collection(db, GALLERY_COLLECTION), orderBy('order', 'desc'))
  );
  const lastOrder = snapshot.docs[0]?.data()?.order || 0;

  const newDoc = await createDocument(GALLERY_COLLECTION, {
    img: url,
    name: file.name,
    storageName: imageName,
    order: lastOrder + 1,
  });

  return [newDoc];
}

export async function getImages() {
  return getCollection(GALLERY_COLLECTION, [orderBy('order', 'asc')]);
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
  // Always remove the Firestore document first
  await removeDocument(GALLERY_COLLECTION, id);

  let finalPath = '';
  if (imageName) {
    finalPath = imageName.startsWith('images/') ? imageName : `images/${imageName}`;
  } else if (imageUrl) {
    const match = imageUrl.match(/\/o\/([^?]+)/);
    if (match) {
      finalPath = decodeURIComponent(match[1]);
    }
  }

  if (finalPath) {
    try {
      const fileRef = ref(storage, finalPath);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn('Storage object deletion failed or already deleted:', err);
    }
  }
}

export async function downloadImage(url: string) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors', // Ensure CORS is respected
      cache: 'no-cache',
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.blob();
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

export async function reorderGallery(
  newOrder: { id: string; order: number }[]
) {
  const batch = writeBatch(db);
  newOrder.forEach((item) => {
    const docRef = doc(db, GALLERY_COLLECTION, item.id);
    batch.update(docRef, { order: item.order });
  });
  await batch.commit();
  return newOrder;
}
