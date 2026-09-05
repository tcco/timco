import { createClient } from '@supabase/supabase-js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.VITE_SERVICE_ROLE_KEY!;
const FIREBASE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: FIREBASE_BUCKET
});

const db = getFirestore(app, 'main');
const bucket = getStorage(app).bucket();

function createFirebaseUrl(destinationPath: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodeURIComponent(destinationPath)}?alt=media`;
}

async function remigrate() {
    console.log('=== FULL SUPABASE RESTORATION TO FIRESTORE (main) ===\n');

    // 1. Index all files currently in Cloud Storage
    const [files] = await bucket.getFiles({ prefix: 'images/' });
    const storageFiles = new Set(files.map(f => f.name));
    console.log(`Indexed ${storageFiles.size} files in Firebase Storage.`);

    // 2. Sections
    console.log('\n--- 1. Restoring Current Sections ---');
    const { data: sections, error: secErr } = await supabase.from('current_sections').select('*');
    if (secErr) throw secErr;
    console.log(`Found ${sections.length} sections in Supabase.`);
    
    // Clear old placeholder sections first
    const existingSecs = await db.collection('current_sections').get();
    const batchSecClear = db.batch();
    existingSecs.forEach(d => batchSecClear.delete(d.ref));
    await batchSecClear.commit();

    const secBatch = db.batch();
    sections.forEach(s => {
        secBatch.set(db.collection('current_sections').doc(s.id.toString()), {
            title: s.title,
            created_at: s.created_at
        });
    });
    await secBatch.commit();
    console.log('✓ Successfully restored current_sections.');

    // 3. Items
    console.log('\n--- 2. Restoring Current Items ---');
    const { data: items, error: itemErr } = await supabase.from('current_items').select('*');
    if (itemErr) throw itemErr;
    console.log(`Found ${items.length} items in Supabase.`);

    // Clear old placeholder items
    const existingItems = await db.collection('current_items').get();
    const batchItemClear = db.batch();
    existingItems.forEach(d => batchItemClear.delete(d.ref));
    await batchItemClear.commit();

    const itemBatch = db.batch();
    items.forEach(item => {
        itemBatch.set(db.collection('current_items').doc(item.id.toString()), {
            title: item.title || '',
            description: item.description || '',
            link: item.link || '',
            section_id: item.section_id ? item.section_id.toString() : '',
            order: typeof item.order === 'number' ? item.order : 0,
            created_at: item.created_at
        });
    });
    await itemBatch.commit();
    console.log(`✓ Successfully restored ${items.length} current_items.`);

    // 4. Gallery
    console.log('\n--- 3. Restoring Gallery ---');
    const { data: gallery, error: galErr } = await supabase.from('gallery').select('*');
    if (galErr) throw galErr;
    console.log(`Found ${gallery.length} gallery rows in Supabase.`);

    // Clear old generated gallery
    const existingGal = await db.collection('gallery').get();
    const batchGalClear = db.batch();
    existingGal.forEach(d => batchGalClear.delete(d.ref));
    await batchGalClear.commit();

    const galBatch = db.batch();
    gallery.forEach(g => {
        let finalUrl = g.img || '';
        if (g.img) {
            const fileName = g.img.split('?')[0].split('/').pop();
            const expectedPath = `images/${g.id}-${fileName}`;
            if (storageFiles.has(expectedPath)) {
                finalUrl = createFirebaseUrl(expectedPath);
            } else {
                // Fallback to searching matching filename
                const matched = Array.from(storageFiles).find(f => f.endsWith(fileName || ''));
                if (matched) {
                    finalUrl = createFirebaseUrl(matched);
                } else {
                    finalUrl = createFirebaseUrl(`images/${fileName}`);
                }
            }
        }
        galBatch.set(db.collection('gallery').doc(g.id.toString()), {
            name: g.name || '',
            img: finalUrl,
            order: typeof g.order === 'number' ? g.order : 0,
            created_at: g.created_at
        });
    });
    await galBatch.commit();
    console.log(`✓ Successfully restored ${gallery.length} gallery items.`);

    // 5. Blog
    console.log('\n--- 4. Restoring Blog Posts ---');
    const { data: blog, error: blogErr } = await supabase.from('blog').select('*');
    if (blogErr) throw blogErr;
    console.log(`Found ${blog.length} blog posts in Supabase.`);

    // Clear old blog
    const existingBlog = await db.collection('blog').get();
    const batchBlogClear = db.batch();
    existingBlog.forEach(d => batchBlogClear.delete(d.ref));
    await batchBlogClear.commit();

    const blogBatch = db.batch();
    blog.forEach(b => {
        // Thumbnail
        let thumbnailUrl = b.thumbnail || '';
        if (b.thumbnail) {
            const fileName = b.thumbnail.split('?')[0].split('/').pop();
            const expectedPath = `images/${b.id}-thumb-${fileName}`;
            if (storageFiles.has(expectedPath)) {
                thumbnailUrl = createFirebaseUrl(expectedPath);
            } else {
                const matched = Array.from(storageFiles).find(f => f.endsWith(fileName || ''));
                if (matched) thumbnailUrl = createFirebaseUrl(matched);
                else thumbnailUrl = createFirebaseUrl(`images/${fileName}`);
            }
        }

        // Albums
        let formattedAlbums: { photos: string[] }[] = [];
        if (Array.isArray(b.albums)) {
            formattedAlbums = b.albums.map((album: any, aIdx: number) => {
                const photosArray: string[] = Array.isArray(album) ? album : (album.photos || (typeof album === 'string' ? [album] : []));
                const mappedPhotos = photosArray.map((p: string, pIdx: number) => {
                    if (typeof p !== 'string') return '';
                    const fileName = p.split('?')[0].split('/').pop();
                    const expectedPath = `images/${b.id}-album-${aIdx}-${pIdx}-${fileName}`;
                    if (storageFiles.has(expectedPath)) {
                        return createFirebaseUrl(expectedPath);
                    }
                    const matched = Array.from(storageFiles).find(f => f.endsWith(fileName || ''));
                    if (matched) return createFirebaseUrl(matched);
                    return createFirebaseUrl(`images/${fileName}`);
                }).filter(Boolean);
                return { photos: mappedPhotos };
            });
        }

        blogBatch.set(db.collection('blog').doc(b.id.toString()), {
            title: b.title || '',
            content: b.content || '',
            category: b.category || '',
            draft: Boolean(b.draft),
            archive: Boolean(b.archive),
            thumbnail: thumbnailUrl,
            albums: formattedAlbums,
            created_at: b.created_at
        });
    });
    await blogBatch.commit();
    console.log(`✓ Successfully restored ${blog.length} blog posts.`);

    console.log('\n=== RESTORATION COMPLETE ===');
}

remigrate().catch(console.error);
