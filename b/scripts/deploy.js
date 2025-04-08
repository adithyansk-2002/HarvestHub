const TransactionLedger = artifacts.require("TransactionLedger");

module.exports = async function (callback) {
  const deployed = await TransactionLedger.deployed();
  console.log("Contract deployed at:", deployed.address);
  callback();
};
