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

async function checkStorage() {
    console.log('--- Storage File Check ---');
    // Check specifically for one of the gallery images
    const filename = 'images/0.01940333425889218-sunfish.jpg';
    const file = bucket.file(filename);

    const [exists] = await file.exists();
    console.log('Listing ALL files in the bucket:');
    const [files] = await bucket.getFiles();
    console.log(`Total files found: ${files.length}`);
    files.forEach(f => console.log(` - ${f.name}`));
}

checkStorage().catch(console.error);
