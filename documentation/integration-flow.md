# BSC ↔ ION Bridge – Mobile Client Integration Manual

This document describes how a **mobile application** should interact with the
**BSC ↔ ION bridge** *purely via RPC / API nodes*.

The code in the legacy Vue component is only a reference.
Below is a clean, implementation-agnostic flow that developers can follow.

---

## 0. Roles & Components

### Chains

* **BSC (EVM)** – where wrapped tokens live (WION / ICE / ION ERC-20 versions).
* **ION** – native chain on which ION contracts and the ION bridge contract live (a fork of TON).

### Core contracts (conceptual)

On **BSC**:

* `IONBridgeRouter` – router contract that:

    * Accepts burns/locks of ERC-20 tokens to move value to ION (`burn(...)`).
    * Accepts oracle signatures to mint tokens when value comes from ION (`voteForMinting(...)`).
* `WION` / `ICE` / `ION` – ERC-20 tokens on BSC.

On **ION**:

* `IonBridge` – ION contract that:

    * Accepts inbound ION transfers from users, with payload that encodes the EVM address.
    * Emits outbound messages that oracles use to mint on BSC.
* `Collector / Multisig` contracts – used by oracles to vote on external events (BSC tx, ION tx).

> **Important:** From the **mobile app** point of view, oracle logic is backend infrastructure.
> The mobile app interacts only with **RPC / API nodes** and polls states.

---

## 1. RPC / API Endpoints

### BSC (EVM) RPC

Use standard JSON-RPC:

* `eth_sendRawTransaction`
* `eth_call`
* `eth_getTransactionReceipt`
* `eth_blockNumber`

Examples:

* Testnet: `https://data-seed-prebsc-1-s1.binance.org:8545/`
* Mainnet: `https://bsc-dataseed.binance.org/`

### ION API

Depending on available API providers:

* **IonCenter / ionapi / custom ION API**

    * `getAddressInfo(address)`
    * `getTransactions(address, limit, lt, hash, to_lt)`
    * `runGetMethod(address, method, stack)`

These are accessed via HTTPS (REST) or SDK wrappers like **IonWeb**.

---

## 1. Direction A: Wrapped ICE on BSC → ION

1. The bridge, which is moving Wrapped ICE from the BSC Chain will produce appropriate amount of ION to a given wallet each time,
when it detects that Wrapped ICE is burnt in the BSC blockchain.

Burning Wrapped ICE is done by the following method:
```solidity
    function burn(uint256 amount, TonAddress memory addr) external {
      require(allowBurn, "Burn is currently disabled");
      _burn(msg.sender, amount);
      emit SwapEthToTon(msg.sender, addr.workchain, addr.address_hash, amount);
    }
```

2. The ION tokens will be received by the address, which is defined by the following structure:
```solidity
    struct TonAddress {
        int8 workchain;
        bytes32 address_hash;
    }
```

3. Workchain for most transactions is 0.

4. Address hash is calculated the following way:

```javascript
const addressTon = new IonWeb.utils.Address(toAddress);
const wc = addressTon.wc;
const hashPart = IonWeb.utils.bytesToHex(addressTon.hashPart);
```

5. One of the production versions of the contract is available here: 
https://bscscan.com/address/0x1B31606fcb91BaE1DFFD646061f6dD6FB35D0Bb5#code

6. The ABI is available by the same link.

---

## 2. Direction B: ION -> Wrapped ICE on BSC

1. The bridge mints Wrapped ION tokens in the BSC network when it detects a particular transaction on the ION chain.

2. To build such a transaction, need to do the following transfer to the ION Bridge smart contract on the ION side.

```ts
const provider = window.ion;

const accounts = await provider.send("ion_requestAccounts");
const from = accounts[0];

const tx = await provider.send("ion_sendTransaction", {
    from,
    to: ION_BRIDGE_ADDRESS,
    value: toNano(amount),
    data: `swapTo#${evmAddress}`
});
```

3. When oracles detect this transaction - they start gathering signatures for this vote.

4. The ION bridge smart contract is deployed here: https://explorer.ice.io/address/Ef8PSnTugXPqSS9HgrEWdrU1yOoy2wH4qCaqsZhCaV2HSNz1

6. After oracles have collected enough signatures to do a mint - it is possible to call `voteForMinting` to finalize the mint.
`voteForMinting` can be called by anyone - either the user or any oracle.
Not it must be called by the user to save gas.

7. `voteForMinting` is described here:
   [./integration-vote-for-minting.md](integration-vote-for-minting.md).

---

## 3. Direction C: Old ICE on BSC → ION

(User sends tokens on BSC, receives on ION)

### 2.1 User Story

1. User has ERC-20 tokens on **BSC**.
2. User wants equivalent value on **ION**.
3. Mobile app:

    * Requests ION address + amount.
    * Sends a BSC tx to `IONBridgeRouter.burn(...)`.
    * Tracks progress:

        1. Tx submitted.
        2. Confirmations.
        3. Oracle voting & ION mint.
        4. Tokens received on ION.

### 2.2 Parameters

User inputs:

* `amount`
* `ionAddress`

Mobile derives:

* `workchain` (usually 0 or -1)
* `address_hash` (256-bit ION address hash)

### 2.3 Burning Tokens on BSC

**1. Connect wallet**

```ts
const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
const signer = provider.getSigner();
```

**2. Check allowance**

```ts
const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

