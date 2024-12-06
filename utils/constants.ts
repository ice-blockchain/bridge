export const PARAMS: IParams = {
    "tonTransferUrl": "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
    "networks": {
        "bsc": {
            "main": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0x6BFc16f717Da0868f7Cf8Fb7AdFAa1402710182c",
                "tonBridgeAddress": "Ef_IkSbsYpMv8ZO6XFMsfIoqTn9OSRA-BU5-rKxIh_xfY0fz",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "kf-ARFxMJ5AecAQFJoXf6HOZm1IMAlFGyF3rEkl6GXrr_7QD",
                "tonCenterUrl": "https://api.testnet.ice.io/http/v2/jsonRPC",
                "chainId": 56,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002
            },
            "test": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://testnet.bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0x6BFc16f717Da0868f7Cf8Fb7AdFAa1402710182c",
                "tonBridgeAddress": "Ef_IkSbsYpMv8ZO6XFMsfIoqTn9OSRA-BU5-rKxIh_xfY0fz",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "kf-ARFxMJ5AecAQFJoXf6HOZm1IMAlFGyF3rEkl6GXrr_7QD",
                "tonCenterUrl": "https://api.testnet.ice.io/http/v2/jsonRPC",
                "chainId": 97,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002
            }
        }
    }
};
