export const PARAMS: IParams = {
    "tonTransferUrl": "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
    "networks": {
        "bsc": {
            "main": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0x6BFc16f717Da0868f7Cf8Fb7AdFAa1402710182c", // "0x1B615Fb55d329b19C2d3f56943a1D972EFc717a3", // ION test one deployment
                "tonBridgeAddress": "Ef_ADy7BfTbw-0Feq8pYyDSZuNBRAgtO14KV2Ieyp73Q74Nd",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "Ef9mEAB-6__sWw41PbsYvbqEcWKY0evP3joL8YUSTDI_GSQA",
                "tonCenterUrl": "https://23.29.127.148:83/jsonRPC",
                "chainId": 56,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002
            },
            "test": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://testnet.bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0x6BFc16f717Da0868f7Cf8Fb7AdFAa1402710182c", // "0x1B615Fb55d329b19C2d3f56943a1D972EFc717a3", // ION test one deployment
                "tonBridgeAddress": "Ef_ADy7BfTbw-0Feq8pYyDSZuNBRAgtO14KV2Ieyp73Q74Nd",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "Ef9mEAB-6__sWw41PbsYvbqEcWKY0evP3joL8YUSTDI_GSQA",
                "tonCenterUrl": "https://23.29.127.148:83/jsonRPC",
                "chainId": 97,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002
            }
        }
    }
};