const decimals = await token.decimals();
const amountWei = ethers.parseUnits(amount, decimals);

const allowance = await token.allowance(userAddress, ION_BRIDGE_ROUTER_ADDRESS);

if (allowance < amountWei) {
    const t = await token.approve(ION_BRIDGE_ROUTER_ADDRESS, amountWei);
    await t.wait(3);
}
```

**3. Call `burn`**

```ts
const bridge = new ethers.Contract(
    ION_BRIDGE_ROUTER_ADDRESS,
    ION_BRIDGE_ROUTER_ABI,
    signer
);

const { workchain, addressHash } = parseIonAddress(ionAddress);

const burnTx = await bridge.burn(
    amountWei,
    { workchain, address_hash: addressHash },
);
const receipt = await burnTx.wait(CONFIRMATIONS);
```

**4. Parse event**

```ts
const SWAP_EVENT = `
  event SwapEthToIon(address indexed from, int8 wc, bytes32 addrHash, uint256 amount)
`;

const iface = new ethers.Interface([SWAP_EVENT]);

const swapLog = receipt.logs
    .map(log => {
        try {
            return iface.parseLog(log)
        } catch {
            return null
        }
    })
    .find(x => x);
```

You store:

* `txHash`
* `logIndex`
* `blockNumber`
* `wc`
* `address_hash`
* `amount`

### 2.4 Oracle Minting (Infra)

Oracles:

1. Monitor BSC logs.
2. Compute `query_id` for ION.
3. Submit votes to ION Collector.
4. Once threshold reached, `IonBridge` mints tokens to the ION address.

### 2.5 Mobile → ION: Detect Mint Completion

#### Strategy 1 — Scan recipient address

```ts
const txs = await ionApi.getTransactions(ionAddress, { limit: 20 });
return txs.some(isBridgeMint);
```

#### Strategy 2 — Poll query state

```json
POST /runGetMethod
{
    "address": ION_COLLECTOR_ADDRESS,
    "method": "get_query_state",
    "stack": [
        [
            "num",
            "<query_id>"
        ]
    ]
}
```

---

## 4. Direction D: ION → Old ICE on BSC

(User sends tokens on ION, receives ERC-20 on BSC)

### 3.1 User Story

1. User has tokens on **ION**.
2. Wants equivalent ERC-20 on **BSC**.
3. Mobile app:

    * Requests EVM address + amount.
    * Sends ION transfer to `IonBridge`.
    * Polls BSC for mint confirmation.

### 3.2 ION → BSC Payload

Encoded payload contains:

* EVM address
* Amount

### 3.3 Sending a Bridge Transaction on ION

Using TonConnect-style provider:

```ts
const provider = window.ion;

const accounts = await provider.send("ion_requestAccounts");
const from = accounts[0];

const tx = await provider.send("ion_sendTransaction", {
    from,
    to: ION_BRIDGE_ADDRESS,
    value: toNano(amount),
    data: `swapTo#${evmAddress}`
});
```

### 3.4 Oracle Logic (Infra)

Oracles:

1. Monitor ION txs to `IonBridge`.
2. Decode EVM address + amount.
3. Produce signatures.
4. Submit to BSC router: `voteForMinting(...)`.
5. Router mints ERC-20 tokens to user.

`voteForMinting` is described here:
[./integration-vote-for-minting.md](integration-vote-for-minting.md).

### 3.5 Mobile → BSC: Detect Mint Completion

#### Poll balance:

```ts
const bal = await token.balanceOf(userEvmAddress);
return bal >= expectedWei;
```

#### Or filter logs:

```ts
const filter = {
    address: TOKEN_OR_BRIDGE,
    topics: [ethers.id("MintFromIon(address,uint256)")]
};
```

---

## 4. UI State Mapping

### BSC → ION steps

1. BSC burn tx submitted
2. BSC confirmations
3. Oracle confirmations
4. Mint detected on ION
5. Done

### ION → BSC steps

1. ION tx submitted
2. ION confirmations
3. Oracle confirmations
4. Mint detected on BSC
5. Done

---

## 5. Errors & Edge Cases

* **Wrong networks** – verify chainId and ION API base URL.
* **Insufficient balance/allowance** – check before sending.
* **Timeouts** — show “Bridge is slow” and persist state.
* **Duplicate sends** — track by `(direction, txHash)`.

---

## 6. Mobile Responsibilities Summary

### Must perform:

**BSC → ION**

1. Approve + burn on BSC
2. Parse burn event
3. Poll ION for mint

**ION → BSC**

1. Send ION bridge tx
2. Poll BSC for mint

### Does NOT perform:

* Oracle work
* Signature aggregation
* Query ID logic (optional; backend may compute it)
* Validator operations

