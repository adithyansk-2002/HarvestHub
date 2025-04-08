// 🔗 Load dependencies
const admin = require("firebase-admin");
const { writeToBlockchain } = require("./blockchainledger");

// 🔑 Initialize Firebase using service account key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
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
      
      // Skip if already synced to blockchain
      if (data.synced) {
        console.log(`⏩ Skipping already synced document: ${doc.id}`);
        continue;
      }

      console.log(`🚀 Processing document: ${doc.id}`);
      console.log('Raw document data:', JSON.stringify(data, null, 2));
      
      // Check if buyer and seller exist
      if (!data.buyer) {
        console.log(`⚠️ Document ${doc.id} is missing buyer data`);
        continue;
      }
      if (!data.seller) {
        console.log(`⚠️ Document ${doc.id} is missing seller data`);
        continue;
      }

      // Format the data to match what writeToBlockchain expects
      const blockchainData = {
        cropName: data.cropName,
        pricePerKg: data.pricePerKg,
        quantity: data.quantity,
        totalAmount: data.totalAmount,
        buyer: {
          name: data.buyer.name,
          address: data.buyer.address
        },
        seller: {
          name: data.seller.name,
          address: data.seller.address
        }
      };

      console.log('Formatted data:', JSON.stringify(blockchainData, null, 2));

      try {
        await writeToBlockchain(blockchainData);
        
        // Mark as synced after successful blockchain write
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