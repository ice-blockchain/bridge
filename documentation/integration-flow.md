# BSC ↔ ION (TON) Bridge – Mobile Client Integration Manual

This document describes how a **mobile application** should interact with the
BSC ↔ ION bridge **purely via RPC / API nodes**.

The code you see in the legacy Vue component is just a reference.  
Below is a cleaned, implementation-agnostic flow that other developers can follow.

---

## 0. Roles & Components

### Chains

- **BSC (EVM)** – where wrapped TON / ICE / ION ERC-20 tokens live.
- **ION / TON** – native chain on which ION contracts and the TON bridge contract live.

### Core contracts (conceptual)

On **BSC**:

- `IONBridgeRouter` – router contract that:
  - Accepts burns/locks of ERC-20 tokens to move value to TON (`burn(...)`).
  - Accepts oracle signatures to mint tokens when value comes from TON (`voteForMinting(...)`).
- `WTON` / `ICE` / `ION` – ERC-20 tokens on BSC.

On **TON/ION**:

- `TonBridge` – TON contract that:
  - Accepts inbound TON / ION transfers from users, with payload that encodes the EVM address.
  - Emits outbound messages that oracles use to mint on BSC.
- `Collector / Multisig` contracts – used by oracles to vote on external events (BSC tx, TON tx).

> **Important:** From the **mobile app** point of view, oracle logic is “backend infra”.
> Mobile only talks to contracts via RPC / API and polls state.

---

## 1. RPC / API Endpoints

### BSC (EVM) RPC

- HTTPS RPC endpoint (examples):
  - Testnet: `https://data-seed-prebsc-1-s1.binance.org:8545/`
  - Mainnet: `https://bsc-dataseed.binance.org/`
- Standard **JSON-RPC** methods:
  - `eth_sendRawTransaction`
  - `eth_call`
  - `eth_getTransactionReceipt`
  - `eth_blockNumber`
  - Optionally `eth_subscribe` (if using WebSocket)

For mobile, the easiest is to use:

- **ethers.js** via React Native / Capacitor / etc + WalletConnect; or
- **web3.js**; or
- Native mobile SDK that wraps JSON-RPC.

### TON / ION API

Depending on your stack:

- **TonCenter / tonapi / custom ION API**
  - `getAddressInfo(address)` – get account state (balance, last transaction, etc.).
  - `getTransactions(address, limit, lt, hash, to_lt, archival)` – load last transactions.
  - `runGetMethod(address, method, stack)` – call getter methods of contracts
    (`get_bridge_data`, `get_external_voting_data`, `get_query_state`, etc.).

You can talk to these directly via HTTPS (REST) or through a helper library
such as **IonWeb** on web / mobile.

---

## 2. Direction A: BSC → ION (User sends tokens on BSC, receives on TON)

### 2.1 High-Level User Story

1. User has ERC-20 tokens on **BSC** (e.g. ICE / WTON / ION).
2. User wants to receive equivalent value on **TON/ION** to a TON address.
3. Mobile app:
   - Asks for TON address and amount.
   - Sends a **BSC transaction** to `IONBridgeRouter.burn(...)` (or equivalent).
   - Shows progress:
     1. Tx submitted on BSC.
     2. BSC confirmations.
     3. Oracle voting & TON mint.
     4. Tokens received on TON.

### 2.2 Parameters & Data

- **User inputs**
  - `amount` – human amount, e.g. `123.45`.
  - `tonAddress` – destination TON/ION address.

- **Derived on client**
  - `workchain` – usually `0` or `-1` for TON.
  - `address_hash` – 256-bit hash part of TON address (without workchain).

### 2.3 Mobile → BSC: Burning / Locking Tokens

1. **Connect to EVM wallet**

   Example with ethers.js + WalletConnect:

   ```ts
   import { ethers } from "ethers";

   const provider = new ethers.JsonRpcProvider(BSC_RPC_URL); // or WalletConnect provider
   const signer = provider.getSigner(); // from wallet
    ```

2. **Check balance & allowance**

   ```ts
   const token = new ethers.Contract(
     TOKEN_ADDRESS,
     TOKEN_ABI,
     signer
   );

   const decimals = await token.decimals();
   const amountWei = ethers.parseUnits(userAmount.toString(), decimals);

   const allowance = await token.allowance(userAddress, ION_BRIDGE_ROUTER_ADDRESS);

   if (allowance < amountWei) {
     const approveTx = await token.approve(ION_BRIDGE_ROUTER_ADDRESS, amountWei);
     await approveTx.wait(CONFIRMATIONS_FOR_APPROVE);
   }
   ```

