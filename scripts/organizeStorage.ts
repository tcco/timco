import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'timco-7f829.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function moveFiles() {
    console.log('--- Moving Files to images/ ---');
    const [files] = await bucket.getFiles();

    for (const file of files) {
        if (file.name.includes('/')) {
            console.log(`Skipping "${file.name}" (already in a folder)`);
            continue;
        }

        const destination = `images/${file.name}`;
        console.log(`Moving "${file.name}" -> "${destination}"`);
        try {
            await file.move(destination);
        } catch (e) {
            console.error(`Failed to move ${file.name}:`, e);
        }
    }
    console.log('--- Done! ---');
}

moveFiles().catch(console.error);
