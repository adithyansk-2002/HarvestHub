const { Web3 } = require("web3");
const contract = require("../../build/contracts/TransactionLedger.json");

const web3 = new Web3("http://127.0.0.1:7545");

// Dynamically get deployed address
const networkId = Object.keys(contract.networks)[0];
const contractAddress = contract.networks[networkId].address;
const ledger = new web3.eth.Contract(contract.abi, contractAddress);

async function writeToBlockchain(data) {
  const accounts = await web3.eth.getAccounts();
  const sender = accounts[0];

  await ledger.methods
    .storeTransaction(
      data.cropName,
      parseInt(data.pricePerKg),
      parseInt(data.quantity),
      data.buyer.name,
      data.buyer.address,
      data.seller.name,
      data.seller.address,
      parseInt(data.totalAmount),
      Math.floor(Date.now() / 1000)
    )
    .send({ from: sender, gas: 3000000 });

  console.log("✅ Data written to blockchain.");
}

module.exports = { writeToBlockchain };
