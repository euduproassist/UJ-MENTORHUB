const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function createAnalytics() {
  const usersSnap = await db.collection('users').get();
  const sessionsSnap = await db.collection('sessions').get();
  const tutorReqSnap = await db.collection('tutorRequests').where('status','==','pending').get();

  const summary = {
    totalUsers: usersSnap.size,
    totalSessions: sessionsSnap.size,
    tutorApprovalsPending: tutorReqSnap.size,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('analytics').doc('summary').set(summary);
  console.log('Analytics summary created', summary);
}

createAnalytics().catch(console.error);
