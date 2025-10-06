let mempool = [];
window.mempool = mempool;
let blockchain = new Blockchain();
let node0 = new MiningNode(0, 'Alice');
let node1 = new MiningNode(1, 'Bob');
let node2 = new MiningNode(2, 'Charlie');
newTransaction.subscribe((transaction) => {
    mempool.push(transaction);
    renderCurrentTransactions();
});
const nodesBySwitchId = {
    nodeAlice: node0,
    nodeBob: node1,
    nodeCharlie: node2,
};
document.querySelectorAll(".node-switch").forEach((el) => {
    el.addEventListener("change", function () {
        const node = nodesBySwitchId[this.id];
        if (!node) return;
        node.toggle();
    });
});
function syncBadgesFromChain() {
    const last = blockchain.getLastBlock?.();
    const table = last?.data?.moneyTable || [];
    const get = (name) => table.find(e => e.name === name)?.money ?? 0;
    const a = document.getElementById('balAlice');
    const b = document.getElementById('balBob');
    const c = document.getElementById('balCharlie');
    if (a) a.textContent = get('Alice');
    if (b) b.textContent = get('Bob');
    if (c) c.textContent = get('Charlie');
}
syncBadgesFromChain();
function renderChain() {
    const ul = document.getElementById('blocksList');
    if (!ul) return;
    ul.innerHTML = '<h2>Blockchain</h2>';
    (blockchain.chain || []).forEach((b, idx) => {
        const ts = new Date(b.time ?? Date.now()).toLocaleString();
        const shortHash = (b.hash || '').toString().slice(0, 12);
        const shortPrev = (b.lastHash || '').toString().slice(0, 12);
        ul.innerHTML += `
      <li id="${idx}" class="card p-2 mb-2 block-item" data-index="${idx}" style="cursor:pointer">
        <div><strong>#${idx}</strong> ${b.data?.genesis ? '(Genesis)' : ''}</div>
        <div>Zeit: ${ts}</div>
        <div>Nonce: ${b.nonce ?? 0}</div>
        <div>Prev: ${shortPrev}…</div>
        <div>Hash: ${shortHash}…</div>
      </li>`;
    });
}
renderChain();
broadcaster.subscribe(() => {
    renderChain();
    syncBadgesFromChain();
    renderCurrentTransactions();
});
const txForm = document.getElementById('txForm');
if (txForm) {
    txForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const from = document.getElementById('sender').value.trim();
        const to = document.getElementById('receiver').value.trim();
        const amount = parseInt(document.getElementById('amount').value, 10) || 0;
        if (!from || !to || !amount) return;
        newTransaction.notify({ from, to, amount });
        txForm.reset();
    });
}
function renderCurrentTransactions(transactions) {
    const list = document.getElementById('mempoolList');
    const placeholder = document.getElementById('mempoolPlaceholder');
    if (!list) return;
    if (!mempool || mempool.length === 0) {
        list.innerHTML = '';
        if (placeholder) placeholder.style.display = '';
        else list.innerHTML = '<li class="text-muted">Keine Transaktionen im Mempool.</li>';
        return;
    }
    if (placeholder) placeholder.style.display = 'none';
    list.innerHTML = '';
    mempool.forEach(ta => {
        list.innerHTML += `<li class="card p-2 mb-2">${ta.from} ➔ ${ta.to} $${ta.amount}</li>`;
    });
}
function renderBlockInfo(index) {
    const b = blockchain.chain?.[index];
    const info = document.getElementById('blockInfo');
    if (!info) return;
    if (!b) {
        info.innerHTML = '<em>Block nicht gefunden.</em>';
        return;
    }
    const ts = new Date(b.time ?? Date.now()).toLocaleString();
    const tx = Array.isArray(b.data?.transactions) ? b.data.transactions : [];
    const txHtml = tx.length
        ? tx.map((t, i) => `
        <li class="list-group-item">
          <div><strong>Tx ${i + 1}</strong></div>
          <div>from: <code>${t.from ?? ''}</code></div>
          <div>to: <code>${t.to ?? ''}</code></div>
          <div>amount: <code>${t.amount ?? 0}</code></div>
        </li>`).join('')
        : '<li class="list-group-item text-secondary">Keine Transaktionen</li>';
    info.innerHTML = `
    <h5 class="card-title mb-3">Blockdetails #${index} ${b.data?.genesis ? '(Genesis)' : ''}</h5>
    <div class="mb-2"><strong>Zeit:</strong> ${ts}</div>
    <div class="mb-2"><strong>Difficulty:</strong> <code>${b.difficulty ?? ''}</code></div>
    <div class="mb-2"><strong>Nonce:</strong> <code>${b.nonce ?? 0}</code></div>
    <div class="mb-2"><strong>Vorgänger-Hash (lastHash):</strong><br><code style="word-break:break-all">${b.lastHash || ''}</code></div>
    <div class="mb-3"><strong>Aktueller Hash:</strong><br><code style="word-break:break-all">${b.hash || ''}</code></div>
    <div class="mb-2"><strong>Anzahl Transaktionen:</strong> ${tx.length}</div>
    <ul class="list-group">${txHtml}</ul>
  `;
}
const blocksUl = document.getElementById('blocksList');
if (blocksUl) {
    blocksUl.addEventListener('click', (ev) => {
        const li = ev.target.closest('.block-item');
        if (!li) return;
        const idx = parseInt(li.dataset.index, 10);
        if (Number.isInteger(idx)) {
            renderBlockInfo(idx);
        }
    });
}