import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkImageUrls() {
    console.log('--- Gallery URLs ---');
    const gallery = await db.collection('gallery').limit(5).get();
    gallery.forEach(doc => {
        console.log(`Doc ${doc.id}: ${doc.data().img}`);
    });

    console.log('\n--- Blog URLs ---');
    const blog = await db.collection('blog').limit(2).get();
    blog.forEach(doc => {
        const data = doc.data();
        console.log(`Post ${doc.id}:`);
        console.log(`  Thumbnail: ${data.thumbnail}`);
        if (data.albums) {
            console.log(`  Albums: ${JSON.stringify(data.albums[0]?.photos?.slice(0, 2))}`);
        }
    });
}

checkImageUrls().catch(console.error);
