const TransactionLedger = artifacts.require("TransactionLedger");
const { exec } = require("child_process");

module.exports = async function (callback) {
  // First run truffle migrate --reset
  exec("truffle migrate --reset", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Deployment error:", err);
      callback(err);
      return;
    }
    console.log("✅ Migration complete:\n", stdout);
    
    // Then get and log the deployed contract address
    TransactionLedger.deployed()
      .then(deployed => {
        console.log("📄 Contract deployed at:", deployed.address);
        callback();
      })
      .catch(err => {
        console.error("❌ Error getting contract address:", err);
        callback(err);
      });
  });
};
