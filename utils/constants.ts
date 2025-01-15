export const PARAMS: IParams = {
    "tonTransferUrl": "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
    "networks": {
        "bsc": {
            "main": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0xc632928ab4fc995e04b4d66da62c28ce56e2bd73",
                "tonBridgeAddress": "Ef_NdjdsgD5S7hQijVXBrGGI6mqp9dZnToJCD8CzkFOwAvWL",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "kf-sw1ve4zYbX7-48loRWut-HNyVq65NbkRueXFETpcUvLDT",
                "tonCenterUrl": "https://api.testnet.ice.io/http/v2/jsonRPC",
                "chainId": 56,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002,
                "swapUri": "https://swap.staging.ice.io",
                "ionBridgeRouterAddress": "0xD83827590808a3130Cf097AF59F12b6A979898b9",
                "ice1TokenAddress": "0x2A0864a15a63AC237a46405CCd6aD7Fa0513050D"
            },
            "test": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://testnet.bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0xc632928ab4fc995e04b4d66da62c28ce56e2bd73",
                "tonBridgeAddress": "Ef_NdjdsgD5S7hQijVXBrGGI6mqp9dZnToJCD8CzkFOwAvWL",
                "tonCollectorAddress": "EQB91-zbCZDGGtVngKdyXB7Cnbm_DKVXJQsHyzDn3cZSFEuI",
                "tonMultisigAddress": "kf-sw1ve4zYbX7-48loRWut-HNyVq65NbkRueXFETpcUvLDT",
                "tonCenterUrl": "https://api.testnet.ice.io/http/v2/jsonRPC",
                "chainId": 97,
                "blocksConfirmations": 12,
                "defaultGwei": 5,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002,
                "swapUri": "https://swap.staging.ice.io",
                "ionBridgeRouterAddress": "0xD83827590808a3130Cf097AF59F12b6A979898b9",
                "ice1TokenAddress": "0x2A0864a15a63AC237a46405CCd6aD7Fa0513050D"
            }
        }
    }
};
