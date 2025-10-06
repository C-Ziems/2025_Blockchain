class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }
    createGenesisBlock() {
        const genesisData = {
            genesis: true,
            transactions: [],
            moneyTable: [
                { name: 'Alice', money: 100 },
                { name: 'Bob', money: 100 },
                { name: 'Charlie', money: 100 }
            ]
        };
        const genesis = new Block(Date.now(), genesisData);
        genesis.lastHash = "".padStart(64, "0");
        this._deepFreeze(genesis);
        return genesis;
    }
    async addBlock(block, nodeID) {
        const prev = this.getLastBlock();
        const prevTable = prev?.data?.moneyTable || [];
        const clonedTable = JSON.parse(JSON.stringify(prevTable));
        block.data = block.data || {};
        block.data.moneyTable = clonedTable;
        block.lastHash = prev.hash || (typeof prev.createHash === 'function' ? prev.createHash() : '');
        block.time = Date.now();
        const res = await block.mine();
        if (!res || !res.ok) {
            return null;
        }
        if (typeof block.resolveTransactions === 'function') {
            block.resolveTransactions();
        }
        this._deepFreeze(block);
        this.chain.push(block);

        const minedHash = block.hash || '';
        console.log(`Node ${nodeID} hat einen neuen Block gemined: ${minedHash}`);

        if (typeof broadcaster !== 'undefined' && broadcaster && typeof broadcaster.notify === 'function') {
            broadcaster.notify(nodeID);
        }
        return block;
    }
    isValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const prev = this.chain[i - 1];
            const curr = this.chain[i];
            const prevStoredHash = prev.hash || (typeof prev.createHash === 'function' ? prev.createHash() : '');
            if (curr.lastHash !== prevStoredHash) {
                return false;
            }
            if (typeof curr.createHash === 'function') {
                const recalculated = curr.createHash();
                const stored = curr.hash || '';
                if (stored !== recalculated) {
                    console.warn(`Data Tamper at index ${i}: gespeicherter Hash != Rehash`);
                    return false;
                }
            }
        }
        return true;
    }
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
    _deepFreeze(obj) {
        const props = Object.getOwnPropertyNames(obj);
        for (const name of props) {
            const value = obj[name];
            if (value && typeof value === 'object') {
                this._deepFreeze(value);
            }
        }
        return Object.freeze(obj);
    }
}