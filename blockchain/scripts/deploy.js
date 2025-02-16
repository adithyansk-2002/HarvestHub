const Web3 = require("web3");
const contract = require("@truffle/contract");
const BiddingArtifact = require("../build/contracts/Bidding.json");
const TransactionLedgerArtifact = require("../build/contracts/TransactionLedger.json");

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545"); // Ganache
const web3 = new Web3(provider);

const Bidding = contract(BiddingArtifact);
const TransactionLedger = contract(TransactionLedgerArtifact);
Bidding.setProvider(provider);
TransactionLedger.setProvider(provider);

async function deployContracts() {
  const accounts = await web3.eth.getAccounts();
  const bidding = await Bidding.new({ from: accounts[0] });
  const ledger = await TransactionLedger.new({ from: accounts[0] });

  console.log("Bidding contract deployed at:", bidding.address);
  console.log("TransactionLedger contract deployed at:", ledger.address);
}

deployContracts();
