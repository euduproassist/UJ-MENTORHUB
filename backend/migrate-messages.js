const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function threadIdFor(a, b) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

async function migrateMessages() {
  const msgsSnap = await db.collection('messages').get();
  console.log('Found messages:', msgsSnap.size);
  for (const doc of msgsSnap.docs) {
    const data = doc.data();
    const sender = data.senderId || data.from;
    const receiver = data.receiverId || data.to;
    if (!sender || !receiver) continue;
    const threadId = threadIdFor(sender, receiver);
    const threadRef = db.collection('messages').doc(threadId);
    const threadSnap = await threadRef.get();
    if (!threadSnap.exists) {
      await threadRef.set({ participants: [sender, receiver], createdAt: data.timestamp || admin.firestore.FieldValue.serverTimestamp() });
    }
    const newMsgRef = threadRef.collection('messages').doc();
    const newMsg = {
      from: sender,
      to: receiver,
      text: data.text || data.message || '',
      sentAt: data.timestamp || admin.firestore.FieldValue.serverTimestamp(),
      seen: data.seen || false
    };
    await newMsgRef.set(newMsg);
    await doc.ref.delete();
  }
  console.log('Messages migrated to threads');
}

migrateMessages().catch(console.error);
