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

async function fullAudit() {
    console.log('--- Full Current Audit ---');

    const sectionsSnapshot = await db.collection('current_sections').get();
    console.log(`Found ${sectionsSnapshot.size} sections.`);

    for (const sectionDoc of sectionsSnapshot.docs) {
        const sectionData = sectionDoc.data();
        const sectionId = sectionDoc.id;
        console.log(`\nSection: "${sectionData.title}" (ID: ${sectionId})`);

        // Test the same query getItems uses
        const itemsSnapshot = await db.collection('current_items')
            .where('section_id', '==', sectionId)
            .get();

        console.log(`  - Found ${itemsSnapshot.size} items for this section.`);
        itemsSnapshot.forEach(itemDoc => {
            console.log(`    * [Item] ${itemDoc.data().title}`);
        });

        // Also check if any items are using numeric section_id by accident
        const numericItemsSnapshot = await db.collection('current_items')
            .where('section_id', '==', Number(sectionId))
            .get();
        if (numericItemsSnapshot.size > 0) {
            console.log(`  ! WARNING: Found ${numericItemsSnapshot.size} items with NUMERIC section_id ${sectionId}`);
        }
    }
}

fullAudit().catch(console.error);
