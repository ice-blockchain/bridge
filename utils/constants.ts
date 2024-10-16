export const PARAMS: IParams = {
    "tonTransferUrl": "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
    "networks": {
        "bsc": {
            "main": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0x1B615Fb55d329b19C2d3f56943a1D972EFc717a3", // ION test one deployment
                "tonBridgeAddress": "Ef_ADy7BfTbw-0Feq8pYyDSZuNBRAgtO14KV2Ieyp73Q74Nd",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "kf8Va5IJcEa7jtDtRnIFflAp6oQvFNmmTLClRwHwaJbvDp3y",
                "tonCenterUrl": "https://http-api.testnet.ice.io/jsonRPC",
                "chainId": 56,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002
            },
            "test": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://testnet.bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0x1B615Fb55d329b19C2d3f56943a1D972EFc717a3", // ION test one deployment
                "tonBridgeAddress": "Ef_ADy7BfTbw-0Feq8pYyDSZuNBRAgtO14KV2Ieyp73Q74Nd",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "kf8Va5IJcEa7jtDtRnIFflAp6oQvFNmmTLClRwHwaJbvDp3y",
                "tonCenterUrl": "https://http-api.testnet.ice.io/jsonRPC",
                "chainId": 97,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002
            }
        }
    }
};
