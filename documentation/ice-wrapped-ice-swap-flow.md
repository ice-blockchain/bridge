## ICE v1 ↔ Wrapped ICE (wICE) Swap via `IONSwap`

This section describes how the mobile client should interact with the on-chain
`IONSwap` contract that migrates **old ICE** (e.g. ICE v1, 18 decimals) to
**wrapped / new ION** (ION, 9 decimals) and back.

From the user’s perspective, the **numeric token amount stays the same**  
(e.g. “1000 ICE” → “1000 wICE”), while the contract internally adjusts
for different decimals.

---

### Contract Overview

`IONSwap` is a simple, fixed-rate swap contract:

- `pooledToken` – the **target** token users receive (e.g. **ION**).
- `otherToken` – the **source** token users provide (e.g. **ICE v1**).
- `swapTokens(uint256 amount)` – swap **otherToken → pooledToken**.
- `swapTokensBack(uint256 amount)` – swap **pooledToken → otherToken**.
- `getPooledAmountOut(uint256 amount)` – view helper; quote output for forward swap.
- `getOtherAmountOut(uint256 amount)` – view helper; quote output for reverse swap.
- `withdrawLiquidity(...)` – **owner-only**, used by the ION multisig to rebalance
  liquidity (mobile app never calls this).

> **Important:**  
> The contract **only works with ERC-20 tokens**, **doesn’t accept ETH** and  
> always preserves the user-facing token count (e.g. 1000 → 1000) while changing
> the decimals under the hood.

---

### Token Mapping Example

A typical deployment:

- `otherToken` → **ICE v1**, `decimals = 18`
- `pooledToken` → **ION**, `decimals = 9`

Human-readable behavior:

- 1000 ICE v1 → 1000 ION

On-chain behavior adjusts for decimals:

- Forward: `1000 * 10^18` units → `1000 * 10^9` units

---

### 1. Forward Swap: ICE v1 → ION

**Goal:** User has legacy **ICE v1** and wants to receive **ION**.

#### 1.1 UX Flow

1. User selects **“Swap ICE v1 → ION”**.
2. User enters an amount in **whole tokens** (e.g. `1000`).
3. Client:
   - Reads token metadata if needed.
   - Checks & sets allowance.
   - Sends `swapTokens(...)` transaction to `IONSwap`.
   - Waits for confirmation and parses `OnSwap` event.
4. UI shows updated ICE v1 / ION balances.

#### 1.2 Allowance + Swap (Ethers.js Example)

```ts
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
const signer = provider.getSigner(USER_ADDRESS);

const iceV1 = new ethers.Contract(ICE_V1_ADDRESS, ERC20_ABI, signer);
const ionSwap = new ethers.Contract(IONSWAP_ADDRESS, IONSWAP_ABI, signer);

// 1. Prepare amount (userAmount is a string, e.g. "1000")
const iceV1Decimals = await iceV1.decimals();
const amountIn = ethers.parseUnits(userAmount, iceV1Decimals); // otherToken units

// 2. Ensure allowance for IONSwap
const currentAllowance = await iceV1.allowance(USER_ADDRESS, IONSWAP_ADDRESS);

if (currentAllowance < amountIn) {
  const approveTx = await iceV1.approve(IONSWAP_ADDRESS, amountIn);
  await approveTx.wait(1); // wait for 1–3 confirmations
}

// 3. (Optional) preview output
const quotedOut = await ionSwap.getPooledAmountOut(amountIn);

// 4. Call forward swap
const swapTx = await ionSwap.swapTokens(amountIn);
const receipt = await swapTx.wait(1);
````

#### 1.3 Parsing the `OnSwap` Event

The contract emits:

```solidity
event OnSwap(
    address indexed sender,
    uint256 amountOtherTokenIn,
    uint256 amountPooledTokenOut
);
```

Client can parse this from the receipt:

```ts
const iface = new ethers.Interface(IONSWAP_ABI);
let swapEvent;

for (const log of receipt.logs) {
  try {
    const parsed = iface.parseLog(log);
    if (parsed.name === "OnSwap") {
      swapEvent = parsed;
      break;
    }
  } catch {
    // ignore unrelated logs
  }
}

if (swapEvent) {
  const amountOtherTokenIn = swapEvent.args.amountOtherTokenIn;
  const amountPooledTokenOut = swapEvent.args.amountPooledTokenOut;

  // Convert back to human-readable strings for UI:
  // amountInHuman = formatUnits(amountOtherTokenIn, iceV1Decimals);
  // amountOutHuman = formatUnits(amountPooledTokenOut, iceV2Decimals);
}
```

Use this data to update the UI and show a clear confirmation:

> “You swapped **1000 ICE v1** for **1000 ION**.”

---



### 3. Read-Only Helpers & Safety Checks

Before sending a transaction, the client **should**:

1. **Preview output**:

    * For ICE v1 → ICE v2:

      ```ts
      const quoted = await ionSwap.getPooledAmountOut(amountIn);
      ```
    * For ICE v2 → ICE v1:

      ```ts
      const quoted = await ionSwap.getOtherAmountOut(amountInV2);
      ```

2. **Validate non-zero amount**:

    * Contract reverts on `_amount == 0` (`SwapAmountZero()`).

3. **Avoid “insufficient liquidity” UX surprises**:

    * (Optional) Read balances before sending:

      ```ts
      const pooledBalance = await iceV2.balanceOf(IONSWAP_ADDRESS);
      const otherBalance  = await iceV1.balanceOf(IONSWAP_ADDRESS);
      ```
    * Compare with `quoted` to warn the user early.

> **Note:** If the contract doesn’t have enough liquidity, it reverts with
> `InsufficientPooledTokenBalance()` or `InsufficientOtherTokenBalance()`.

---

### 3. Liquidity Management (For Reference Only)

The function:

```solidity
function withdrawLiquidity(
    IERC20 _token,
    address _receiver,
    uint256 _amount
) external onlyOwner;
```

is used **only by the ION multisig / owner** to move excess liquidity in or out
of the contract. The mobile app:

* **Must not expose this as a normal user action**.
* Can optionally show a **read-only** view of the contract’s reserves for
  transparency (using standard `balanceOf` calls).

