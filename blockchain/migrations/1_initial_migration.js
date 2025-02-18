const Migrations = artifacts.require("Migrations");

module.exports = async function (deployer) {
  try {
    console.log("Deploying Migrations contract...");
    await deployer.deploy(Migrations);
    console.log("Migrations contract deployed at:", Migrations.address);
  } catch (error) {
    console.error("Error deploying Migrations contract:", error);
  }
};
