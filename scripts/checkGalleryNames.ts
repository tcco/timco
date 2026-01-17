import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function checkGalleryNames() {
    const snapshot = await db.collection('gallery').limit(10).get();
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  Name: ${data.name}`);
        console.log(`  StorageName: ${data.storageName}`);
        console.log(`  Img URL: ${data.img}`);
    });
}

checkGalleryNames().catch(console.error);
