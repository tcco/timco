import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
  readFileSync('./firebase-service-account.json', 'utf8')
);

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  console.log('=============================================');
  console.log(`Firebase Auth Tool (Project: ${serviceAccount.project_id})`);
  console.log('=============================================\n');

  try {
    if (command === 'list') {
      console.log('Fetching users from Firebase Authentication...');
      const list = await auth.listUsers();
      console.log(`Found ${list.users.length} user(s):\n`);
      if (list.users.length === 0) {
        console.log('No users found in Firebase Auth yet.');
      } else {
        list.users.forEach((u, i) => {
          console.log(`[${i + 1}] UID: ${u.uid}`);
          console.log(`    Email: ${u.email}`);
          console.log(`    Display Name: ${u.displayName || '(none)'}`);
          console.log(`    Created: ${u.metadata.creationTime}`);
          console.log(`    Last Sign-In: ${u.metadata.lastSignInTime || 'Never'}`);
          console.log('---------------------------------------------');
        });
      }
    } else if (command === 'create' || command === 'upsert') {
      const email = args[1];
      const password = args[2];
      const displayName = args[3] || 'Tim';

      if (!email || !password) {
        console.error('Usage: npx tsx scripts/setupAuth.ts create <email> <password> [displayName]');
        process.exit(1);
      }

      console.log(`Checking if user "${email}" already exists...`);
      try {
        const existing = await auth.getUserByEmail(email);
        console.log(`User already exists with UID: ${existing.uid}. Updating password and name...`);
        const updated = await auth.updateUser(existing.uid, {
          password,
          displayName,
        });
        console.log(`✅ Successfully updated user "${updated.email}"!`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          console.log(`Creating new user "${email}"...`);
          const created = await auth.createUser({
            email,
            password,
            displayName,
          });
          console.log(`✅ Successfully created user "${created.email}" (UID: ${created.uid})!`);
        } else {
          throw err;
        }
      }
    } else if (command === 'delete') {
      const email = args[1];
      if (!email) {
        console.error('Usage: npx tsx scripts/setupAuth.ts delete <email>');
        process.exit(1);
      }
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
      console.log(`✅ Successfully deleted user "${email}".`);
    } else {
      console.log('Commands:');
      console.log('  list                                   - List all auth users');
      console.log('  create <email> <password> [name]       - Create or update a user');
      console.log('  delete <email>                         - Delete a user');
    }
  } catch (error: any) {
    console.error('\n❌ Firebase Auth Error:');
    if (error.errorInfo?.message?.includes('PROJECT_SOFT_DELETED') || error.message?.includes('PROJECT_SOFT_DELETED')) {
      console.error(
        '\n🚨 Error: PROJECT_SOFT_DELETED\n' +
        'Identity Platform / Firebase Authentication is currently not initialized or in a suspended state for this project.\n\n' +
        '👉 Solution:\n' +
        '1. Open Firebase Console: https://console.firebase.google.com/project/' + serviceAccount.project_id + '/authentication\n' +
        '2. Click "Get started" (or go to Sign-in method tab).\n' +
        '3. Enable "Email/Password" sign-in provider.\n' +
        '4. Re-run this script!'
      );
    } else {
      console.error(error);
    }
  }
}

main();
