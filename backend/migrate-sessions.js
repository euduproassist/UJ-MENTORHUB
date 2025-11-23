const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrateSessions() {
  const snap = await db.collection('sessions').get();
  console.log('Sessions found:', snap.size);

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};

    if (!('title' in data)) updates.title = `${data.type || 'Session'} with ${data.tutorId || 'TBD'}`;
    if (!('description' in data)) updates.description = data.description || '';
    if (!('subjectTags' in data)) updates.subjectTags = data.subjectTags || [];
    if (!('status' in data)) updates.status = data.status || 'requested';
    if (!('scheduledAt' in data)) {
      if (data.date && data.time) {
        const dt = new Date(`${data.date}T${data.time}:00Z`);
        updates.scheduledAt = admin.firestore.Timestamp.fromDate(dt);
      } else {
        updates.scheduledAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }
    if (!('notes' in data)) updates.notes = '';

    await doc.ref.update(updates);
  }

  console.log('Sessions migration completed.');
}

migrateSessions().catch(console.error);

