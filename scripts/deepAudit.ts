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

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function deepAudit() {
    console.log('--- Deep Audit Start ---');

    // 1. Get all Storage files in images/
    const [files] = await bucket.getFiles({ prefix: 'images/' });
    const storageFileSet = new Set(files.map(f => f.name));
    console.log(`Total files in storage "images/": ${storageFileSet.size}`);

    // 2. Audit Gallery
    console.log('\n--- Gallery Audit ---');
    const gallerySnapshot = await db.collection('gallery').get();
    let totalGallery = 0;
    let brokenGallery = 0;

    gallerySnapshot.forEach(doc => {
        totalGallery++;
        const data = doc.data();
        const url = data.img || '';
        // Extract logical path from Firebase URL
        // Format: https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/images%2F[FILENAME]?alt=media
        const match = url.match(/\/o\/(images%2F[^?]+)/);
        if (match) {
            const fullPath = decodeURIComponent(match[1]);
            if (!storageFileSet.has(fullPath)) {
                brokenGallery++;
                console.log(`[Broken] Gallery Doc ${doc.id}: URL ${url} points to missing ${fullPath}`);
            }
        } else {
            brokenGallery++;
            console.log(`[Invalid URL] Gallery Doc ${doc.id}: ${url}`);
        }
    });
    console.log(`Gallery: ${totalGallery} total, ${brokenGallery} broken.`);

    // 3. Audit Blog
    console.log('\n--- Blog Audit ---');
    const blogSnapshot = await db.collection('blog').get();
    blogSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Post ID ${doc.id}: "${data.title}"`);
        console.log(`  Structure check: albums is type ${typeof data.albums}, isArray: ${Array.isArray(data.albums)}`);
        if (data.albums) {
            console.log(`  Albums sample: ${JSON.stringify(data.albums).slice(0, 100)}...`);
            if (Array.isArray(data.albums)) {
                data.albums.forEach((album: any, i: number) => {
                    if (album.photos) {
                        console.log(`    Album ${i}: ${album.photos.length} photos`);
                        album.photos.forEach((p: string) => {
                            const m = p.match(/\/o\/(images%2F[^?]+)/);
                            if (m) {
                                const pth = decodeURIComponent(m[1]);
                                if (!storageFileSet.has(pth)) {
                                    console.log(`      !! Missing photo: ${pth}`);
                                }
                            }
                        });
                    } else {
                        console.log(`    Album ${i}: Photos missing from structure! (Keys: ${Object.keys(album)})`);
                    }
                });
            }
        }
    });

    console.log('\n--- End Audit ---');
}

deepAudit().catch(console.error);
