const { Web3 } = require("web3");
const contract = require("../../build/contracts/TransactionLedger.json");

const web3 = new Web3("http://127.0.0.1:7545");
const contractAddress = "0xf40B6eFc6dFfbAC8171c346354a3a3eB8fD7bf59"; // Replace after truffle migrate

const deployedContract = new web3.eth.Contract(contract.abi, contractAddress);

const writeToBlockchain = async (data) => {
  const accounts = await web3.eth.getAccounts();

  await deployedContract.methods
    .storeTransaction(
      data.cropName,
      parseInt(data.pricePerKg),
      parseInt(data.quantity),
      data.buyer.name,
      data.buyer.address,
      data.seller.name,
      data.seller.address,
      parseInt(data.totalAmount),
      Math.floor(Date.now() / 1000)
    )
    .send({ from: accounts[0], gas: 3000000 });
};

module.exports = { writeToBlockchain };
