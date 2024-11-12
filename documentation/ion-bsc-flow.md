# ION-to-BSC bridging flow
This document describes the flow, which happens, while bridging ION to the BSC network.

## The `saveState` method
The `saveState` method is quite simple - it's just emitting a Vue event with the current state:

```typescript
saveState(): void {
    this.$emit('save-state', this.state);
}
```

The state object being saved contains:
```typescript
state: {
    swapId: string,
    queryId: string, 
    fromCurrencySent: boolean,
    toCurrencySent: boolean,
    step: number,
    votes: IVoteEth[] | number[] | null,
    swapData: ISwapData | null,
    createTime: number,
    blockNumber: number
}
```

Regarding when it triggers a TON transaction:

The `saveState` method itself doesn't trigger any TON transactions directly. However, it gets called at a specific point in the bridge flow:

1. It's called in the `onTransferClick` method, but ONLY when `isFromTon` is true:

```typescript
if (this.isFromTon) {
    this.saveState();
} else {
    await this.burn();
}
```

So it saves the state when:
1. The user is transferring FROM TON (not to TON)
2. The initial transfer button is clicked
3. Basic validation has passed (valid amount, valid address)
4. The provider has been initialized successfully
5. The state.step has been set to 1

The reason for saving state in this case is that when transferring from TON, the user needs to manually initiate a TON transaction (unlike ETH/BSC where the contract handles it). The saved state allows the interface to track the progress of the bridge operation while waiting for and after the user's TON transaction.

The actual TON transaction happens outside of this method - the user needs to click a link that opens their TON wallet to send the transaction. The `saveState` just helps maintain the UI state during this process.

## The `saveState` event handler

Looking at the code, the `saveState` method in the parent Bridge component works as follows:

```typescript
saveState(processingState: any): void {
    // First check if localStorage is supported in the browser
    if (!supportsLocalStorage) {
        return;
    }

    // Create a state object combining:
    // 1. Current amount being transferred
    // 2. Destination address
    // 3. Selected blockchain pair (e.g. 'bsc')
    // 4. Processing state passed from the BridgeProcessor component
    const state = {
        amount: this.amount,
        toAddress: this.toAddress,
        pair: this.pair,
        processingState: processingState
    }

    // Save the state object to localStorage as a JSON string
    localStorage.setItem('bridgeState', JSON.stringify(state));
}
```

This method does not trigger TON transactions directly. Instead, it's used to persist the bridge operation state in the browser's localStorage, allowing users to:

1. Resume incomplete bridge operations if they close/refresh the browser
2. Track the progress of ongoing bridge operations
3. Maintain state during the multi-step bridge process

The state saving is triggered through the BridgeProcessor component when:
1. The user initiates a transfer from TON to another chain (ETH/BSC)
2. Right after basic validations pass (amount > 10, valid addresses)
3. Before the user needs to make a manual TON transaction

The TON transaction itself is not triggered by `saveState` - instead, it happens when:

1. The user clicks the transfer button
2. The user follows the provided TON wallet link
3. The user manually approves and sends the transaction from their TON wallet

The saved state is used to track this process and ensure the UI can pick up where it left off if the user needs to refresh or return to the bridge interface later.

## Using this state

The saved state is used by `getSwap` to monitor for the TON transaction. Here's the flow:

