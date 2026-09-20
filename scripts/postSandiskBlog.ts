import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

const FIREBASE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app';

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: FIREBASE_BUCKET
    });
}

const db = getFirestore(admin.app(), 'main');
const bucket = admin.storage().bucket();

const imageFiles = {
    badge: '/Users/timothyco/.gemini/antigravity/brain/6f4979cb-84d2-46f4-a5a7-decb7a67affe/.user_uploaded/media_1788581217039.jpg',
    products: '/Users/timothyco/.gemini/antigravity/brain/6f4979cb-84d2-46f4-a5a7-decb7a67affe/.user_uploaded/media_1788581217207.jpg',
    hats: '/Users/timothyco/.gemini/antigravity/brain/6f4979cb-84d2-46f4-a5a7-decb7a67affe/.user_uploaded/media_1788581217211.jpg'
};

async function uploadImage(localPath: string, baseName: string): Promise<string> {
    const dest = `images/${Math.random()}-${baseName}.jpg`;
    console.log(`Uploading ${localPath} to ${dest}...`);
    await bucket.upload(localPath, {
        destination: dest,
        metadata: { contentType: 'image/jpeg' }
    });
    try {
        await bucket.file(dest).makePublic();
    } catch (e) {
        // bucket may use uniform bucket-level access
    }
    return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodeURIComponent(dest)}?alt=media`;
}

async function createPost() {
    console.log('--- Starting SanDisk Blog Post Creation ---');

    for (const [key, path] of Object.entries(imageFiles)) {
        if (!existsSync(path)) {
            throw new Error(`Missing image file: ${path}`);
        }
    }

    const badgeUrl = await uploadImage(imageFiles.badge, 'sandisk-badge');
    const productsUrl = await uploadImage(imageFiles.products, 'sandisk-products');
    const hatsUrl = await uploadImage(imageFiles.hats, 'sandisk-deepmind-hats');

    console.log('Badge URL:', badgeUrl);
    console.log('Products URL:', productsUrl);
    console.log('Hats URL:', hatsUrl);

    const title = 'A Look Back at My Time at SanDisk';

    const content = `Here we go. The next professional venture feels daunting yet so fitting for my long-term hopes and dreams. But first, a look back at my time at SanDisk.

# The SanDisk Journey
When I started, we were dealing with seven legacy apps across disparate features and platforms. Some were even built by external vendors who had little forbearance for the codebase. Our goal was to build a unified app with a modernized UX, all tied to a new flagship product that was modular, remote, and featured a physical dock.

I had the opportunity to work with a team I’d collaborated with in the past across product, design, and engineering. Frankly, this was a blessing and a curse. On one hand, there was the comfort of established relationships. On the other, there was a lack of storage domain expertise and a stark cultural contrast. The charter seemed simple, but it meant aligning firmware, software, architects, QA, product, and design, and hoping something magical would output from the get-go.

We committed to too much at once. A new cross-platform app, a flagship product innovating in wireless and modularity, and an attempt to shift the internal culture. With all these focuses, there ended up being a lack of clear internal ownership and a loss of touch with my own teams. This led to a full course correction of our operating model across a global team with wildly different styles and expertise.

# Course Correction
From a product perspective, we did what we needed to do to overhaul the software platform functionally and legally. But along the way, we built sub-optimal mobile apps, designed a desktop app that attempted to rival Finder, and unsurprisingly discontinued the flagship product before it even started. This was after 8 to 10 months of solutioning, grit, and overall toil.

We had to hone in. The app experience, reliability, and reviews were in a bad spot. We landed on a tick-tock approach of sorting out underlying platform reliability first, while imagining a truly simple, user-friendly UX we could patch on top. The redesign portion always has a starting place but ends up being a never-ending continuum.

I’m proud to say the team's focus led to a mobile app that is reliable in the face of massive amounts of variable user data, fun and easy to use, and well-rated. We’re now sitting at over 4.5 globally on iOS and Android, with over 1 million MAUs across the four platforms.

# The Future of SanDisk
The next step is adding a true value proposition for content workflows, catering to creators, photographers, and heads of households dealing with a bunch of content or organizing family albums. This is the true vector for the desktop platforms. As for the flagship product, the intent was right even if it was too early and poorly executed. I’m excited to see the team revisit wireless and integrate AI with the ever-growing user data story tied to it.

What I am most proud of, however, is the transformation the entire SanDisk consumer organization endured. They watched as what was once a pit of software became a unified, comprehensible utility and an actual marketable value-add. The organization shifted 180 degrees to fully adopt the value propositions and understand how hardware and software intersect to create real user value. See all the progress summated in this official SanDisk blog post.

//=//=//=//

# Saying Goodbye
It’s hard saying goodbye to a team I’ve worked with for close to a decade, as well as the new connections I’ve made along the way that I’ll be sure to connect with again. I’ve been able to make new connections across the globe in functions I never expected, and encountered entirely new hardware domains. Leaving on a high note with a positive trajectory was more than I could ask for.

Sometimes life feels random, but other times self-fulfilling prophecies feel at work. Both my past role in fintech and my curiosity about the intersection of hardware and software have come to light. Re-entering AI from where I co-founded a company is so fitting and exactly where I intend to be long term.

Now onto Google DeepMind, where I enter an unknown and frontier foray helping model research in coding. It’s an environment where I’ll have to be alright with being very uncomfortable. I’ll be learning endlessly, and in the back of my mind, I know that’s what I truly value.

//=//=//=//`;

    const postDoc = {
        title,
        content,
        category: 'growth',
        draft: false,
        archive: false,
        thumbnail: badgeUrl,
        albums: [
            {
                photos: [productsUrl]
            },
            {
                photos: [hatsUrl]
            }
        ],
        created_at: '2026-06-15T12:00:00.000Z'
    };

    // Find next ID
    const snap = await db.collection('blog').get();
    let maxId = 0;
    snap.forEach(doc => {
        const num = parseInt(doc.id, 10);
        if (!isNaN(num) && num > maxId) {
            maxId = num;
        }
    });
    const nextId = (maxId + 1).toString();
    console.log(`Assigning Document ID: ${nextId}`);

    await db.collection('blog').doc(nextId).set(postDoc);
    console.log(`✓ Post created successfully with ID: ${nextId}`);
}

createPost().catch(console.error);
