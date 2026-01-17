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

async function fixGalleryOrders() {
    console.log('--- Fixing Gallery Orders ---');
    const snapshot = await db.collection('gallery').get();

    // Find the highest current order
    let maxOrder = 0;
    snapshot.forEach(doc => {
        const o = doc.data().order;
        if (typeof o === 'number' && o > maxOrder) maxOrder = o;
    });

    console.log(`Current max order: ${maxOrder}`);

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.order === undefined || data.order === null) {
            count++;
            maxOrder++;
            console.log(`Fixing ID ${doc.id} (${data.name}) -> Order ${maxOrder}`);
            batch.update(doc.ref, { order: maxOrder });
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully fixed ${count} items.`);
    } else {
        console.log('No items needed fixing.');
    }
}

fixGalleryOrders().catch(console.error);
