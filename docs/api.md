# API Usage in the Project

## Overview

This project utilizes several APIs to support its functionality, including blockchain interaction, localization, and data fetching. Below, you'll find a detailed description of the APIs in use, accompanied by code fragments illustrating how they are implemented within the project.

## ION Web API

The `tonweb` library is employed for interacting with the ION blockchain. It provides several methods for querying blockchain state and sending transactions.

### Example Usage

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

### File Reference

- `./utils/helpers.ts`
- `./@types/tonweb.d.ts`

## Axios for HTTP Requests

Axios is used to handle HTTP requests within the project. This provides a convenient and robust way to interact with external RESTful APIs.

## Ethereum Interaction

The Ethereum blockchain is interacted with through various smart contract and network configurations.

### Example Configuration

```typescript
export const PARAMS: IParams = {
    "tonTransferUrl": "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
    "networks": {
        "eth": {
            "main": {
                "getGasUrl": "https://ethereumgas.toncenter.com",
                "explorerUrl": "https://etherscan.io/token/<ADDRESS>",
                "wTonAddress": "0x582d872a1b094fc48f5de31d3b73f2d9be47def1",
                // ... other parameters
            },
            "test": {
                "getGasUrl": "https://ethereumgas.toncenter.com",
                // ... other parameters
            }
        }
        // ... other networks
    }
};
```

### Fetching Gas Price

```typescript
async function fetchEthGasPrice() {
    const response = await axios.get(PARAMS.networks.eth.main.getGasUrl);
    return response.data;
}
```

### File Reference

- `./utils/constants.ts`
- `./@types/params.d.ts`
