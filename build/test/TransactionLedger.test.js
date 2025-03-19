const TransactionLedger = artifacts.require("TransactionLedger");

contract("TransactionLedger", (accounts) => {
    it("should record a transaction", async () => {
        const instance = await TransactionLedger.deployed();
        await instance.addTransaction(accounts[2], 500, "Wheat", "Payment for wheat");
        const txn = await instance.getTransaction(1);
        assert.equal(txn.amount, 500, "Transaction amount should be 500");
    });
});
