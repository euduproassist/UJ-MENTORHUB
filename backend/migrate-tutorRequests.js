const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrateTutorRequests() {
  const snap = await db.collection('tutorRequests').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    if (!('cvUrl' in data)) updates.cvUrl = '';
    if (!('bio' in data)) {
      if (data.userId) {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) updates.bio = userDoc.data().profile?.bio || userDoc.data().bio || '';
      } else updates.bio = '';
    }
    if (!('subjects' in data)) updates.subjects = [];
    if (!('submittedAt' in data)) updates.submittedAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    await doc.ref.update(updates);
  }
  console.log('tutorRequests migration done');
}

migrateTutorRequests().catch(console.error);
