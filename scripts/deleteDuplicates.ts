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

// DRY RUN TOGGLE - Set to false to actually delete
const DRY_RUN = false;

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

    const gallerySnapshot = await db.collection('gallery').get();
    gallerySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.img) {
            const path = getStoragePathFromUrl(data.img);
            if (path) usedPaths.add(path);
        }
    });

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

async function deleteDuplicates() {
    const usedPaths = await getUsedStoragePaths();
    console.log('\n--- Deleting Unused Duplicates ---');
    console.log(`Bucket: ${bucket.name}`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (No changes)' : 'LIVE EXECUTION (Files will be deleted)'}`);

    const [files] = await bucket.getFiles();
    console.log(`Total files found: ${files.length}`);

    const map = new Map<string, CheckSumEntry[]>();

    files.forEach(file => {
        const { md5Hash, size, timeCreated } = file.metadata;
        if (!md5Hash) return;

        const entry: CheckSumEntry = {
            name: file.name,
            size: Number(size),
            timeCreated: String(timeCreated),
            md5Hash: String(md5Hash),
            isUsed: usedPaths.has(file.name)
        };

        if (!map.has(md5Hash)) {
            map.set(md5Hash, []);
        }
        map.get(md5Hash)?.push(entry);
    });

    let deletedCount = 0;
    let savedBytes = 0;

    for (const [hash, entries] of map.entries()) {
        if (entries.length > 1) {

            // Sort: Used first, then Oldest first.
            entries.sort((a, b) => {
                if (a.isUsed && !b.isUsed) return -1;
                if (!a.isUsed && b.isUsed) return 1;
                return new Date(a.timeCreated).getTime() - new Date(b.timeCreated).getTime();
            });

            // The first item is our "KEPT" file (either used, or oldest if none used)
            const keeper = entries[0];
            const toDelete = entries.slice(1);

            for (const item of toDelete) {
                if (item.isUsed) {
                    console.warn(`[WARNING] Skipping deletion of ${item.name} (MD5: ${hash}) because it is marked as USED, even though it is a duplicate.`);
                    continue;
                }

                console.log(`[DELETE] ${item.name} (Duplicate of ${keeper.name})`);

                if (!DRY_RUN) {
                    try {
                        await bucket.file(item.name).delete();
                        deletedCount++;
                        savedBytes += item.size;
                    } catch (err) {
                        console.error(`Failed to delete ${item.name}:`, err);
                    }
                } else {
                    deletedCount++;
                    savedBytes += item.size;
                }
            }
        }
    }

    console.log('\n--- Summary ---');
    console.log(`Files Deleted: ${deletedCount}`);
    console.log(`Space Reclaimed: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
    if (DRY_RUN) console.log('(This was a DRY RUN. No files were actually deleted.)');
}

deleteDuplicates().catch(console.error);
