const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrateUsers() {
  const usersSnap = await db.collection('users').get();
  console.log('Found', usersSnap.size, 'users');
  const batchSize = 500;
  let count = 0;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const updates = {};
    if (!('displayName' in data) && data.fullName) updates.displayName = data.fullName;
    if (!('photoURL' in data) && 'profilePicture' in data) updates.photoURL = data.profilePicture || '';
    if (!('approved' in data)) updates.approved = false;
    // build profile map from existing fields
    const profile = {};
    profile.bio = data.bio || '';
    profile.skills = Array.isArray(data.skills) ? data.skills : [];
    profile.availability = Array.isArray(data.availability) ? data.availability : [];
    updates.profile = profile;
    // optionally keep existing top-level fields; we update profile as well
    await doc.ref.update(updates);
    count++;
    if (count % batchSize === 0) console.log('Processed', count);
  }
  console.log('Done. Updated', count, 'users');
}

migrateUsers().catch(console.error);
