import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db, storage } from './firebase';

export async function uploadAlbums(albums: FileList[]) {
  const albumsPath: string[][] = [];

  for (let i = 0; i < albums.length; i++) {
    albumsPath[i] = [];
    for (let j = 0; j < albums[i].length; j++) {
      const imageName = `${Math.random()}-${albums[i].item(j)?.name}`
        .replace(' ', '-')
        .replace('/', '');

      const storageRef = ref(storage, `images/${imageName}`);
      await uploadBytes(storageRef, albums[i].item(j) as File);
      const url = await getDownloadURL(storageRef);

      albumsPath[i].push(url);
    }
  }

  return albumsPath;
}

export async function AddPost({
  title,
  draft,
  content,
  category,
  thumbnail,
  albums,
  uploadedAlbums,
  createdAt,
}: {
  title: string;
  content: string;
  thumbnail?: FileList;
  category: string;
  draft: boolean;
  albums: FileList[];
  createdAt: string;
  uploadedAlbums?: string[][];
}) {
  const imageName = thumbnail
    ? `${Math.random()}-${thumbnail?.[0].name}`
      .replace(' ', '-')
      .replace('/', '')
    : '';

  const albumsPath: string[][] = await uploadAlbums(albums);

  let thumbnailUrl = '';
  if (thumbnail) {
    const storageRef = ref(storage, `images/${imageName}`);
    await uploadBytes(storageRef, thumbnail[0]);
    thumbnailUrl = await getDownloadURL(storageRef);
  }

  const newPost = {
    title,
    content,
    category,
    draft,
    thumbnail: thumbnailUrl,
    albums: [...(uploadedAlbums || []), ...albumsPath].map(album => ({ photos: album })),
    created_at: createdAt,
  };

  const docRef = await addDoc(collection(db, 'blog'), newPost);
  return [{ id: docRef.id, ...newPost }];
}

export async function getPostByTitle(title: string) {
  try {
    console.log(`Fetching post by title: ${title}`);
    const q = query(collection(db, 'blog'), where('title', '==', title));
    const querySnapshot = await getDocs(q);

    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        ...data,
        id: doc.id,
        albums: data.albums?.map((a: any) => a.photos) || []
      };
    });
    console.log(`Posts found for title ${title}:`, posts);
    return posts;
  } catch (error) {
    console.error(`Error in getPostByTitle(${title}):`, error);
    throw error;
  }
}

export async function getPostById(id: string) {
  const docRef = doc(db, 'blog', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as any;
    return [{
      ...data,
      id: docSnap.id,
      albums: data.albums?.map((a: any) => a.photos) || []
    }];
  } else {
    return [];
  }
}

export async function getAllPosts({
  title,
  category,
}: {
  title: string;
  category: string;
}) {
  try {
    console.log('Fetching all posts...');
    const q = query(collection(db, 'blog'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);

    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        ...data,
        id: doc.id,
        albums: data.albums?.map((a: any) => a.photos) || []
      };
    });

    const filtered = posts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(title.toLowerCase());
      const categoryMatch = post.category.toLowerCase().includes(category.toLowerCase());
      return titleMatch && categoryMatch;
    });
    console.log(`All posts fetched (${posts.length}), filtered down to (${filtered.length})`);
    return filtered;
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    throw error;
  }
}

export async function deletePost(id: string) {
  const docRef = doc(db, 'blog', id);
  // Just delete the doc to keep it simple and match original logic
  await deleteDoc(docRef);
  return [{ id }];
}

export async function updatePost({
  id,
  draft,
  title,
  content,
  category,
  thumbnail,
  oldAlbumsOrder,
  uploadedAlbums,
  newAlbums,
  createdAt,
}: {
  id: string;
  draft: boolean;
  title: string;
  content: string;
  category: string;
  thumbnail: FileList | string;
  oldAlbumsOrder: string[][];
  newAlbums: FileList[];
  uploadedAlbums: string[][];
  createdAt: string;
}) {
  let thumbnailPath = thumbnail as string;

  if (typeof thumbnail === 'object') {
    const imageName = `${Math.random()}-${thumbnail[0].name}`
      .replace(' ', '_')
      .replace('/', '');

    const storageRef = ref(storage, `images/${imageName}`);
    await uploadBytes(storageRef, thumbnail[0]);
    thumbnailPath = await getDownloadURL(storageRef);
  }

  const albumsPath = await uploadAlbums(newAlbums);
  const albums = [...oldAlbumsOrder, ...uploadedAlbums, ...albumsPath].map(album => ({ photos: album }));

  const docRef = doc(db, 'blog', id);
  await updateDoc(docRef, {
    title,
    content,
    thumbnail: thumbnailPath,
    draft,
    category,
    albums,
    created_at: createdAt,
  });

  return [{ ...docRef, id, title, content, thumbnail: thumbnailPath, draft, category, albums: albums.map(a => a.photos), created_at: createdAt }];
}

export async function draftPost({ id, draft }: { id: string; draft: boolean }) {
  const docRef = doc(db, 'blog', id);
  await updateDoc(docRef, { draft });
  return [{ id, draft }];
}

export async function deleteThumbnail(id: string) {
  const docRef = doc(db, 'blog', id);
  await updateDoc(docRef, { thumbnail: '' });
}
