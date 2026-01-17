import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

dotenv.config();

console.log('VERSION: 3.0 (Robust Null Checks)');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.VITE_SERVICE_ROLE_KEY!;
const FIREBASE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: FIREBASE_BUCKET
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function downloadAndUpload(url: string, destinationPath: string): Promise<string | null> {
    if (!url || typeof url !== 'string' || !url.includes('supabase.co')) {
        return null;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`  !! Failed to download ${url}: ${response.statusText}`);
            return null;
        }

        const buffer = await response.buffer();
        const file = bucket.file(destinationPath);

        await file.save(buffer, {
            metadata: { contentType: response.headers.get('content-type') || 'image/jpeg' },
            public: true
        });

        return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodeURIComponent(destinationPath)}?alt=media`;
    } catch (e) {
        console.error(`  !! Error processing ${url}:`, e);
        return null;
    }
}

async function startStorageMigration() {
    console.log('--- Starting Absolute Storage Migration ---');

    // 1. Gallery
    console.log('\nProcessing Gallery...');
    const { data: galleryItems, errorCount: gErr } = await supabase.from('gallery').select('*');
    if (galleryItems) {
        console.log(`Found ${galleryItems.length} gallery items.`);
        for (const item of galleryItems) {
            if (item.img && typeof item.img === 'string') {
                const parts = item.img.split('?')[0].split('/');
                const fileName = parts.pop();
                if (fileName) {
                    const dest = `images/${item.id}-${fileName}`;
                    // Skip if already migrated by this script? Or just overwrite. Overwrite is safer.
                    const newUrl = await downloadAndUpload(item.img, dest);
                    if (newUrl) {
                        await db.collection('gallery').doc(item.id.toString()).update({ img: newUrl });
                        process.stdout.write('.');
                    }
                }
            }
        }
    }
    console.log('\nGallery done.');

    // 2. Blog
    console.log('\nProcessing Blog...');
    const { data: blogPosts } = await supabase.from('blog').select('*');
    if (blogPosts) {
        console.log(`Found ${blogPosts.length} blog posts.`);
        for (const post of blogPosts) {
            console.log(`\nMigrating Blog Post ${post.id}: ${post.title}`);

            // Thumbnail
            if (post.thumbnail && typeof post.thumbnail === 'string' && post.thumbnail.includes('supabase.co')) {
                const parts = post.thumbnail.split('?')[0].split('/');
                const fileName = parts.pop();
                if (fileName) {
                    const dest = `images/${post.id}-thumb-${fileName}`;
                    const newUrl = await downloadAndUpload(post.thumbnail, dest);
                    if (newUrl) {
                        await db.collection('blog').doc(post.id.toString()).update({ thumbnail: newUrl });
                        console.log(`  - Thumbnail migrated.`);
                    }
                }
            }

            // Albums
            if (post.albums && Array.isArray(post.albums)) {
                let changed = false;
                const updatedAlbums = [];
                for (let i = 0; i < post.albums.length; i++) {
                    const album = post.albums[i];
                    // The structure in Firestore is { photos: string[] }
                    // But in Supabase it might be string[] or string
                    const photos = Array.isArray(album) ? album : (album.photos || [album]);
                    const newPhotos = [];
                    for (let j = 0; j < photos.length; j++) {
                        const p = photos[j];
                        if (p && typeof p === 'string' && p.includes('supabase.co')) {
                            const parts = p.split('?')[0].split('/');
                            const fileName = parts.pop();
                            if (fileName) {
                                const dest = `images/${post.id}-album-${i}-${j}-${fileName}`;
                                const nUrl = await downloadAndUpload(p, dest);
                                if (nUrl) {
                                    newPhotos.push(nUrl);
                                    changed = true;
                                } else {
                                    newPhotos.push(p);
                                }
                            } else {
                                newPhotos.push(p);
                            }
                        } else {
                            newPhotos.push(p);
                        }
                    }
                    updatedAlbums.push({ photos: newPhotos });
                }
                if (changed) {
                    await db.collection('blog').doc(post.id.toString()).update({ albums: updatedAlbums });
                    console.log(`  - ${updatedAlbums.length} albums updated.`);
                }
            }
        }
    }

    console.log('\n--- Migration Finished ---');
}

startStorageMigration().catch(console.error);
