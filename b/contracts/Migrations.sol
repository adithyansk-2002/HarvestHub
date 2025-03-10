// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Migrations {
    address public owner;
    uint256 public lastCompletedMigration;

    event MigrationCompleted(uint256 migrationId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setCompleted(uint256 completed) public onlyOwner {
        lastCompletedMigration = completed;
        emit MigrationCompleted(completed);
    }
}
