export const PARAMS: IParams = {
    "tonTransferUrl": "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
    "networks": {
        "bsc": {
            "main": {
                "getGasUrl": "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
                "explorerUrl": "https://bscscan.com/token/<ADDRESS>",
                "wTonAddress": "0x1B31606fcb91BaE1DFFD646061f6dD6FB35D0Bb5",
                "tonBridgeAddress": "Ef8PSnTugXPqSS9HgrEWdrU1yOoy2wH4qCaqsZhCaV2HSNz1",
                "tonCollectorAddress": "EQDlW12QNTNlGp-t4mGd8mvv3XrRWGRj73oWdBcQlJP_zpoB",
                "tonMultisigAddress": "kf876m_BZ0VacBr51rlq51XStwkAYpqEiwAkkW50XWR__s6E",
                "tonCenterUrl": "https://api.mainnet.ice.io/http/v2/jsonRPC",
                "chainId": 56,
                "blocksConfirmations": 12,
                "defaultGwei": 1,
                "coinsPerGweiTo": 0.0008,
                "coinsPerGweiFrom": 0.0002,
                "swapUri": "https://swap.ice.io",
                "ionBridgeRouterAddress": "0xd62148F4c8269DA6BF7E3C2d3A0E0363C924590E",
                "ice1TokenAddress": "0xc335Df7C25b72eEC661d5Aa32a7c2B7b2a1D1874"
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
                "ionBridgeRouterAddress": "0x83ba759f5a64A0fd22DEa3359ec05DFB69f7a8F3",
                "ice1TokenAddress": "0x2A0864a15a63AC237a46405CCd6aD7Fa0513050D"
            }
        }
    }
};
