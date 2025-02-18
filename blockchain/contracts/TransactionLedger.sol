// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TransactionLedger {
    struct Transaction {
        uint256 transactionId;
        address sender;
        address receiver;
        uint256 amount;
        string cropName;
        string message;
        uint256 timestamp;
    }

    uint256 public transactionCounter;
    mapping(uint256 => Transaction) private transactions;

    event Transfer(
        uint256 indexed transactionId,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        string cropName,
        string message,
        uint256 timestamp
    );

    constructor() {
        transactionCounter = 0;
    }

    function addTransaction(
        address _receiver,
        uint256 _amount,
        string memory _cropName,
        string memory _message
    ) public {
        require(_receiver != address(0), "Invalid receiver address");
        require(_amount > 0, "Amount must be greater than zero");

        transactionCounter++;
        transactions[transactionCounter] = Transaction(
            transactionCounter,
            msg.sender,
            _receiver,
            _amount,
            _cropName,
            _message,
            block.timestamp
        );

        emit Transfer(transactionCounter, msg.sender, _receiver, _amount, _cropName, _message, block.timestamp);
    }

    function getTransaction(uint256 _transactionId) public view returns (
        uint256,
        address,
        address,
        uint256,
        string memory,
        string memory,
        uint256
    ) {
        require(_transactionId > 0 && _transactionId <= transactionCounter, "Transaction ID does not exist");
        Transaction memory txn = transactions[_transactionId];
        return (
            txn.transactionId,
            txn.sender,
            txn.receiver,
            txn.amount,
            txn.cropName,
            txn.message,
            txn.timestamp
        );
    }

    function getTransactionCount() public view returns (uint256) {
        return transactionCounter;
    }
}
