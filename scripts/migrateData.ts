import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.VITE_SERVICE_ROLE_KEY!;
const FIREBASE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'firebase-service-account.json'), 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: FIREBASE_BUCKET,
});

const db = admin.firestore();

// Helper to convert Supabase URL to Firebase Storage URL
// Note: This assumes the user uploaded files to an 'images' folder in Firebase Storage
function transformUrl(supabaseUrl: string | null | undefined): string {
    if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) return supabaseUrl || '';

    const fileName = supabaseUrl.split('/').pop()?.split('?')[0];
    if (!fileName) return supabaseUrl;

    // Pattern for Firebase Storage public URLs:
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/images%2F[FILENAME]?alt=media
    return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/images%2F${encodeURIComponent(fileName)}?alt=media`;
}

async function migrateTable(tableName: string, collectionName: string, transformFn?: (data: any) => any) {
    console.log(`Migrating ${tableName}...`);
    const { data, error } = await supabase.from(tableName).select('*');

    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return;
    }

    console.log(`Found ${data.length} rows in ${tableName}`);

    const batch = db.batch();
    data.forEach((row) => {
        const docRef = db.collection(collectionName).doc(row.id.toString());
        let finalData = { ...row };
        if (transformFn) {
            finalData = transformFn(finalData);
        }
        batch.set(docRef, finalData);
    });

    await batch.commit();
    console.log(`Successfully migrated ${tableName} to ${collectionName}`);
}

async function runMigration() {
    try {
        // 1. Gallery
        await migrateTable('gallery', 'gallery', (row) => ({
            ...row,
            img: transformUrl(row.img),
        }));

        // 2. Sections
        await migrateTable('current_sections', 'current_sections');

        // 3. Items
        await migrateTable('current_items', 'current_items', (row) => ({
            ...row,
            section_id: row.section_id.toString() // Relationships use string IDs now
        }));

        // 4. Albums
        await migrateTable('album', 'album', (row) => ({
            ...row,
            images: Array.isArray(row.images) ? row.images.map(transformUrl) : row.images
        }));

        // 5. Blog
        await migrateTable('blog', 'blog', (row) => ({
            ...row,
            thumbnail: transformUrl(row.thumbnail),
            albums: Array.isArray(row.albums)
                ? row.albums.map((album: any) => ({
                    photos: Array.isArray(album) ? album.map(transformUrl) : [transformUrl(album)]
                }))
                : []
        }));

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