```typescript
// 1. Parent Bridge component saves state with amount/address
saveState(processingState: any): void {
    localStorage.setItem('bridgeState', JSON.stringify(state));
}

// 2. BridgeProcessor periodically checks for transaction in updateState
async updateState(): Promise<void> {
    if (this.state.step === 1 && this.isFromTon) {
        // Try to find the user's TON transaction
        const swap = await this.getSwap(this.amount, this.toAddress, this.state.createTime);
        if (swap) {
            // Transaction found! Update state and move to step 3
            this.state.swapId = this.getSwapTonToEthId(this.provider!.web3, swap);
            this.state.swapData = swap;
            this.state.step = 3;
        }
    }
    // ...
}

// 3. getSwap looks for the TON transaction
async getSwap(myAmount: number, myToAddress: string, myCreateTime: number): Promise<null | ISwapData> {
    // Get recent transactions to the bridge contract
    const transactions = await this.provider!.ionweb.provider.getTransactions(
        this.params.tonBridgeAddress,
        this.lt && this.hash ? 1 : (this.isRecover ? 200 : 40),
        this.lt || undefined,
        this.hash || undefined,
        undefined,
        this.lt && this.hash ? true : undefined
    );

    // Look through transactions for the bridge transfer
    for (const t of transactions) {
        // Find outbound message
        const logMsg = findLogOutMsg(t.out_msgs);
        if (logMsg) {
            // Skip old transactions unless recovering
            if (!this.isRecover && !(this.lt && this.hash)) {
                if (t.utime * 1000 < myCreateTime) continue;
            }

            // Extract transfer details from message
            const bytes = getMessageBytes(logMsg);
            if (bytes === null) continue;

            const destinationAddress = this.makeAddress('0x' + IonWeb.utils.bytesToHex(bytes.slice(0, 20)));
            const amount = new BN(IonWeb.utils.bytesToHex(bytes.slice(20, 28)), 16);
            
            // Verify amount and address match what user intended
            const myAmountNano = new BN(myAmount * 1e9);
            const amountAfterFee = myAmountNano.sub(this.getFeeAmount(myAmountNano));

            if (amount.eq(amountAfterFee) && 
                destinationAddress.toLowerCase() === myToAddress.toLowerCase()) {
                // Found the matching transaction!
                return {
                    type: 'SwapTonToEth',
                    receiver: destinationAddress,
                    amount: amount.toString(),
                    tx: {/*...*/}
                };
            }
        }
    }
    return null;
}
```

So the saved state enables:

1. The bridge to monitor for when the user completes their TON transaction
2. Matching the found transaction against the intended transfer (amount/address)
3. Moving forward with the bridge process once the TON transaction is found
4. Recovery of incomplete transfers if the browser is closed/refreshed

Once `getSwap` finds a matching transaction, the bridge can proceed with collecting oracle signatures and completing the transfer on the destination chain.

The key point is that `getSwap` doesn't trigger the TON transaction - it monitors for when the user completes the transaction themselves via their wallet, using the saved state to verify it's the correct transaction.

## Generating the URI to transfer ION
Looking at the code, the transaction URI is generated in the `BridgeProcessor` component's computed property `getStepInfoText1`. When `isFromTon` is true and `state.step` is 1, it generates the URI as follows:

```typescript
getStepInfoText1(): object {
    if (this.state.step === 1) {
        if (this.isFromTon) {
            const url = PARAMS.tonTransferUrl
                .replace('<BRIDGE_ADDRESS>', this.params.tonBridgeAddress)
                .replace('<AMOUNT>', String(toUnit(this.amount)))
                .replace('<TO_ADDRESS>', this.toAddress);

            const sendAmount = (this.$t(`Bridge.networks.ton.transactionSendAmount`) as string)
                .replace('<AMOUNT>', String(this.amount))
                .replace('<FROM_COIN>', this.fromCoin);

            return {
                isOnlyText: false,
                sendAmount,
                url,              // This is the transaction URI
                sendFromPersonal: this.$t(`Bridge.networks.ton.transactionSendFromPersonal`) as string,
                sendNotFromExchanges: this.$t(`Bridge.networks.ton.transactionSendNotFromExchanges`) as string
            }
        } else {
            // ... code for non-TON case ...
        }
    } else {
        // ... code for other steps ...
    }
}
```

The URL is constructed using:
- `PARAMS.tonTransferUrl`: Base URL template
- `params.tonBridgeAddress`: The bridge contract address
- `toUnit(this.amount)`: The amount converted to nano units
- `toAddress`: The destination address

The URL template is defined in `PARAMS.tonTransferUrl` which should be in the constants file. You would need to check the `PARAMS` constant to see the exact URL format being used.

This URL is then displayed to the user in the interface (as seen in the HTML template where `getStepInfoText1.url` is rendered as a link), allowing them to initiate the TON transaction through their wallet.

