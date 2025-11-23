const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrateReports() {
  const snap = await db.collection('reports').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    if (!('type' in data)) updates.type = 'incident';
    if (!('params' in data)) updates.params = {};
    if (!('generatedBy' in data)) updates.generatedBy = data.reportedBy || null;
    if (!('url' in data)) updates.url = '';
    await doc.ref.update(updates);
  }
  console.log('Reports migrated');
}

migrateReports().catch(console.error);
