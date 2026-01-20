import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

interface CheckSumEntry {
    name: string;
    size: number;
    timeCreated: string;
    md5Hash?: string;
    mediaLink?: string;
    isUsed?: boolean;
}

// Helper to extract storage path from download URL
function getStoragePathFromUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/o\/(.*?)\?alt=media/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    return null;
}

async function getUsedStoragePaths(): Promise<Set<string>> {
    console.log('--- Scanning Database for Usage ---');
    const usedPaths = new Set<string>();

    // 1. Scan Gallery
    console.log('Scanning "gallery" collection...');
    const gallerySnapshot = await db.collection('gallery').get();
    gallerySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.img) {
            const path = getStoragePathFromUrl(data.img);
            if (path) usedPaths.add(path);
        }
    });

    // 2. Scan Blog
    console.log('Scanning "blog" collection...');
    const blogSnapshot = await db.collection('blog').get();
    blogSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.albums && Array.isArray(data.albums)) {
            data.albums.forEach((album: any) => {
                if (album.photos && Array.isArray(album.photos)) {
                    album.photos.forEach((photoUrl: string) => {
                        const path = getStoragePathFromUrl(photoUrl);
                        if (path) usedPaths.add(path);
                    });
                }
            });
        }
    });

    console.log(`Found ${usedPaths.size} unique storage paths explicitly used in DB.`);
    return usedPaths;
}

async function findDuplicates() {
    // 0. Build usage map
    const usedPaths = await getUsedStoragePaths();

    console.log('\n--- Find Duplicates in Storage ---');
    console.log(`Bucket: ${bucket.name}`);

    // 1. List all files
    const [files] = await bucket.getFiles();
    console.log(`Total files found: ${files.length}`);

    // 2. Group by MD5 Hash
    const map = new Map<string, CheckSumEntry[]>();

    files.forEach(file => {
        const { md5Hash, size, timeCreated, mediaLink } = file.metadata;
        if (!md5Hash) return;

        const entry: CheckSumEntry = {
            name: file.name,
            size: Number(size),
            timeCreated: String(timeCreated),
            md5Hash: String(md5Hash),
            mediaLink: String(mediaLink),
            isUsed: usedPaths.has(file.name)
        };

        if (!map.has(md5Hash)) {
            map.set(md5Hash, []);
        }
        map.get(md5Hash)?.push(entry);
    });

    // 3. Filter for duplicates
    let duplicateGroupCount = 0;
    let potentialSpaceSaving = 0;
    let safeToDeleteCount = 0;

    console.log('\n--- Duplicate Report (Verification Enabled) ---');

    for (const [hash, entries] of map.entries()) {
        if (entries.length > 1) {
            duplicateGroupCount++;
            console.log(`\nDuplicate Group [MD5: ${hash}] -- ${entries.length} files`);

            // Sort by: 
            // 1. Used files FIRST
            // 2. Then Creation date (oldest first)
            entries.sort((a, b) => {
                if (a.isUsed && !b.isUsed) return -1;
                if (!a.isUsed && b.isUsed) return 1;
                return new Date(a.timeCreated).getTime() - new Date(b.timeCreated).getTime();
            });

            entries.forEach((entry, index) => {
                const isFirst = index === 0;
                let status = '';

                if (entry.isUsed) {
                    status = ' [IN USE] (KEEP)';
                } else if (isFirst) {
                    // Even if not used, it's the "primary" candidate because it's oldest or sorted first
                    // BUT if none are used, we still keep one.
                    status = ' (Unused but Primary / Keep)';
                } else {
                    status = ' [UNUSED] (SAFE TO DELETE)';
                    safeToDeleteCount++;
                }

                console.log(`  ${index + 1}. ${entry.name}`);
                console.log(`     Size: ${entry.size} bytes | Created: ${entry.timeCreated} |${status}`);
            });

            // Calculate potential savings (all except the first one)
            const groupSize = entries[0].size;
            potentialSpaceSaving += groupSize * (entries.length - 1);
        }
    }

    if (duplicateGroupCount === 0) {
        console.log('No duplicates found!');
    } else {
        console.log(`\nFound ${duplicateGroupCount} groups of duplicates.`);
        console.log(`Files marked SAFE TO DELETE: ${safeToDeleteCount}`);
        console.log(`Potential space saving: ${(potentialSpaceSaving / 1024 / 1024).toFixed(2)} MB`);
    }
}

findDuplicates().catch(console.error);
