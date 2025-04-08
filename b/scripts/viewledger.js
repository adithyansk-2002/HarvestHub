const { Web3 } = require("web3");
const contract = require("../build/contracts/TransactionLedger.json");

const web3 = new Web3("http://127.0.0.1:7545");

// Dynamically get deployed address
const networkId = Object.keys(contract.networks)[0];
const contractAddress = contract.networks[networkId].address;

async function fetchAllTransactions() {
  const instance = new web3.eth.Contract(contract.abi, contractAddress);
  const count = await instance.methods.getTransactionCount().call();

  console.log(`\n📒 Total Transactions on Blockchain: ${count}\n`);

  for (let i = 0; i < count; i++) {
    const txn = await instance.methods.getTransaction(i).call();

    console.log(`🔹 Transaction #${i + 1}`);
    console.log(`   🥬 Crop Name     : ${txn[0]}`);
    console.log(`   💰 Price per Kg  : ₹${txn[1]} `);
    console.log(`   📦 Quantity     : ${txn[2]} kg`);
    console.log(`   🧑‍💼 Buyer Name   : ${txn[3]}`);
    console.log(`   🧾 Buyer Address : ${txn[4]}`);
    console.log(`   👨‍🌾 Seller Name  : ${txn[5]}`);
    console.log(`   🧾 Seller Address: ${txn[6]}`);
    console.log(`   💵 Total Amount  : ₹${txn[7]}`);
    console.log(`   ⏰ Timestamp     : ${new Date(Number(txn[8]) * 1000).toLocaleString()}`);
    console.log("--------------------------------------------------\n");
  }
}

fetchAllTransactions();
