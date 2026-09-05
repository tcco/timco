import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

const FIREBASE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app';

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: FIREBASE_BUCKET
});

const db = getFirestore(app, 'main');
const bucket = admin.storage().bucket();

function getDisplayName(fileName: string): string {
    let name = fileName;
    if (name.includes('?')) name = name.split('?')[0];
    const parts = name.split('/');
    let lastPart = parts[parts.length - 1];
    lastPart = decodeURIComponent(lastPart);
    if (lastPart.includes('/')) lastPart = lastPart.split('/').pop() || lastPart;
    const dashIndex = lastPart.indexOf('-');
    if (dashIndex === -1) return lastPart;
    return lastPart.substring(dashIndex + 1);
}

function createFirebaseUrl(fullPath: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodeURIComponent(fullPath)}?alt=media`;
}

async function populate() {
    console.log('--- Populating Firestore (main) Database ---');

    // 1. Fetch all storage files
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} total files in Cloud Storage.`);

    // 2. Filter gallery images
    const galleryFiles = files.filter(f => f.name.startsWith('images/') && !f.name.includes('-album-'));
    console.log(`Found ${galleryFiles.length} gallery image files.`);

    const galleryBatch = db.batch();
    let order = 1;

    for (const file of galleryFiles) {
        const fullUrl = createFirebaseUrl(file.name);
        const displayName = getDisplayName(file.name);
        const docRef = db.collection('gallery').doc();
        galleryBatch.set(docRef, {
            name: displayName,
            storageName: file.name.replace('images/', ''),
            img: fullUrl,
            order: order++,
            created_at: new Date().toISOString()
        });
    }

    await galleryBatch.commit();
    console.log(`✓ Successfully populated ${galleryFiles.length} gallery items into Firestore 'main'.`);

    // 3. Populate default current sections if not present
    const sectionsSnapshot = await db.collection('current_sections').get();
    if (sectionsSnapshot.empty) {
        console.log('Populating default current sections...');
        const sectionBatch = db.batch();
        
        const workDoc = db.collection('current_sections').doc();
        sectionBatch.set(workDoc, { title: 'Working On', created_at: new Date().toISOString() });

        const learningDoc = db.collection('current_sections').doc();
        sectionBatch.set(learningDoc, { title: 'Exploring & Building', created_at: new Date().toISOString() });

        const lifeDoc = db.collection('current_sections').doc();
        sectionBatch.set(lifeDoc, { title: 'Life & Interests', created_at: new Date().toISOString() });

        await sectionBatch.commit();
        console.log('✓ Successfully created default sections.');

        // Add starter items
        const itemBatch = db.batch();
        const item1 = db.collection('current_items').doc();
        itemBatch.set(item1, {
            title: 'Google DeepMind',
            description: 'Advanced Agentic Coding & AI Systems',
            link: 'https://deepmind.google',
            section_id: workDoc.id,
            order: 1,
            created_at: new Date().toISOString()
        });

        const item2 = db.collection('current_items').doc();
        itemBatch.set(item2, {
            title: 'FynnAI',
            description: 'AI Chief of Staff & Financial Intelligence Platform',
            link: '',
            section_id: learningDoc.id,
            order: 1,
            created_at: new Date().toISOString()
        });

        await itemBatch.commit();
        console.log('✓ Successfully created starter current items.');
    }

    console.log('--- Done Populating Database ---');
}

populate().catch(console.error);
