import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

function getStoragePathFromUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/o\/(.*?)\?alt=media/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    return null;
}

function constructPublicUrl(bucketName: string, filePath: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
}

async function repairThumbnails() {
    console.log('--- Repairing Blog Thumbnails ---');
    console.log(`Bucket: ${bucket.name}`);

    console.log('Fetching all storage files...');
    const [allFiles] = await bucket.getFiles();
    const availableFiles = new Set(allFiles.map(f => f.name));
    console.log(`Total available files: ${availableFiles.size}`);

    const snapshot = await db.collection('blog').get();
    let fixedCount = 0;
    let missingCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const thumbnailUrl = data.thumbnail;

        if (!thumbnailUrl) continue;

        const path = getStoragePathFromUrl(thumbnailUrl);
        if (!path) {
            console.warn(`[WARN] Post ${doc.id}: Could not parse URL: ${thumbnailUrl}`);
            continue;
        }

        if (availableFiles.has(path)) {
            continue;
        }

        console.log(`[MISSING] Post "${data.title}" (${doc.id})`);
        console.log(`   referenced missing file: ${path}`);
        missingCount++;

        const filename = path.split('/').pop() || '';
        let searchSuffix = filename;

        // Extract suffix after random number 0.xxxxx-
        const match = filename.match(/0\.\d+-(.+)$/);
        if (match && match[1]) {
            searchSuffix = match[1];
        }

        console.log(`   Searching for replacement ending in: "${searchSuffix}"...`);

        if (searchSuffix.length < 4) {
            console.warn(`   [SKIP] Suffix too short: ${searchSuffix}`);
            continue;
        }

        // Find a candidate that ends with the suffix AND is not the missing path
        const candidate = allFiles.find(f => {
            return f.name.endsWith(searchSuffix) && f.name !== path;
        });

        if (candidate) {
            console.log(`   FOUND MATCH: ${candidate.name}`);
            const newUrl = constructPublicUrl(bucket.name, candidate.name);
            await doc.ref.update({ thumbnail: newUrl });
            console.log(`   [FIXED] Updated thumbnail URL.`);
            fixedCount++;
        } else {
            console.error(`   [FAILED] No replacement found for ${path}`);
        }
    }

    console.log('\n--- Repair Summary ---');
    console.log(`Missing Thumbnails: ${missingCount}`);
    console.log(`Fixed: ${fixedCount}`);
}

repairThumbnails().catch(console.error);
