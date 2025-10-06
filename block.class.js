class Block {
    constructor(time = Date.now(), data = {}) {
        this.time = time;
        this.data = data;
        this.lastHash = '';
        this.nonce = 0;
        this.difficulty = '00';
        this.kill = false;
        this.hash = this.createHash();
    }
    createHash() {
        const hashPayload = {
            transactions: Array.isArray(this.data?.transactions) ? this.data.transactions : []
        };
        return sha256(
            String(this.time) +
            JSON.stringify(hashPayload) +
            String(this.lastHash) +
            String(this.nonce)
        );
    }
    mine() {
        return new Promise((resolve) => {
            let hash = this.createHash();
            const intervalId = setInterval(() => {
                if (this.kill) {
                    clearInterval(intervalId);
                    return resolve({ ok: false, aborted: true });
                }
                if (hash.startsWith(this.difficulty)) {
                    clearInterval(intervalId);
                    this.hash = hash;
                    return resolve({ ok: true, aborted: false });
                }
                this.nonce++;
                hash = this.createHash();
            }, 1000 / 30);
        });
    }
    resolveTransactions() {
        const transactions = Array.isArray(this.data.transactions) ? this.data.transactions : [];

        transactions.forEach(tx => {
            if (!tx) return;
            const from = tx.from ?? null;
            const to = tx.to ?? null;
            const amount = Number(tx.amount) || 0;
            if (to && amount) {
                this.addMoney(from, to, amount);
            }
        });
    }
    addMoney(sender, receiver, amount) {
        let moneyTable = Array.isArray(this.data.moneyTable) ? this.data.moneyTable : [];
        const ensureEntry = (name) => {
            let entry = moneyTable.find(e => e.name === name);
            if (!entry) {
                entry = { name, money: 0 };
                moneyTable.push(entry);
            }
            return entry;
        };
        if (sender && sender !== 'BlockReward') {
            const s = ensureEntry(sender);
            s.money -= Number(amount) || 0;
        }
        const r = ensureEntry(receiver);
        r.money += Number(amount) || 0;
        this.data.moneyTable = moneyTable;
    }
}