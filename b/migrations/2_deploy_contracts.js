const TransactionLedger = artifacts.require("TransactionLedger");

module.exports = function (deployer) {
  deployer.deploy(TransactionLedger);
};
