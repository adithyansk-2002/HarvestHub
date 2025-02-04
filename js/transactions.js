// Import Web3
const Web3 = require("web3");

// Connect to local Ethereum blockchain (Ganache)
const web3 = new Web3("http://127.0.0.1:7545");

// Contract details (replace with your contract address & ABI)
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const abi = [/* Paste your ABI from truffle compile output here */];

const contract = new web3.eth.Contract(abi, contractAddress);

// Send transaction (buyer paying seller for crops)
async function sendTransaction(receiver, amount, cropName, message) {
    const accounts = await web3.eth.getAccounts();
    await contract.methods
        .addTransaction(receiver, amount, cropName, message)
        .send({ from: accounts[0] });
}

// Fetch transactions from blockchain
async function fetchTransactions() {
    const transactions = await contract.methods.getAllTransactions().call();
    console.log(transactions);
}

// Export functions for UI use
export { sendTransaction, fetchTransactions };
