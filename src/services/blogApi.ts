import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { orderBy } from 'firebase/firestore';
import { storage } from './firebase';
import {
  getCollection,
  getDocument,
  createDocument,
  removeDocument,
  patchDocument,
} from '@/services/firestoreService';

const BLOG_COLLECTION = 'blog';

export async function uploadAlbums(albums: FileList[]) {
  const albumsPath: string[][] = [];
  for (let i = 0; i < albums.length; i++) {
    albumsPath[i] = [];
    for (let j = 0; j < albums[i].length; j++) {
      const file = albums[i].item(j);
      if (!file) continue;
      const imageName = `${Math.random()}-${file.name}`
        .replace(' ', '-')
        .replace('/', '');

      const storageRef = ref(storage, `images/${imageName}`);
      await uploadBytes(storageRef, file);
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
  const albumsPath = await uploadAlbums(albums);
  let thumbnailUrl = '';
  if (thumbnail && thumbnail[0]) {
    const imageName = `${Math.random()}-${thumbnail[0].name}`
      .replace(' ', '-')
      .replace('/', '');
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
    albums: [...(uploadedAlbums || []), ...albumsPath].map((album) => ({
      photos: album,
    })),
    created_at: createdAt,
  };

  const created = await createDocument(BLOG_COLLECTION, newPost);
  return [created];
}

export async function getPostByTitle(title: string) {
  const posts = await getCollection<any>(BLOG_COLLECTION);
  const filtered = posts
    .filter((post) => post.title === title)
    .map((post) => ({
      ...post,
      albums: post.albums?.map((a: any) => a.photos) || [],
    }));
  return filtered;
}

export async function getPostById(id: string) {
  const post = await getDocument<any>(BLOG_COLLECTION, id);
  if (!post) return [];
  return [
    {
      ...post,
      albums: post.albums?.map((a: any) => a.photos) || [],
    },
  ];
}

export async function getAllPosts({
  title,
  category,
}: {
  title: string;
  category: string;
}) {
  const posts = await getCollection<any>(BLOG_COLLECTION, [
    orderBy('created_at', 'desc'),
  ]);
  const filtered = posts
    .map((post) => ({
      ...post,
      albums: post.albums?.map((a: any) => a.photos) || [],
    }))
    .filter((post) => {
      const titleMatch = post.title.toLowerCase().includes(title.toLowerCase());
      const categoryMatch = post.category
        .toLowerCase()
        .includes(category.toLowerCase());
      return titleMatch && categoryMatch;
    });
  return filtered;
}

export async function deletePost(id: string) {
  await removeDocument(BLOG_COLLECTION, id);
  return [{ id }];
}

export async function updatePost({
  id,
  thumbnail,
  newAlbums,
  oldAlbumsOrder,
  uploadedAlbums,
  createdAt,
  ...fields
}: any) {
  let thumbnailUrl = typeof thumbnail === 'string' ? thumbnail : '';

  if (thumbnail && typeof thumbnail !== 'string' && thumbnail[0]) {
    const imageName = `${Math.random()}-${thumbnail[0].name}`
      .replace(' ', '_')
      .replace('/', '');
    const storageRef = ref(storage, `images/${imageName}`);
    await uploadBytes(storageRef, thumbnail[0]);
    thumbnailUrl = await getDownloadURL(storageRef);
  }

  const albumsPath = await uploadAlbums(newAlbums || []);
  const albums = [
    ...(oldAlbumsOrder || []),
    ...(uploadedAlbums || []),
    ...albumsPath,
  ].map((album) => ({ photos: album }));

  const updateData = {
    ...fields,
    thumbnail: thumbnailUrl,
    albums,
    created_at: createdAt,
  };

  await patchDocument(BLOG_COLLECTION, id, updateData);

  return [
    {
      ...updateData,
      id,
      albums: albums.map((a) => a.photos),
    },
  ];
}

export async function draftPost({ id, draft }: { id: string; draft: boolean }) {
  await patchDocument(BLOG_COLLECTION, id, { draft });
  return [{ id, draft }];
}

export async function deleteThumbnail(id: string) {
  await patchDocument(BLOG_COLLECTION, id, { thumbnail: '' });
}
