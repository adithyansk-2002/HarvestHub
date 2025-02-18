// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract Bidding {
    struct Bid {
        uint256 bidId;
        address buyer;
        uint256 amount;
        bool accepted;
    }

    uint256 public bidCounter;
    mapping(uint256 => Bid) public bids;
    address public owner;

    event NewBid(uint256 bidId, address buyer, uint256 amount);
    event BidAccepted(uint256 bidId);

    constructor() {
        owner = msg.sender;
    }

    function placeBid(uint256 _amount) public {
        bidCounter++;
        bids[bidCounter] = Bid(bidCounter, msg.sender, _amount, false);
        emit NewBid(bidCounter, msg.sender, _amount);
    }

    function acceptBid(uint256 _bidId) public {
        require(_bidId > 0 && _bidId <= bidCounter, "Invalid bid ID");
        require(!bids[_bidId].accepted, "Bid already accepted");
        
        bids[_bidId].accepted = true;
        emit BidAccepted(_bidId);
    }

    function getBid(uint256 _bidId) public view returns (Bid memory) {
        return bids[_bidId];
    }
}