3. **Call bridge `burn` (or similar) on BSC**

   This is the EVM→TON direction.

   ```ts
   const bridge = new ethers.Contract(
     ION_BRIDGE_ROUTER_ADDRESS,
     ION_BRIDGE_ROUTER_ABI,
     signer
   );

   // Convert TON address to (workchain, address_hash) off-chain
   const { workchain, addressHash } = parseTonAddress(tonAddress);

   const burnTx = await bridge.burn(
     amountWei,
     { workchain, address_hash: addressHash },
   );
   updateUiStep("BSC_TX_SUBMITTED");

   const receipt = await burnTx.wait(MIN_BSC_CONFIRMATIONS);
   updateUiStep("BSC_TX_CONFIRMED");
   ```

4. **Extract bridge event from receipt**

   The bridge contract will emit something like `SwapEthToIon(...)`.

   ```ts
   const SWAP_EVENT = "event SwapEthToIon(address indexed from, int8 wc, bytes32 addrHash, uint256 amount)";

   const iface = new ethers.Interface([SWAP_EVENT]);
   const swapLog = receipt.logs
     .map((log) => {
       try { return iface.parseLog(log); } catch { return null; }
     })
     .find((v) => v !== null);

   if (!swapLog) throw new Error("Bridge swap event not found");
   ```

   You will store:

    * `transactionHash`
    * `logIndex`
    * `blockNumber`
    * `workchain`
    * `address_hash`
    * `amount`

   The backend / oracles will use these to compute a **query ID** on TON.

> **Mobile responsibility ends here for on-chain BSC.**
> Oracle logic is off-chain/infrastructure. Mobile just needs to **poll TON side** to know when mint is done.

---

### 2.4 TON Oracle & Minting (Infrastructure perspective)

*(For comprehension; mobile does not implement this)*

1. Oracles watch BSC node for `SwapEthToIon` logs.
2. They compute a `query_id` for TON bridge:

    * Often based on `(blockHash, transactionHash, logIndex)`.
3. Each oracle sends a vote into TON `Collector` / `Multisig` contract.
4. Once 2/3 of oracles voted, `TonBridge` mints tokens to the TON address.

---

### 2.5 Mobile → TON API: Detecting Completion

Your app must **poll TON API** to see if user received tokens.

Two common strategies:

#### Strategy 1 – Poll recipient address for inbound txs from bridge

1. On BSC tx confirmation, store:

    * `userTonAddress`
    * `expectedAmountAfterFee` (approx.)

2. Periodically:

   ```ts
   async function checkTonIncomingTransfer(tonAddress: string): Promise<boolean> {
     const txs = await tonApi.getTransactions(tonAddress, { limit: 20 });
     // Filter transactions:
     //  - from TonBridge contract address
     //  - value >= expectedAmountAfterFee
     //  - newer than bridge initiation time
     return txs.some(isMatchingBridgeMint);
   }
   ```

3. If match found: set step to “Completed”.

#### Strategy 2 – Poll bridge contract by query ID (if supported)

If you know how to compute `query_id` on client (or get it from your backend):

1. On TON, call:

   ```json
   POST /runGetMethod
   {
     "address": TON_COLLECTOR_ADDRESS,
     "method": "get_query_state",
     "stack": [["num", "<query_id>"]]
   }
   ```

2. Decode result:

    * If `state` says “completed” / sufficient bitmask of signatures, consider mint done.

---

## 3. Direction B: ION (TON) → BSC (User sends tokens on TON, receives on BSC)

### 3.1 High-Level User Story

1. User has TON / ION on **TON**.
2. User wants ERC-20 tokens on **BSC** to their EVM address.
3. Mobile app:

    * Takes EVM address & amount.
    * Asks user to sign & send TON transaction to bridge contract.
    * Polls BSC side for minted tokens.

### 3.2 Parameters & Data

* **User inputs**

    * `amount`
    * `evmAddress` (BSC address, `0x...`)

* **Off-chain encoding**

    * TON transaction payload encodes something like:
      `swapTo#<EVM_ADDRESS>` or structured cell with EVM address.

### 3.3 Mobile → TON: Sending Bridge Transaction

You integrate via **TON wallet SDK**:

* TonConnect
* OpenMask / ion provider
* Custom signer

Example (pseudo, browser-style provider):

```ts
// Example using "window.ion" or TonConnect
const provider = window.ion; // or TonConnect
const accounts = await provider.send("ton_requestAccounts");
const fromAccount = accounts[0];

const message = `swapTo#${evmAddress}`;

const tx = await provider.send("ton_sendTransaction", {
  from: fromAccount,
  to: TON_BRIDGE_ADDRESS,
  value: toNano(amount),   // 1 TON = 1e9 nano
  data: message
});

updateUiStep("TON_TX_SUBMITTED");
// Now poll TON API for inclusion if wallet does not give finality info.
```

Once transaction is confirmed on TON, oracles will see it and start minting on BSC.

---

### 3.4 Oracle Logic & Minting on BSC (Infra)

*(Again, informational)*

1. Oracles monitor TON node for inbound txs to `TonBridge` with payload `swapTo#EVM_ADDRESS`.

