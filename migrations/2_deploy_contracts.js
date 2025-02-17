const HarvestHubTransactions = artifacts.require("HarvestHubTransactions");

module.exports = function (deployer) {
  deployer.deploy(HarvestHubTransactions);
};
