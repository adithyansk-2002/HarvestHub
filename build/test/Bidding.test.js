const Bidding = artifacts.require("Bidding");

contract("Bidding", (accounts) => {
    it("should allow a buyer to place a bid", async () => {
        const instance = await Bidding.deployed();
        await instance.placeBid(100, { from: accounts[1] });
        const bid = await instance.getBid(1);
        assert.equal(bid.amount, 100, "Bid amount should be 100");
    });
});
