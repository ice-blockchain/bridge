# Bridge Calls in the Project

## Overview

This section of the documentation describes how bridge calls are implemented in the project. The bridge mechanism allows for interoperability between different blockchain networks, facilitating the transfer of assets such as cryptocurrencies.

## Key Components

### TON and Ethereum Interaction

The project primarily interacts with the TON and Ethereum blockchains. The interaction is facilitated through smart contracts and several API calls to handle various processes, including sending transactions, fetching gas prices, and monitoring transaction statuses.

### Main Libraries and Tools

- **TonWeb**: This library is used for interacting with the TON blockchain.
- **ethers.js**: A complete and compact library to interact with Ethereum's blockchain, utilized for making Ethereum transactions.
- **axios**: Used for handling HTTP requests.

## Configuration

Bridge configurations are defined in the `PARAMS` object within the project. This includes details about network URLs, addresses of the bridge smart contracts, and gas prices.

### Example Configuration in `constants.ts`

```typescript
export const PARAMS: IParams = {
    "tonTransferUrl": "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
    "networks": {
        "eth": {
            "main": {
                "getGasUrl": "https://ethereumgas.toncenter.com",
                "explorerUrl": "https://etherscan.io/token/<ADDRESS>",
                "wTonAddress": "0x582d872a1b094fc48f5de31d3b73f2d9be47def1",
                "tonBridgeAddress": "Ef_dJMSh8riPi3BTUTtcxsWjG8RLKnLctNjAM4rw8NN-xWdr",
                "tonCollectorAddress": "EQCuzvIOXLjH2tv35gY4tzhIvXCqZWDuK9kUhFGXKLImgxT5",
                "tonMultisigAddress": "kf87m7_QrVM4uXAPCDM4DuF9Rj5Rwa5nHubwiQG96JmyAo-S",
                "tonCenterUrl": "https://wallet.toncenter.com/api/v2/jsonRPC",
                "chainId": 1,
                "blocksConfirmations": 12,
                "defaultGwei": 25,
                "coinsPerGweiTo": 0.004,
                "coinsPerGweiFrom": 0.001
            },
            "test": {
                "getGasUrl": "https://ethereumgas.toncenter.com",
                "explorerUrl": "https://goerli.etherscan.io/token/<ADDRESS>",
                "wTonAddress": "0xDB15ffaf2c88F2d89Db9365a5160D5b8c9448Ea6",
                "tonBridgeAddress": "Ef-56ZiqKUbtp_Ax2Qg4Vwh7yXXJCO8cNJAb229J6XXe4-aC",
                "tonCollectorAddress": "EQCA1W_I267-luVo9CzV7iCcrA1OO5vVeXD0QHACvBn1jIVU",
                "tonMultisigAddress": "kf-OV1dpgFVEzEmyvAETT8gnhqZ1IqHn8RzT6dmEmvnze-9n",
                "tonCenterUrl": "https://testnet.toncenter.com/api/v2/jsonRPC",
                "chainId": 5,
                "blocksConfirmations": 12,
                "defaultGwei": 25,
                "coinsPerGweiTo": 0.004,
                "coinsPerGweiFrom": 0.001
            }
        },
        // More networks...
    }
};
```

## Implementing Bridge Calls

### Interacting with TON Blockchain

To interact with the TON blockchain, you will utilize the `TonWeb` library, which provides comprehensive methods for sending transactions and querying blockchain data.

### Example: Fetching Balance

```typescript
import TonWeb from 'tonweb';

// Initialize HTTP provider
const provider = new TonWeb.HttpProvider('https://wallet.toncenter.com/api/v2/jsonRPC');

// Create TonWeb instance with provider
const tonWeb = new TonWeb(provider);

// Fetch balance of a given address
async function getBalance(address: string) {
    const balance = await tonWeb.provider.getBalance(address);
    return balance;
}
```

### Interacting with Ethereum Blockchain

Interactions with the Ethereum blockchain are handled via the `ethers.js` library. This library provides a way to send transactions and interact with Ethereum smart contracts.

### Example: Fetching Gas Price

```typescript
import axios from 'axios';
import { PARAMS } from './constants';

async function fetchEthGasPrice() {
    const response = await axios.get(PARAMS.networks.eth.main.getGasUrl);
    return response.data;
}
```

### Example: Fetching WTON Token Balance

```typescript
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const wTonContractAddress = PARAMS.networks.eth.main.wTonAddress;
const wTonAbi = [/* ABI array for WTON contract */];

async function getWtonBalance(address: string) {
    const contract = new ethers.Contract(wTonContractAddress, wTonAbi, provider);
    const balance = await contract.balanceOf(address);
    return balance;
}
```

## Comprehensive Example

Below is a comprehensive example that demonstrates the interaction between TON and Ethereum blockchains using the bridge mechanisms outlined above.

### Example: Token Swap from Ethereum to TON

1. **Prepare TON Transaction URL**

    ```typescript
    function prepareTonTransferUrl(toAddress: string, amount: number, text: string): string {
        const baseUrl = PARAMS.tonTransferUrl;
        return baseUrl.replace('<BRIDGE_ADDRESS>', PARAMS.networks.eth.main.tonBridgeAddress)
                      .replace('<AMOUNT>', amount.toString())
                      .replace('<TO_ADDRESS>', toAddress)
                      .concat(`&text=${text}`);
    }
    ```

2. **Send Ethereum Transaction**

    ```typescript
    async function sendEthTransaction(amount: number, toAddress: string) {
        // Initialize Ethereum provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Set up transaction parameters
        const tx = {
            to: toAddress,
            value: ethers.utils.parseEther(amount.toString()),
            gasPrice: ethers.utils.parseUnits(PARAMS.networks.eth.main.defaultGwei.toString(), 'gwei')
        };

        // Send transaction
        const response = await signer.sendTransaction(tx);
        return response;
    }
    ```

3. **Initiate Bridge Transfer**

    ```typescript
    async function initiateBridgeTransfer(amount: number, ethAddress: string, tonAddress: string) {
        // Step 1: Send ETH Transaction
        const ethTxResponse = await sendEthTransaction(amount, PARAMS.networks.eth.main.tonCollectorAddress);
        
        // Step 2: Prepare TON Transfer URL
        const tonTransferUrl = prepareTonTransferUrl(tonAddress, amount, `swapTo#${ethAddress}`);
        
        // Output TON Transfer URL
        console.log('TON Transfer URL:', tonTransferUrl);
    }
    ```

