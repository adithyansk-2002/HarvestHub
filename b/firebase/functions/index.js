const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { writeToBlockchain } = require("./blockchainledger");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.onFinalBidCreate = functions.firestore
  .document("final_bid/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    try {
      await writeToBlockchain(data);
      console.log("✅ Saved to blockchain.");
    } catch (err) {
      console.error("❌ Blockchain write failed:", err);
    }
  });
