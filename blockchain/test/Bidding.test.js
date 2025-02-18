const Bidding = artifacts.require("Bidding");

contract("Bidding", (accounts) => {
  it("should place a bid", async () => {
    const bidding = await Bidding.deployed();
    await bidding.placeBid(100, { from: accounts[1] });
    const bid = await bidding.getBid(1);
    assert.equal(bid.amount, 100, "Bid amount should be 100");
  });
});
