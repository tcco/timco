import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function verifyData() {
    console.log('--- Verifying Firestore Data ---');

    const collections = ['gallery', 'current_sections', 'current_items', 'blog'];

    for (const col of collections) {
        const snapshot = await db.collection(col).limit(2).get();
        console.log(`\nCollection: ${col} (${snapshot.size} documents found)`);
        snapshot.forEach(doc => {
            console.log(`ID: ${doc.id}`, JSON.stringify(doc.data(), null, 2));
        });
    }
}

verifyData().catch(console.error);
