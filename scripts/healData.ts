import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

const FIREBASE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET!;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: FIREBASE_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

function getBaseName(fileName: string): string {
    // If it's a full URL, get the path part
    let name = fileName;
    if (name.includes('?')) {
        name = name.split('?')[0];
    }
    const parts = name.split('/');
    let lastPart = parts[parts.length - 1];

    // If it's URL encoded (e.g. %2F), decode it
    lastPart = decodeURIComponent(lastPart);

    // Some files might be in folders in the URL path (e.g. images%2F...)
    if (lastPart.includes('/')) {
        lastPart = lastPart.split('/').pop() || lastPart;
    }

    const dashIndex = lastPart.indexOf('-');
    if (dashIndex === -1) return lastPart;
    return lastPart.substring(dashIndex + 1);
}

function createFirebaseUrl(fullPath: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodeURIComponent(fullPath)}?alt=media`;
}

async function healData() {
    console.log('--- Healing Data Start ---');

    // 1. Map ALL Storage files by base name (case-insensitive)
    const [files] = await bucket.getFiles();
    const storageMap = new Map<string, string>(); // baseName.toLowerCase() -> fullPath
    files.forEach(f => {
        const base = getBaseName(f.name).toLowerCase();
        storageMap.set(base, f.name);
    });
    console.log(`Mapped ${storageMap.size} unique lowercased base names.`);

    // 2. Heal Gallery
    console.log('\n--- Healing Gallery ---');
    const gallerySnapshot = await db.collection('gallery').get();
    let healedGallery = 0;
    const missingGalleryFiles = new Set<string>();

    for (const doc of gallerySnapshot.docs) {
        const data = doc.data();
        const currentUrl = data.img || '';
        const currentBase = getBaseName(currentUrl).toLowerCase();

        const matchPath = storageMap.get(currentBase);
        if (matchPath) {
            const newUrl = createFirebaseUrl(matchPath);
            if (currentUrl !== newUrl) {
                await doc.ref.update({ img: newUrl });
                healedGallery++;
            }
        } else {
            missingGalleryFiles.add(getBaseName(currentUrl));
        }
    }
    console.log(`Healed ${healedGallery}. Still missing: ${missingGalleryFiles.size} unique files.`);
    if (missingGalleryFiles.size > 0) {
        console.log('Missing Gallery files:', Array.from(missingGalleryFiles));
    }

    // 3. Heal Blog
    console.log('\n--- Healing Blog ---');
    const blogSnapshot = await db.collection('blog').get();
    let healedBlog = 0;
    const missingBlogFiles = new Set<string>();

    for (const doc of blogSnapshot.docs) {
        const data = doc.data();
        let changed = false;

        if (data.thumbnail) {
            const thumbBase = getBaseName(data.thumbnail).toLowerCase();
            const match = storageMap.get(thumbBase);
            if (match) {
                const newUrl = createFirebaseUrl(match);
                if (data.thumbnail !== newUrl) {
                    data.thumbnail = newUrl;
                    changed = true;
                }
            } else {
                missingBlogFiles.add(getBaseName(data.thumbnail));
            }
        }

        if (Array.isArray(data.albums)) {
            data.albums.forEach((album: any) => {
                if (Array.isArray(album.photos)) {
                    album.photos = album.photos.map((p: string) => {
                        const pBase = getBaseName(p).toLowerCase();
                        const m = storageMap.get(pBase);
                        if (m) {
                            const nUrl = createFirebaseUrl(m);
                            if (p !== nUrl) {
                                changed = true;
                                return nUrl;
                            }
                        } else {
                            missingBlogFiles.add(getBaseName(p));
                        }
                        return p;
                    });
                }
            });
        }

        if (changed) {
            await doc.ref.update({
                thumbnail: data.thumbnail,
                albums: data.albums
            });
            healedBlog++;
        }
    }
    console.log(`Healed ${healedBlog} posts. Still missing ${missingBlogFiles.size} unique post files.`);
    if (missingBlogFiles.size > 0) {
        console.log('Missing Blog files:', Array.from(missingBlogFiles));
    }
    // 4. Final Stats
    let finalBrokenGallery = 0;
    for (const doc of gallerySnapshot.docs) {
        const data = doc.data();
        const url = data.img || '';
        const match = url.match(/\/o\/(images%2F[^?]+)/);
        if (match) {
            const fullPath = decodeURIComponent(match[1]);
            if (!files.some(f => f.name === fullPath)) finalBrokenGallery++;
        } else {
            finalBrokenGallery++;
        }
    }
    console.log(`Final broken gallery items: ${finalBrokenGallery} / ${gallerySnapshot.size}`);

    console.log('\n--- Healing Done ---');
}

healData().catch(console.error);
