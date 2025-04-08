const { Web3 } = require("web3");
const contract = require("../build/contracts/TransactionLedger.json");

const web3 = new Web3("http://127.0.0.1:7545");
const contractAddress = "0xf40B6eFc6dFfbAC8171c346354a3a3eB8fD7bf59"; // Replace this after migration

const main = async () => {
  const accounts = await web3.eth.getAccounts();
  const instance = new web3.eth.Contract(contract.abi, contractAddress);

  const count = await instance.methods.getTransactionCount().call();
  console.log(`Stored Transactions: ${count}`);

  if (count > 0) {
    const txn = await instance.methods.getTransaction(0).call();
    console.log("First Transaction:", txn);
  }
};

main();
