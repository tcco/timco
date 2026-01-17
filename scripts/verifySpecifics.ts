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

async function checkSpecifics() {
    console.log('\n--- Gallery Sample ---');
    const gallery = await db.collection('gallery').limit(1).get();
    gallery.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));

    console.log('\n--- Current Items Sample ---');
    const items = await db.collection('current_items').limit(1).get();
    items.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
}

checkSpecifics().catch(console.error);
