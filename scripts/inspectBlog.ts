import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app'
});

const db = admin.firestore();

async function inspectBlog() {
    console.log('--- Inspecting Blog Collection ---');
    const snapshot = await db.collection('blog').limit(3).get();

    snapshot.forEach(doc => {
        console.log(`\nBlog ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}

inspectBlog().catch(console.error);
