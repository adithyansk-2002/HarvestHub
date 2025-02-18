// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HarvestHubTransactions {
    struct Transaction {
        address sender;
        address receiver;
        uint amount;
        string cropName;
        string message;
        uint timestamp;
    }

    Transaction[] private transactions;

    event Transfer(
        address indexed sender,
        address indexed receiver,
        uint amount,
        string cropName,
        string message,
        uint timestamp
    );

    function addTransaction(
        address _receiver,
        uint _amount,
        string memory _cropName,
        string memory _message
    ) public {
        transactions.push(
            Transaction(msg.sender, _receiver, _amount, _cropName, _message, block.timestamp)
        );
        emit Transfer(msg.sender, _receiver, _amount, _cropName, _message, block.timestamp);
    }

    function getAllTransactions() public view returns (Transaction[] memory) {
        return transactions;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }
}
