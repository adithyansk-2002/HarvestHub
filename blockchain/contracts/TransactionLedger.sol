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

    function recordTransaction(address _farmer, address _buyer, uint256 _amount) public {
        transactionCounter++;
        transactions[transactionCounter] = Transaction(transactionCounter, _farmer, _buyer, _amount, block.timestamp);
        emit TransactionRecorded(transactionCounter, _farmer, _buyer, _amount);
    }

    function getTransaction(uint256 _transactionId) public view returns (Transaction memory) {
        return transactions[_transactionId];
    }
}
