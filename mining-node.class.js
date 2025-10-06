class MiningNode {
    isMining = false;
    currentBlock = null;
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.blockData = { transactions: [] };
        renderCurrentTransactions(this.blockData.
            transactions);
        broadcaster.subscribe((nodeID) => {
            if (nodeID !== this.id) {
                this.killCurrentBlock();
            }
        });
    }
    toggle() {
        this.isMining = !this.isMining;
        if (this.isMining) {
            console.log(`Node ${this.name} startet das Mining.`);
            this.mine();
        } else {
            console.log(`Node ${this.name} stoppt das Mining.`);
            this.killCurrentBlock();
        }
    }
    async mine() {
        const userTxs = Array.isArray(mempool) ? mempool.slice() : [];
        const rewardTx = { from: 'BlockReward', to: this.name, amount: 5 };
        this.blockData = { transactions: [...userTxs, rewardTx] };
        if (typeof renderCurrentTransactions === 'function') renderCurrentTransactions();
        this.currentBlock = new Block(Date.now(), this.blockData);
        const added = await blockchain.addBlock(this.currentBlock, this.id);
        if (added && Array.isArray(mempool) && userTxs.length) {
            userTxs.forEach(u => {
                const i = mempool.findIndex(t =>
                    t.from === u.from && t.to === u.to && Number(t.amount) === Number(u.amount)
                );
                if (i > -1) mempool.splice(i, 1);
            });
            if (typeof renderCurrentTransactions === 'function') renderCurrentTransactions();
        }
        this.currentBlock = null;
        if (this.isMining) {
            this.blockData = { transactions: [] };
            this.mine();
        }
    }
    killCurrentBlock() {
        if (this.currentBlock) {
            this.currentBlock.kill = true;
            this.currentBlock = null;
        }
        this.blockData = { transactions: [] };
        if (typeof renderCurrentTransactions === 'function') {
            renderCurrentTransactions();
        }
    }
}