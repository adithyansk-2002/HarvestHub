// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TransactionLedger {
    struct Transaction {
        uint256 transactionId;
        address farmer;
        address buyer;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public transactionCounter;
    mapping(uint256 => Transaction) public transactions;
    
    event TransactionRecorded(uint256 transactionId, address farmer, address buyer, uint256 amount);

    // 🔹 Initialize transaction counter in the constructor
    constructor() {
        transactionCounter = 0;
    }

    // 🔹 Function to record a transaction with input validation
    function recordTransaction(address _farmer, address _buyer, uint256 _amount) public {
        require(_farmer != address(0), "Invalid farmer address");
        require(_buyer != address(0), "Invalid buyer address");
        require(_amount > 0, "Amount must be greater than zero");

        transactionCounter++;
        transactions[transactionCounter] = Transaction(transactionCounter, _farmer, _buyer, _amount, block.timestamp);
        emit TransactionRecorded(transactionCounter, _farmer, _buyer, _amount);
    }

    // 🔹 Function to retrieve transaction details safely
    function getTransaction(uint256 _transactionId) public view returns (Transaction memory) {
        require(_transactionId > 0 && _transactionId <= transactionCounter, "Transaction ID does not exist");
        return transactions[_transactionId];
    }
}
