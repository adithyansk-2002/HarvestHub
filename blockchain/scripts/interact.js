const Web3 = require("web3");
const contract = require("@truffle/contract");
const BiddingArtifact = require("../build/contracts/Bidding.json");
const TransactionLedgerArtifact = require("../build/contracts/TransactionLedger.json");

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
const web3 = new Web3(provider);

const Bidding = contract(BiddingArtifact);
const TransactionLedger = contract(TransactionLedgerArtifact);
Bidding.setProvider(provider);
TransactionLedger.setProvider(provider);

async function interact() {
  const accounts = await web3.eth.getAccounts();
  const bidding = await Bidding.deployed();
  const ledger = await TransactionLedger.deployed();

  // Place a bid
  await bidding.placeBid(200, { from: accounts[1] });
  console.log("Bid placed");

  // Record a transaction
  await ledger.recordTransaction(accounts[1], accounts[2], 500);
  console.log("Transaction recorded");
}

interact();
