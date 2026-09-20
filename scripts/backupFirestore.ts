import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'firebase-service-account.json');

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`Error: Service account file not found at ${SERVICE_ACCOUNT_PATH}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function dumpDatabase(databaseId: string): Promise<Record<string, any[]>> {
  const db = databaseId === '(default)' ? admin.firestore() : getFirestore(admin.app(), databaseId);
  const collections = await db.listCollections();
  const dbData: Record<string, any[]> = {};

  for (const col of collections) {
    const snap = await col.get();
    dbData[col.id] = snap.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    console.log(`  [${databaseId}] ${col.id}: ${dbData[col.id].length} documents`);
  }

  return dbData;
}

async function main() {
  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  console.log(`Starting Firestore backup at ${timestamp}...`);

  const databasesToBackup = ['(default)', 'main'];
  const databasesOutput: Record<string, Record<string, any[]>> = {};

  for (const dbId of databasesToBackup) {
    try {
      console.log(`\nFetching collections from database "${dbId}"...`);
      databasesOutput[dbId] = await dumpDatabase(dbId);
    } catch (err: any) {
      console.warn(`Warning: Could not back up database "${dbId}":`, err.message);
    }
  }

  const payload = {
    exportedAt: timestamp,
    projectId: serviceAccount.project_id,
    databases: databasesOutput
  };

  const formattedDate = timestamp.replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `firestore_backup_${formattedDate}.json`);
  const latestFile = path.join(backupDir, 'firestore_backup_latest.json');

  writeFileSync(backupFile, JSON.stringify(payload, null, 2));
  writeFileSync(latestFile, JSON.stringify(payload, null, 2));

  console.log(`\nBackup complete!`);
  console.log(`- Timestamped: ${backupFile}`);
  console.log(`- Latest:      ${latestFile}`);
}

main().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
