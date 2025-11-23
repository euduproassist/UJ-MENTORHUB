const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrateNotifications() {
  const snap = await db.collection('notifications').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    const userId = data.userId || data.uid || 'unknown';
    const userNotifsRef = db.collection('notifications').doc(userId).collection('notifications');
    await userNotifsRef.add({
      title: data.title || '',
      body: data.message || data.body || '',
      read: data.read === undefined ? false : data.read,
      createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      link: data.link || ''
    });
    await doc.ref.delete();
  }
  console.log('Notifications migrated');
}

migrateNotifications().catch(console.error);
