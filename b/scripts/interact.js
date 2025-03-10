const Web3 = require("web3");
const contract = require("@truffle/contract");
const BiddingArtifact = require("../build/contracts/Bidding.json");
const TransactionLedgerArtifact = require("../build/contracts/TransactionLedger.json");

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545"); // Ganache RPC URL
const web3 = new Web3(provider);

const Bidding = contract(BiddingArtifact);
const TransactionLedger = contract(TransactionLedgerArtifact);
Bidding.setProvider(provider);
TransactionLedger.setProvider(provider);

async function interact() {
    const accounts = await web3.eth.getAccounts();
    const bidding = await Bidding.deployed();
    const ledger = await TransactionLedger.deployed();

    console.log("Placing a bid...");
    await bidding.placeBid(300, { from: accounts[1] });
    console.log("Bid placed successfully!");

    console.log("Recording a transaction...");
    await ledger.addTransaction(accounts[2], 500, "Wheat", "Payment for wheat", { from: accounts[1] });
    console.log("Transaction recorded successfully!");

    const transaction = await ledger.getTransaction(1);
    console.log("Transaction Details:", transaction);
}

interact().catch(console.error);
