// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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

    event NewBid(uint256 bidId, address indexed buyer, uint256 amount);
    event BidAccepted(uint256 bidId, address indexed buyer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function placeBid(uint256 _amount) public {
        require(_amount > 0, "Bid amount must be greater than zero");

        bidCounter++;
        bids[bidCounter] = Bid(bidCounter, msg.sender, _amount, false);
        emit NewBid(bidCounter, msg.sender, _amount);
    }

    function acceptBid(uint256 _bidId) public onlyOwner {
        require(_bidId > 0 && _bidId <= bidCounter, "Invalid bid ID");
        require(!bids[_bidId].accepted, "Bid already accepted");

        bids[_bidId].accepted = true;
        emit BidAccepted(_bidId, bids[_bidId].buyer, bids[_bidId].amount);
    }

    function getBid(uint256 _bidId) public view returns (uint256, address, uint256, bool) {
        require(_bidId > 0 && _bidId <= bidCounter, "Bid ID does not exist");
        Bid memory bid = bids[_bidId];
        return (bid.bidId, bid.buyer, bid.amount, bid.accepted);
    }

    function getAllBids() public view returns (Bid[] memory) {
        Bid[] memory bidList = new Bid[](bidCounter);
        for (uint256 i = 1; i <= bidCounter; i++) {
            bidList[i - 1] = bids[i];
        }
        return bidList;
    }
}
