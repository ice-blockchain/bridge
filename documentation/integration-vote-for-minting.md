# ION → BSC Bridge – `voteForMinting` Developer Manual

**Version:** 2025
**Audience:** Mobile Clients (iOS, Android, RN, Flutter, Web DApps)
**Scope:** Calling `voteForMinting` on the EVM side after a user sends assets from ION chain.

---

# Table of Contents

1. [Overview](#overview)
2. [Lifecycle Summary](#lifecycle-summary)
3. [Swap Event (`SwapTonToEth`)](#swap-event-swaptontoeth)
4. [Extracting `SwapData`](#extracting-swapdata)
5. [Calculating `swapId`](#calculating-swapid)
6. [Collecting Oracle Signatures](#collecting-oracle-signatures)
7. [Preparing Inputs for `voteForMinting`](#preparing-inputs-for-voteforminting)
8. [Calling `voteForMinting`](#calling-voteforminting)
9. [What Happens Inside the Contract](#what-happens-inside-the-contract)
10. [Example Integration Code](#example-integration-code)
11. [Error Handling](#error-handling)
12. [Security Requirements](#security-requirements)
13. [Testing Notes](#testing-notes)

---

# Overview

`voteForMinting` is the **final step of the ION → BSC asset bridge**.

A user:

1. Sends ION/ICE/TON on the ION chain
2. Oracles detect that ION transaction
3. Oracles sign the event
4. The client app receives ≥ 2/3 oracle signatures
5. The client calls:

```
voteForMinting(swapData, signatures[])
```

The EVM-side contract verifies signatures and **mints wrapped assets** (WION/WTON/ICE) on BSC.

---

# Lifecycle Summary

```
ION chain:   send swapTo#EVMAddress → TON Bridge SC
                        |
                        v
          Oracles detect event → produce signatures
                        |
                        v
Client receives ≥2/3 signatures
                        |
                        v
EVM: call voteForMinting(swapData, signatures[])
                        |
                        v
Contract mints wrapped tokens to user
```

---

# Swap Event (`SwapTonToEth`)

ION Bridge contract emits an outgoing message that corresponds to a swap.

This is parsed into:

```ts
interface SwapData {
    type: "SwapTonToEth";
    receiver: string;    // EVM address
    amount: string;      // nanoION (BN)
    tx: {
        address_: {
            workchain: number;
            address_hash: string;
        };
        tx_hash: string;
        lt: number;
    };
}
```

---

# Extracting `SwapData`

Mobile client monitors the ION Bridge address until it finds a valid outgoing message:

* Receiver address matches the user’s EVM address
* Embedded amount matches amount minus bridge fee
* In-msg prefix matches `"swapTo#"`

ION → SwapData:

* Parse base64 message
* Extract 20-byte receiver
* Extract 8-byte amount
* Extract TON sender address
* Extract TON transaction ID (tx_hash + lt)

---

# Calculating `swapId`

EVM contracts derive a unique ID for a swap using:

```
encoded = abi.encode( swapData fields )
swapId = keccak256(encoded)
```

In client code:

```ts
const encoded = web3.eth.abi.encodeParameters(
    [...fields...],
    [...values...]
);
const swapId = web3.utils.sha3(encoded);
```

The hash identifies the event and prevents replay.

---

# Collecting Oracle Signatures

Each oracle signs:

```
keccak256(swapId)
```

Client retrieves signatures using:

* `get_external_voting_data` (ION → EVM direction)
* `get_query_state` (EVM → ION direction for reverse flow)

A signature entry:

```ts
{
    signer: "0xPublicKey",
        r
:
    "0x...",
        s
:
    "0x...",
        v
:
    number
}
```

### Required threshold:

```
signatures.length >= oraclesTotal * 2 / 3
```

Only then can the client call `voteForMinting`.

---

# Preparing Inputs for `voteForMinting`

The client must:

1. **Sort signatures by signer address**
   Required for deterministic contract verification.

```ts
signatures.sort((a, b) =>
    BigInt(a.signer) - BigInt(b.signer)
);
```

2. **Approve WTON/WION contract (if required)**
   When minting via WTON, the client must first approve:

```
wton.approve(routerAddress, amount)
```

3. Ensure correct object format:

```ts
interface Signature {
    signer: string;          // oracle pubkey
    signature: string;       // hex-encoded 65 bytes
}
```

---

# Calling `voteForMinting`

Two variants depending on architecture:

### A. Modern ICE v2 / WTON route (direct mint contract)

```ts
await wtonContract.methods
    .voteForMinting(swapData, signatures)
    .send({ from: user });
```

### B. Legacy / router-based route

```ts
await ionBridgeRouter.methods
    .voteForMinting(swapData, signatures)
    .send({ from: user });
```

Both functions do the same:
**validate signatures → mint tokens → mark swapId as completed**.

---

# What Happens Inside the Contract

The contract:

### 1. Computes `swapId`

(from encoded `swapData`)

### 2. Checks replay protection

`require(!processed[swapId])`

### 3. Validates signatures

* Signature count ≥ 2/3
* Each signer belongs to oracle set
* ECDSA signature matches swapId

### 4. Mints wrapped tokens

`WION.mint(receiver, amount)`

### 5. Emits events

```
event Minted(bytes32 swapId, address receiver, uint256 amount);
```

---

# Example Integration Code

Below is a clean framework-agnostic example:

```ts
async function executeVoteForMinting(provider, swapData, oracleSignatures, userAddress) {
    const router = new provider.web3.eth.Contract(IONBridgeRouterABI, ROUTER_ADDRESS);

    // Step 1: Sort signatures
    const signatures = oracleSignatures.map(s => ({
        signer: s.publicKey,
        signature: ethers.utils.joinSignature({ r: s.r, s: s.s, v: s.v })
    })).sort((a, b) =>
        new BN(a.signer.substr(2), 16).cmp(new BN(b.signer.substr(2), 16))
    );

    // Step 2: Approve WTON or router
    const amountToMint = swapData.amount;
    await provider.wton.approve(router.options.address, amountToMint).send({ from: userAddress });

    // Step 3: Call voteForMinting
    return await router.methods.voteForMinting(
        swapData,
        signatures
    ).send({ from: userAddress });
}
```

---

# Error Handling

| Error                           | Meaning                       | Resolution             |
|---------------------------------|-------------------------------|------------------------|
| `Not enough signatures`         | < 2/3 oracles                 | Keep polling           |
| `Invalid signer`                | Oracle key mismatch           | Wrong network / config |
| `Swap already processed`        | Replay                        | Ignore                 |
| `Invalid signature`             | Modified swapData or mismatch | Regenerate swapId      |
| `ERC20: insufficient allowance` | No approval                   | Call approve() first   |
| `EVM: Reverted without reason`  | Malformed swapData            | Check encoding         |

---

# Security Requirements

1. **Never modify `swapData`**
   Hash mismatch breaks all signatures.

2. **Always check oracle count via `getFullOracleSet()`**

3. **Always sort signatures**
   Order affects signature verification.

4. **Never call voteForMinting automatically on behalf of the user**
   The wallet must sign an EVM transaction.

5. **Do not trust RPCs**
   Always verify signature count and signer set.

---

# Testing Notes

### Testnets

* Swap small amounts first
* Verify TON → BSC roundtrip
* Confirm event parsing is identical to production

### E2E tests

* Simulate oracle signatures
* Test signature order shuffling
* Test replay prevention
* Test wrong-signer rejection
* Test insufficient-signature rejection

