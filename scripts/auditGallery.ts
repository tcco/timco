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

async function checkGallery() {
    console.log('--- Gallery Firestore Audit ---');
    const snapshot = await db.collection('gallery').get();
    console.log(`Total documents found: ${snapshot.size}`);

    let missingOrder = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.order === undefined || data.order === null) {
            missingOrder++;
            console.log(`[Missing Order] ID: ${doc.id}, Name: ${data.name}`);
        }
    });

    console.log(`\nSummary: ${missingOrder} documents are missing the "order" field.`);
}

checkGallery().catch(console.error);
