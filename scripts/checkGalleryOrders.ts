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

async function checkGalleryOrders() {
    const snapshot = await db.collection('gallery').get();
    console.log(`Total images: ${snapshot.size}`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}, Name: ${data.name}, Order: ${data.order}`);
    });
}

checkGalleryOrders().catch(console.error);
