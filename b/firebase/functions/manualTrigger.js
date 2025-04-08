// 🔗 Load dependencies
const admin = require("firebase-admin");
const { writeToBlockchain } = require("./blockchainledger");

// 🔑 Initialize Firebase using service account key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ✅ Manually fetch all documents from final_bid collection and push to blockchain
async function simulateFirestoreTrigger() {
  try {
    const snapshot = await db.collection("final_bid").get();
    
    if (snapshot.empty) {
      console.log("❌ No documents found in final_bid.");
      return;
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      if (data.synced) {
        console.log(`⏩ Skipping already synced document: ${doc.id}`);
        continue;
      }

      console.log(`🚀 Processing document: ${doc.id}`);
      console.log('Document data:', JSON.stringify(data, null, 2));

      try {
        await writeToBlockchain(data);
        await doc.ref.update({ synced: true });
        console.log(`✅ Success: Document ${doc.id} saved to blockchain and marked as synced.`);
      } catch (err) {
        console.error(`❌ Error writing doc ${doc.id} to blockchain:`, err);
        console.error('Error details:', err.message);
      }
    }
  } catch (err) {
    console.error("❌ Error accessing Firestore:", err);
    console.error('Error stack:', err.stack);
  }
}

// Run the trigger
simulateFirestoreTrigger(); 