// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TransactionLedger {
    struct Transaction {
        string cropName;
        uint256 pricePerKg;
        uint256 quantity;
        string buyerName;
        string buyerAddress;
        string sellerName;
        string sellerAddress;
        uint256 totalAmount;
        uint256 timestamp;
    }

    Transaction[] public transactions;

    function storeTransaction(
        string memory cropName,
        uint256 pricePerKg,
        uint256 quantity,
        string memory buyerName,
        string memory buyerAddress,
        string memory sellerName,
        string memory sellerAddress,
        uint256 totalAmount,
        uint256 timestamp
    ) public {
        Transaction memory txn = Transaction(
            cropName,
            pricePerKg,
            quantity,
            buyerName,
            buyerAddress,
            sellerName,
            sellerAddress,
            totalAmount,
            timestamp
        );
        transactions.push(txn);
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 index) public view returns (
        string memory, uint256, uint256,
        string memory, string memory,
        string memory, string memory,
        uint256, uint256
    ) {
        Transaction memory txn = transactions[index];
        return (
            txn.cropName,
            txn.pricePerKg,
            txn.quantity,
            txn.buyerName,
            txn.buyerAddress,
            txn.sellerName,
            txn.sellerAddress,
            txn.totalAmount,
            txn.timestamp
        );
    }
}
