import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export async function removeAlbum(
  postTitle: string,
  targetAlbum: string[],
  originalAlbum: string[][]
) {
  // 1. Find the blog post by title
  const q = query(collection(db, 'blog'), where('title', '==', postTitle));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Post not found');
  }

  const postDoc = querySnapshot.docs[0];

  // 2. Filter out the album
  const newAlbums = originalAlbum.filter(
    (album) => targetAlbum[0] !== album[0]
  );

  // 3. Update the document with new format
  await updateDoc(doc(db, 'blog', postDoc.id), {
    albums: newAlbums.map(album => ({ photos: album }))
  });

  // 4. (Optional) Delete images from storage.
  // Skipping for now to avoid URL parsing issues without 'refFromURL'.
  // const paths = targetAlbum.map((image) => image.split('/').at(-1)) as string[];
  // await Promise.all(paths.map(path => deleteObject(ref(storage, `images/${path}`))));
}
