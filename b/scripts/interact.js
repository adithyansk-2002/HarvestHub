const { Web3 } = require("web3");
const contract = require("../build/contracts/TransactionLedger.json");

const web3 = new Web3("http://127.0.0.1:7545");

// Dynamically get deployed address
const networkId = Object.keys(contract.networks)[0];
const contractAddress = contract.networks[networkId].address;

(async () => {
  try {
    const accounts = await web3.eth.getAccounts();
    const instance = new web3.eth.Contract(contract.abi, contractAddress);

    console.log("🚀 Submitting test transaction...");
    
    await instance.methods.storeTransaction(
      "TestCrop",      // cropName
      1000,            // pricePerKg
      1,               // quantity
      "Buyer1",        // buyerName
      "0xBuyerAddress",// buyerAddress
      "Farmer1",       // sellerName
      "0xSellerAddress",// sellerAddress
      1000,            // totalAmount
      Math.floor(Date.now() / 1000) // timestamp
    ).send({ from: accounts[0], gas: 3000000 });

    console.log("✅ Manual transaction submitted successfully!");
    
    // Verify the transaction was stored
    const count = await instance.methods.getTransactionCount().call();
    console.log(`📊 Total transactions in ledger: ${count.toString()}`);
    
    if (count > 0) {
      const lastTxn = await instance.methods.getTransaction(count - 1n).call();
      console.log("📝 Last transaction details:");
      console.log(`   🥬 Crop Name     : ${lastTxn[0]}`);
      console.log(`   💰 Price per Kg  : ₹${lastTxn[1].toString()}`);
      console.log(`   📦 Quantity     : ${lastTxn[2].toString()} kg`);
      console.log(`   🧑‍💼 Buyer Name   : ${lastTxn[3]}`);
      console.log(`   🧾 Buyer Address : ${lastTxn[4]}`);
      console.log(`   👨‍🌾 Seller Name  : ${lastTxn[5]}`);
      console.log(`   🧾 Seller Address: ${lastTxn[6]}`);
      console.log(`   💵 Total Amount  : ₹${lastTxn[7].toString()}`);
      const timestamp = BigInt(lastTxn[8]) * 1000n;
      console.log(`   ⏰ Timestamp     : ${new Date(Number(timestamp)).toLocaleString()}`);
    }
  } catch (err) {
    console.error("❌ Error submitting transaction:", err);
    console.error("Error details:", err.message);
  }
})();
