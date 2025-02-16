const TransactionLedger = artifacts.require("TransactionLedger");

contract("TransactionLedger", (accounts) => {
  it("should record a transaction", async () => {
    const ledger = await TransactionLedger.deployed();
    await ledger.recordTransaction(accounts[1], accounts[2], 500);
    const transaction = await ledger.getTransaction(1);
    assert.equal(transaction.amount, 500, "Transaction amount should be 500");
  });
});
