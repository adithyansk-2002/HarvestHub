const Bidding = artifacts.require("Bidding");
const TransactionLedger = artifacts.require("TransactionLedger");

module.exports = async function (deployer) {
    console.log("Deploying Bidding contract...");
    await deployer.deploy(Bidding);
    console.log("Deploying TransactionLedger contract...");
    await deployer.deploy(TransactionLedger);
};
