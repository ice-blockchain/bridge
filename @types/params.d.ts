interface IParamsNetwork {
    getGasUrl: string,
    explorerUrl: string,
    wTonAddress: string,
    tonBridgeAddress: string,
    tonCollectorAddress: string,
    tonMultisigAddress: string,
    tonCenterUrl: string,
    chainId: number,
    blocksConfirmations: number,
    defaultGwei: number,
    coinsPerGweiTo: number,
    coinsPerGweiFrom: number
    swapUri: string
}

interface IParams {
    tonTransferUrl: string,
    networks: {
        [key: string]: {
            main: IParamsNetwork,
            test: IParamsNetwork
        }
    }
}