2. They derive `swapData`:

    * EVM recipient address
    * amount (minus bridge fee)
    * TON tx hash, logical time, etc.

3. Oracles sign `swapData` with ECDSA.

4. One or more oracles sends aggregated signatures to BSC contracts:

    * Either `WTON.voteForMinting(swapData, signatures)`
    * Or `IONBridgeRouter.voteForMinting(swapData, signatures)`

   via **BSC JSON-RPC**.

5. BSC contracts verify signatures and **mint ERC-20** to the given EVM address.

---

### 3.5 Mobile → BSC RPC: Detecting Mint Completion

Your mobile app needs to **poll BSC** for the ERC-20 balance or specific events.

#### Option 1 – Poll token balance

1. Remember:

    * `evmAddress`
    * `amountWei` (or slightly less due to fee)

2. Periodically:

   ```ts
   async function checkBscMinted(
     userEvmAddress: string,
     expectedAmountWei: bigint
   ): Promise<boolean> {
     const token = new ethers.Contract(
       TOKEN_ADDRESS,
       TOKEN_ABI,
       provider // read-only provider
     );

     const balance = await token.balanceOf(userEvmAddress);
     return balance >= expectedAmountWei; // or compare delta
   }
   ```

3. Once balance increased enough – mark swap completed.

#### Option 2 – Scan logs for `Mint` / `SwapTonToEth` / `MintedFromTon`

If you know exact event, you can filter by topic and user address:

```ts
const filter = {
  address: TOKEN_OR_BRIDGE_ADDRESS,
  topics: [
    ethers.id("MintFromTon(address,uint256)"),
    null, // indexed user
  ],
  fromBlock: startBlock,
  toBlock: "latest",
};

const logs = await provider.getLogs(filter);

const iface = new ethers.Interface([ "event MintFromTon(address indexed to, uint256 amount)" ]);

const hasEvent = logs.some((log) => {
  const parsed = iface.parseLog(log);
  return parsed.args.to.toLowerCase() === userEvmAddress.toLowerCase();
});
```

If you find event with sufficient `amount`, consider swap completed.

---

## 4. Mapping to UI Steps (for Mobile)

You can map RPC / API states to the 4 step notifications in your UI.

### 4.1 Direction BSC → ION

1. **Step 1 – Submit BSC transaction**

    * `burnTx` broadcasted.
    * UX: “Submitting transaction…”
2. **Step 2 – BSC confirmations**

    * Wait for `MIN_BSC_CONFIRMATIONS` blocks (e.g., 12).
    * UX: show `current / required` confirmations.
3. **Step 3 – Oracle confirmations**

    * Optional: if you expose oracle state from backend or TON `get_query_state`.
    * UX: “Waiting for oracle confirmations…”
4. **Step 4 – Coins sent (TON)**

    * TON transfer detected to user.
    * UX: “Coins sent to TON address”.
5. **Step 5 – Done**

    * Allow user to close screen or view transaction in explorers.

### 4.2 Direction ION → BSC

1. **Step 1 – Submit TON transaction**

    * Operation via wallet.
    * UX: “Send TON transaction from your wallet”.
2. **Step 2 – TON confirmation (optional)**

    * Poll TON API if needed.
3. **Step 3 – Oracle confirmations**

    * Same idea: from backend or BSC logs.
4. **Step 4 – Coins sent (BSC)**

    * Mint event / balance change found on BSC.
5. **Step 5 – Done**

---

## 5. Error Handling & Edge Cases

* **Wrong networks**

    * On EVM: compare `chainId` from JSON-RPC with expected BSC chainId.
    * On TON: check network (mainnet/testnet) via your API base URL.

* **Insufficient balance / allowance**

    * Always check `balanceOf` and `allowance` before sending bridge call.
    * Show precise error messages using localized strings.

* **Timeouts**

    * If no completion within X minutes:

        * Show “Bridge is taking longer than usual”.
        * Allow “Try again later” + persist state (swapId, queryId, txHash).

* **Duplicate sends**

    * Key swaps by `(direction, sourceTxHash)` in your backend.
    * When user reopens the app, re-load state and continue polling.

---

## 6. Minimal Responsibilities Summary

**Mobile app must:**

* For **BSC → ION**:

    1. Call `approve` + `burn` on BSC via JSON-RPC.
    2. Extract bridge event from receipt.
    3. Poll TON API until mint completed.

* For **ION → BSC**:

    1. Send TON tx to `TonBridge` via wallet SDK.
    2. Poll BSC JSON-RPC (balance or logs) until mint completed.

**Mobile app does NOT need to:**

* Run oracles / sign external events.
* Compute complex `query_id` logic (can be delegated to backend).
* Manage validator / bridge infra.

