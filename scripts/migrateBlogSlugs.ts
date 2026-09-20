import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { getFirestore } from 'firebase-admin/firestore';
import { generateSlug } from '../src/utils/slug.js';

dotenv.config();

const serviceAccount = JSON.parse(
  readFileSync('./firebase-service-account.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app',
  });
}

const db = getFirestore(admin.app(), process.env.VITE_FIREBASE_DATABASE_ID || 'main');

async function migrateBlogSlugs() {
  console.log('--- Starting Blog Slug & ID Migration ---');

  const snapshot = await db.collection('blog').get();
  console.log(`Found ${snapshot.size} total posts in Firestore.`);

  const batch = db.batch();

  // 1. Check for the two unstandardized posts
  const unstandardizedDocs = {
    'RlLRwwi0bDwybHfDF68Y': { targetId: '92', numericId: 92 },
    'DeV593f1i958MiamFW1Y': { targetId: '93', numericId: 93 },
  };

  for (const [oldDocId, target] of Object.entries(unstandardizedDocs)) {
    const oldDoc = await db.collection('blog').doc(oldDocId).get();
    if (oldDoc.exists) {
      const data = oldDoc.data()!;
      const slug = generateSlug(data.title || '');
      console.log(`Migrating doc ${oldDocId} -> ${target.targetId} ("${data.title}") with slug "${slug}"`);
      
      const newDocRef = db.collection('blog').doc(target.targetId);
      batch.set(newDocRef, {
        ...data,
        id: target.numericId,
        slug,
      });

      // Delete old doc
      batch.delete(oldDoc.ref);
    }
  }

  // 2. Set slug on all other numeric docs
  for (const doc of snapshot.docs) {
    if (unstandardizedDocs[doc.id as keyof typeof unstandardizedDocs]) {
      // Already handled above
      continue;
    }

    const data = doc.data();
    const slug = generateSlug(data.title || '');
    const currentId = data.id !== undefined ? Number(data.id) : Number(doc.id);

    console.log(`Updating post [${doc.id}] "${data.title}" -> slug: "${slug}"`);
    batch.update(doc.ref, {
      slug,
      id: isNaN(currentId) ? doc.id : currentId,
    });
  }

  await batch.commit();
  console.log('--- Migration successfully committed! ---');
}

migrateBlogSlugs().catch(console.error);
