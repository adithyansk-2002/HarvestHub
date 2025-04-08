const { Web3 } = require("web3");
const contract = require("../build/contracts/TransactionLedger.json");

const web3 = new Web3("http://127.0.0.1:7545");
const contractAddress = "0xf40B6eFc6dFfbAC8171c346354a3a3eB8fD7bf59"; // Replace

async function fetchAllTransactions() {
  const instance = new web3.eth.Contract(contract.abi, contractAddress);
  const count = await instance.methods.getTransactionCount().call();
  console.log(`Total transactions: ${count}`);

  for (let i = 0; i < count; i++) {
    const txn = await instance.methods.getTransaction(i).call();
    console.log(`Txn #${i + 1}:`, txn);
  }
}

fetchAllTransactions();
