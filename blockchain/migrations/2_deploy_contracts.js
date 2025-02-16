const Bidding = artifacts.require("Bidding");
const TransactionLedger = artifacts.require("TransactionLedger");

module.exports = function (deployer) {
  deployer.deploy(Bidding);
  deployer.deploy(TransactionLedger);
};
