const Bidding = artifacts.require("Bidding");
const TransactionLedger = artifacts.require("TransactionLedger");

module.exports = async function (deployer) {
  try {
    console.log("Deploying Bidding contract...");
    await deployer.deploy(Bidding);
    const biddingInstance = await Bidding.deployed();
    console.log("Bidding contract deployed at:", biddingInstance.address);

    console.log("Deploying TransactionLedger contract...");
    await deployer.deploy(TransactionLedger);
    const transactionLedgerInstance = await TransactionLedger.deployed();
    console.log("TransactionLedger contract deployed at:", transactionLedgerInstance.address);
    
  } catch (error) {
    console.error("Error during contract deployment:", error);
  }
};
