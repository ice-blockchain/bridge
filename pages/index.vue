<template>
    <MobileWrapper>
        <main class="Bridge">
            <div class="Bridge-testnetWarning" v-if="isTestnet">
                {{ $t('Bridge.testnet') }}
            </div>
            <div class="menu">
                <img
                    src="~assets/pics/ice-open-network-logo.svg"
                    alt="Ice Open Network"
                    class="logo"
                />

                <div class="tabs">
                    <button class="swap-tab" @click="openSwap()">
                        <img
                            src="~assets/pics/meme-markers.svg"
                            class="meme-icon-blue"
                            alt="Swap"
                        />
                        Swap
                    </button>

                    <button class="bridge-tab">
                        <img
                            src="~assets/pics/bridge-icon.svg"
                            class="bridge-icon-gray"
                            alt="Bridge"
                        />
                        Bridge
                    </button>
                </div>

                <div class="connect-wallet-container">
                    <button
                        class="connect-wallet-button"
                        @click="connectWallet()"
                        v-if="!isConnected"
                    >
                        <img
                            src="~assets/pics/plus-icon.svg"
                            alt="Connect wallet"
                        />
                        Connect wallet
                    </button>
                    <button
                        class="connect-wallet-button"
                        @click="showDisconnectMenu()"
                        v-if="isConnected"
                    >
                        <img
                            src="~assets/pics/wallet-icon-2.svg"
                            alt="Wallet"
                        />
                        {{ shortenAddress(accountAddress) }}
                        <img src="~assets/pics/drop-icon.svg" alt="Wallet" />
                    </button>
                    <button
                        class="disconnect-wallet-button"
                        @click="disconnectWallet()"
                        v-if="isDisconnectMenuVisible"
                    >
                        <img
                            src="~assets/pics/disconnect-icon.svg"
                            alt="Disconnect Wallet"
                            class="disconnect"
                        />
                        Disconnect
                    </button>
                </div>
            </div>
            <div class="Bridge-content">
                <div class="Bridge-form">
                    <h1>ION Bridge</h1>
                    <div
                        :class="{
                            'Bridge-inputWrapper': true,
                            'form-group': true,
                            'form-group-1': true,
                            'insufficient-balance': !hasEnoughICE,
                        }"
                    >
                        <div class="input-field" @click="onAmountInputClicked">
                            <img
                                src="~assets/pics/binance-icon.svg"
                                class="token"
                                alt="ICE"
                                :style="{
                                    display: !isFromTon ? 'inline' : 'none',
                                }"
                            />
                            <img
                                src="~assets/pics/ice-icon.svg"
                                class="token"
                                alt="ION"
                                :style="{
                                    display: isFromTon ? 'inline' : 'none',
                                }"
                            />
                            <img
                                src="~assets/pics/vertical-line-1.svg"
                                class="vertical-line-1"
                                alt=""
                            />
                            <div>
                                <span
                                    :class="{
                                        normal: true,
                                        initial: !isAmountInputVisible,
                                    }"
                                    >Enter ICE amount</span
                                >
                                <span class="alert"
                                    >Insufficient ICE balance</span
                                >
                                <thousands-number-input
                                    ref="amountInput"
                                    :initial-value="amountInner"
                                    :read-only="isInterfaceBlocked"
                                    :disabled="isInterfaceBlocked"
                                    @change="onAmountChange"
                                    :visible="isAmountInputVisible"
                                    class="amount-input"
                                />
                            </div>
                            <span
                                class="max"
                                v-if="!isFromTon"
                                @click="useMaximumTokenAmount()"
                                >MAX</span
                            >
                        </div>
                    </div>

                    <button
                        class="Bridge-switcher-arrow"
                        :disabled="isInterfaceBlocked"
                        @click="toggleFromTon"
                    ></button>

                    <div class="Bridge-inputWrapper form-group form-group-2">
                        <div class="input-field">
                            <img
                                src="~assets/pics/binance-icon.svg"
                                class="token"
                                alt="ICE"
                                :style="{
                                    display: isFromTon ? 'inline' : 'none',
                                }"
                            />
                            <img
                                src="~assets/pics/ice-icon.svg"
                                class="token"
                                alt="ION"
                                :style="{
                                    display: !isFromTon ? 'inline' : 'none',
                                }"
                            />
                            <img
                                src="~assets/pics/vertical-line-1.svg"
                                class="vertical-line-1"
                                alt=""
                            />
                            <div>
                                <span
                                    :class="{
                                        normal: true,
                                        initial: !shouldShowResultingAmount,
                                    }"
                                    >You receive ICE</span
                                >
                                <thousands-number-input
                                    :initial-value="amountInnerMinusFee"
                                    :read-only="isInterfaceBlocked"
                                    :disabled="isInterfaceBlocked"
                                    @change="onAmountChange"
                                    :visible="shouldShowResultingAmount"
                                    class="amount-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="Bridge-inputWrapper form-group form-group-3">
                        <div class="input-field" @click="onAddressInputClicked">
                            <img
                                src="~assets/pics/wallet-icon.svg"
                                class="token"
                                alt="ION"
                            />
                            <img
                                src="~assets/pics/vertical-line-1.svg"
                                class="vertical-line-1"
                                alt=""
                            />
                            <div>
                                <span
                                    :class="{
                                        normal: true,
                                        initial: !isAddressInputVisible,
                                    }"
                                    >{{
                                        isFromTon ? 'BSC' : 'ION Chain'
                                    }}
                                    Receiver Address</span
                                >
                                <input
                                    ref="addressInput"
                                    :disabled="isInterfaceBlocked"
                                    type="text"
                                    id="toInput"
                                    :class="{
                                        'thousands-number-input': true,
                                        visible: isAddressInputVisible,
                                    }"
                                    v-model="toAddress"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="Bridge-pairFee">
                        <span>BSC gas fee</span>
                        <span>{{ pairFee }} BNB</span>
                    </div>
                    <div class="Bridge-bridgeFee">
                        <span>Bridge fee</span>
                        <span>{{ bridgeFee }}</span>
                    </div>

                    <BridgeProcessor
                        ref="bridgeProcessor"
                        :key="pair"
                        :is-testnet="isTestnet"
                        :is-recover="isRecover"
                        :lt="lt"
                        :hash="hash"
                        :is-from-ton="isFromTon"
                        :pair="pair"
                        :amount="amount"
                        :has-enough-ice="this.hasEnoughICE"
                        :is-connected="this.isConnected"
                        :to-address="toAddress"
                        @interface-blocked="onInterfaceBlocked"
                        @state-changed="getPairGasFee__debounced"
                        @reset-state="resetState"
                        @save-state="saveState"
                        @delete-state="deleteState"
                    />

                    <div
                        class="Bridge-switchers"
                        :class="{ isFromTon }"
                        :key="isFromTon"
                        style="display: none"
                    >
                        <div class="Bridge-switcher">
                            <div
                                class="Bridge-switcherTitle"
                                :class="{ disabled: isInterfaceBlocked }"
                            >
                                <span>{{ tonNetworkName }}&nbsp;▾</span>
                                <ul class="Bridge-switcherList">
                                    <li
                                        v-for="item in fromPairs"
                                        :key="item"
                                        @click="onPairClick(true, item)"
                                    >
                                        <button>
                                            {{
                                                $t(
                                                    `Bridge.networks.${item}.${netTypeName}.name`
                                                )
                                            }}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div class="Bridge-switcherAnno">
                                {{ tonNetworkCoin }}
                            </div>
                        </div>

                        <button
                            class="Bridge-switcher-arrow"
                            :disabled="isInterfaceBlocked"
                            @click="toggleFromTon"
                        ></button>

                        <div class="Bridge-switcher">
                            <div
                                class="Bridge-switcherTitle"
                                :class="{ disabled: isInterfaceBlocked }"
                            >
                                <span>{{ pairNetworkName }}&nbsp;▾</span>
                                <ul class="Bridge-switcherList">
                                    <li
                                        v-for="item in toPairs"
                                        :key="item"
                                        @click="
                                            onPairClick(
                                                item === 'ton',
                                                item === 'ton' ? pair : item
                                            )
                                        "
                                    >
                                        <button>
                                            {{
                                                $t(
                                                    `Bridge.networks.${item}.${netTypeName}.name`
                                                )
                                            }}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div class="Bridge-switcherAnno">
                                <a :href="pairNetworkCoinUrl" target="_blank">{{
                                    pairNetworkCoin
                                }}</a>
                            </div>
                        </div>
                    </div>
                </div>

                <a
                    href="https://ice.io/bridge-tutorial"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <div class="description-form">
                        <img
                            src="~assets/pics/description-icon.svg"
                            alt="Help"
                        />
                        <div>
                            <h2>How does it work?</h2>
                            <span
                                >Follow our simple guide on how to bridge ICE
                                from Binance Smart Chain to ION Chain.</span
                            >
                        </div>
                    </div>
                </a>
            </div>
        </main>
    </MobileWrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import lodashDebounce from 'lodash.debounce'
import { fromUnit, supportsLocalStorage } from '~/utils/helpers'
import { PARAMS } from '~/utils/constants'
import BridgeProcessor from '~/components/BridgeProcessor.vue'
import Web3 from 'web3'
import IonWeb from 'ionweb'
import WTON from '~/assets/WTON.json'
import { AbiItem } from 'web3-utils'
import ThousandsNumberInput from './ThousandsNumberInput.vue'
import MobileWrapper from '~/pages/MobileWrapper.vue'

const BN = IonWeb.utils.BN

const PAIRS = [/*'eth',*/ 'bsc']

declare global {
    interface Window {
        ethereum?: any
        ion?: any
    }
}

declare interface IComponentData {
    getPairGasFee__debounced: () => void
    gasPrice: number

    isTestnet: boolean
    isRecover: boolean
    lt: number
    hash: string

    isFromTon: boolean
    pair: string
    amountInner: string
    toAddress: string

    isInterfaceBlocked: boolean
    isAmountInputVisible: boolean
    isAddressInputVisible: boolean
    isResultingAmountInputVisible: boolean
    isConnected: boolean
    isDisconnectMenuVisible: boolean
    hasEnoughICE: boolean

    accountAddress: string

    provider: any
}

export default Vue.extend({
    components: {
        MobileWrapper,
        BridgeProcessor,
        ThousandsNumberInput,
    },

    head(): object {
        return {
            title: this.$t(`Bridge.networks.${this.pair}.pageTitle`) as string,
        }
    },

    data(): IComponentData {
        return {
            provider: undefined,

            getPairGasFee__debounced: () => {},
            gasPrice: 0,

            isTestnet: false,
            isRecover: false,
            lt: 0,
            hash: '',

            isFromTon: false,
            pair: 'bsc', // Initially: 'eth'
            amountInner: '',
            toAddress: '',

            isInterfaceBlocked: false,
            isAmountInputVisible: false,
            isAddressInputVisible: false,
            isResultingAmountInputVisible: false,
            isConnected: false,
            isDisconnectMenuVisible: false,
            hasEnoughICE: true,

            accountAddress: '',
        }
    },

    computed: {
        shouldShowResultingAmount() {
            const value = this.amountInner as String
            return value.trim() !== '' && Number(value.replace(/,/g, '')) > 0
        },
        amountInnerMinusFee(): string {
            // Remove commas before converting to number
            const cleanAmount = this.amountInner.toString().replace(/,/g, '')
            return `${Number(cleanAmount) - this.bridgeFeeNumeric}`
        },
        netTypeName(): string {
            return this.isTestnet ? 'test' : 'main'
        },
        params(): IParamsNetwork {
            const pairParams = PARAMS.networks[this.pair]
            return pairParams[this.netTypeName as keyof typeof pairParams]
        },
        tonNetworkName(): string {
            return this.$t(
                `Bridge.networks.ton.${this.netTypeName}.name`
            ) as string
        },
        tonNetworkCoin(): string {
            return this.$t(
                `Bridge.networks.ton.${this.netTypeName}.coin`
            ) as string
        },
        pairNetworkName(): string {
            return this.$t(
                `Bridge.networks.${this.pair}.${this.netTypeName}.name`
            ) as string
        },
        pairNetworkCoin(): string {
            return this.$t(
                `Bridge.networks.${this.pair}.${this.netTypeName}.coin`
            ) as string
        },
        pairNetworkCoinUrl(): string {
            const url = this.params.explorerUrl as string
            const address = this.params.wTonAddress as string
            return url.replace('<ADDRESS>', address) as string
        },
        addressInputLabel(): string {
            const pair = this.isFromTon ? this.pair : 'ton'
            const networkFillName = this.$t(
                `Bridge.networks.${pair}.${this.netTypeName}.full`
            ) as string
            const label = this.$t(`Bridge.addressInputLabel`) as string
            return label.replace('<NETWORK>', networkFillName) as string
        },
        pairFee(): string {
            const n = this.gasPrice
                ? this.gasPrice / this.params.defaultGwei
                : 1
            const fee = this.isFromTon
                ? this.params.coinsPerGweiTo * n
                : this.params.coinsPerGweiFrom * n

            // v.1.0
            // return (this.$t(`Bridge.networks.${this.pair}.gasFee`) as string).replace('<FEE>', fee.toFixed(4));

            // v.2.0
            return fee.toFixed(4)
        },
        amount: {
            get(): number {
                const amount = parseFloat(this.amountInner.replace(/,/g, ''))
                return !amount || isNaN(amount) ? 0 : amount
            },

            set(value: number): void {
                this.amountInner = isNaN(value) ? '' : String(value)
            },
        },
        bridgeFee(): string {
            if (!isNaN(this.amount) && this.amount >= 10) {
                return String(this.bridgeFeeNumeric) + ' ICE'
            } else {
                return '0.5 ICE + 0.25% of amount'
            }
        },
        bridgeFeeNumeric(): number {
            if (!isNaN(this.amount) && this.amount >= 10) {
                return 0.5 + ((this.amount - 0.5) * 0.25) / 100
            }
            return 0
        },
        fromPairs(): string[] {
            return PAIRS
        },
        toPairs(): string[] {
            return ['ton', ...PAIRS.filter((i) => i !== this.pair)]
        },
    },

    watch: {
        isFromTon() {
            this.getPairGasFee__debounced()
        },
        pair() {
            this.getPairGasFee__debounced()
        },
    },

    created(): void {
        this.getPairGasFee__debounced = lodashDebounce(this.getPairGasFee, 100)

        if (this.$route.query.testnet) {
            this.isTestnet =
                (this.$route.query.testnet as string).toLowerCase() === 'true'
        }
        if (this.$route.query.recover || this.$route.query.recovery) {
            this.isRecover = true
        }
        if (this.$route.query.lt) {
            const lt = parseInt(`${this.$route.query.lt}`, 10)
            this.lt = !lt || isNaN(lt) ? 0 : lt
        }
        if (this.$route.query.hash) {
            this.hash = this.$route.query.hash as string
        }
        if (this.$route.query.amount) {
            const amount = parseFloat(`${this.$route.query.amount}`) / 1e9 //TODO refactor
            this.amount = !amount || isNaN(amount) ? 0 : amount
        }
        if (this.$route.query.toAddress) {
            this.toAddress = this.$route.query.toAddress as string
        }
        if (this.$route.query.fromNetwork && this.$route.query.toNetwork) {
            const fromNetwork = this.$route.query.fromNetwork.toLowerCase()
            const toNetwork = this.$route.query.toNetwork.toLowerCase()

            if (fromNetwork === 'ton' && PAIRS.includes(toNetwork)) {
                this.isFromTon = true
                this.pair = toNetwork
            }

            if (toNetwork === 'ton' && PAIRS.includes(fromNetwork)) {
                this.isFromTon = false
                this.pair = fromNetwork
            }
        }
    },

    mounted(): void {
        this.getPairGasFee__debounced()
        this.loadState()
    },

    methods: {
        async calculateHasEnoughICE(value: string) {
            // Do not trigger, when the value is not set
            if (!value) {
                return true
            }

            if (!this.accountAddress) {
                return false
            }

            if (this.isFromTon) {
                // Handle TON network balance check
                if (!this.provider?.ionweb) {
                    return false
                }

                // Get balance info from IonWeb for TON network
                const info: any =
                    await this.provider.ionweb.provider.getAddressInfo(
                        this.accountAddress
                    )
                // Convert balance from nanoTON to TON
                const balance: number = parseFloat(info.balance) / 1e9

                // Remove commas from the entered value and convert to number
                const amount = parseFloat(value.replace(/,/g, '') || '0')

                return amount <= balance
            } else {
                // Handle BSC network balance check
                if (!this.provider?.wtonContract) {
                    return false
                }

                try {
                    // Get balance from the WTON contract
                    const balance = await this.provider.wtonContract.methods
                        .balanceOf(this.accountAddress)
                        .call()
                    const decimals = await this.provider.wtonContract.methods
                        .decimals()
                        .call()

                    // Convert the entered value to Wei (assuming 18 decimals)
                    const cleanedValue = value.replace(/,/g, '') || '0'
                    const balanceInEther: number =
                        Number(balance) / Math.pow(10, decimals)

                    return Number(cleanedValue) <= balanceInEther
                } catch (error) {
                    // On any error, consider that we do not have enough balance
                    return false
                }
            }
        },
        // Reset general connection state
        async disconnectWallet() {
            this.provider = undefined
            this.isConnected = false
            this.accountAddress = ''
            this.isDisconnectMenuVisible = false
        },
        showDisconnectMenu() {
            this.isDisconnectMenuVisible = !this.isDisconnectMenuVisible
        },
        // Helper function to shorten the displayed address
        shortenAddress(address: string) {
            if (!address) {
                return ''
            }

            return `${address.slice(0, 5)}...${address.slice(-5)}`
        },
        onAmountInputClicked() {
            this.isAmountInputVisible = true
            this.$nextTick(() => {
                if (this.$refs.amountInput) {
                    this.$refs.amountInput.focus()
                }
            })
        },
        onAddressInputClicked() {
            this.isAddressInputVisible = true
            this.$nextTick(() => {
                if (this.$refs.addressInput) {
                    this.$refs.addressInput.focus()
                }
            })
        },
        onAmountChange(formattedValue: string) {
            this.amountInner = formattedValue.replace(',', '')
            this.calculateHasEnoughICE(this.amountInner).then(
                (enough: boolean) => {
                    console.log('Has enough ICE', enough)
                    this.hasEnoughICE = enough
                }
            )
        },
        openSwap() {
            document.location.href = this.params.swapUri
        },
        async connectWallet() {
            if (this.isFromTon) {
                // Check if IONMask is installed
                if (typeof window.ion === 'undefined') {
                    // TODO: Use alerts having the desired UI design
                    alert('Please, install the `IONMask` browser extension')
                    return
                }

                try {
                    // Request ION accounts
                    const accounts = await window.ion.send(
                        'ton_requestAccounts'
                    )

                    if (accounts && accounts.length > 0) {
                        this.isConnected = true

                        // You might want to store the connected account
                        const account = accounts[0]
                        console.log(
                            'Connected to IONMask with account:',
                            account
                        )

                        this.accountAddress = account

                        // Initialize IonWeb if needed
                        const ionweb = new IonWeb(
                            new IonWeb.HttpProvider(this.params.tonCenterUrl)
                        )
                        this.provider = {
                            ...this.provider,
                            ionweb,
                            tonAccount: account,
                        } as any
                    }
                } catch (error) {
                    console.error('Failed to connect to IONMask:', error)
                    alert('Failed to connect to IONMask. Please try again.')
                }
            } else {
                // Check if MetaMask is installed
                if (typeof window.ethereum === 'undefined') {
                    alert('Please install MetaMask to connect your wallet')
                    return
                }

                try {
                    // Request Ethereum accounts
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts',
                    })

                    if (accounts && accounts.length > 0) {
                        this.isConnected = true
                        const account = accounts[0]
                        console.log(
                            'Connected to MetaMask with account:',
                            account
                        )

                        this.accountAddress = account

                        // Initialize Web3 and contracts
                        const web3 = new Web3(window.ethereum)
                        const wtonContract = new web3.eth.Contract(
                            WTON as AbiItem[],
                            this.params.wTonAddress
                        )

                        // Update provider with necessary instances
                        this.provider = {
                            ...this.provider,
                            web3,
                            wtonContract,
                            myEthAddress: account,
                        } as any
                    }
                } catch (error) {
                    console.error('Failed to connect to MetaMask:', error)
                    alert('Failed to connect to MetaMask. Please try again.')
                }
            }

            // Trigger amount validation after successful connection
            if (this.amountInner) {
                this.calculateHasEnoughICE(this.amountInner).then(
                    (enough: boolean) => {
                        this.hasEnoughICE = enough
                    }
                )
            }
        },
        onPairClick(switchDirection: boolean, toPair: string): void {
            if (this.isInterfaceBlocked) {
                return
            }

            if (switchDirection) {
                this.isFromTon = !this.isFromTon
            }
            this.pair = toPair
        },
        resetState(): void {
            this.isRecover = false
            this.lt = 0
            this.hash = ''
            this.amountInner = ''
            this.toAddress = ''
        },
        loadState(): void {
            if (!supportsLocalStorage) {
                return
            }

            const raw = localStorage.getItem('bridgeState')

            if (raw) {
                let state: any
                try {
                    state = JSON.parse(raw)
                } catch (e) {
                    return
                }

                // for previous version
                if (!state.pair) {
                    return
                }

                this.amount = state.amount
                this.toAddress = state.toAddress
                this.pair = state.pair

                this.$nextTick(() => {
                    this.$refs.bridgeProcessor.loadState(state.processingState)
                })
            }
        },
        saveState(processingState: any): void {
            if (!supportsLocalStorage) {
                return
            }

            const state = {
                amount: this.amount,
                toAddress: this.toAddress,
                pair: this.pair,
                processingState: processingState,
            }

            localStorage.setItem('bridgeState', JSON.stringify(state))
        },
        deleteState(): void {
            if (!supportsLocalStorage) {
                return
            }

            localStorage.removeItem('bridgeState')
        },
        onInterfaceBlocked(isBlocked: boolean): void {
            this.isInterfaceBlocked = isBlocked
        },
        toggleFromTon(): void {
            if (this.isInterfaceBlocked) {
                return
            }
            this.isFromTon = !this.isFromTon
        },
        async getPairGasFee(): Promise<void> {
            /*
            let data;
            let gasPrice = 0;

            try {
                const response = await fetch(this.params.getGasUrl, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-store, max-age=0'
                    }
                });

                if (!response.ok) {
                    throw new Error(`An error has occured: ${response.status}`);
                }

                data = await response.json();
            } catch (e) {
                this.gasPrice = 0;
                return;
            }

            if (this.pair === 'eth') {
                gasPrice = parseFloat(data.average) / 10;
            }

            if (this.pair === 'bsc') {
                gasPrice = parseFloat(data.result.SafeGasPrice);
            }

            this.gasPrice = gasPrice > 0 ? gasPrice : this.params.defaultGwei;
             */
        },
        useMaximumTokenAmount: async function () {
            const self = this

            const initProvider = async function () {
                // Check if MetaMask (Ethereum provider) is available
                const ethereum = (window as any).ethereum
                if (!ethereum) {
                    console.error('Metamask not installed')
                    return null
                }

                // Request accounts from MetaMask
                let myEthAddress: string
                try {
                    const accounts = await ethereum.request({
                        method: 'eth_requestAccounts',
                    })
                    myEthAddress = accounts[0]
                } catch (error) {
                    console.error(
                        'Failed to get accounts from MetaMask:',
                        error
                    )
                    return null
                }

                // Initialize Web3
                const web3 = new Web3(ethereum)

                // Initialize WTON Contract
                const wtonContract = new web3.eth.Contract(
                    WTON as AbiItem[],
                    self.params.wTonAddress
                )

                // Initialize IonWeb for TON network
                const ionweb = new IonWeb(
                    new IonWeb.HttpProvider(self.params.tonCenterUrl)
                )

                // Build and return the provider object
                return {
                    oraclesTotal: 0, // Not strictly needed for max amount retrieval
                    blockNumber: 0,
                    myEthAddress,
                    wtonContract,
                    web3,
                    ionweb,
                    feeFlat: new BN(0), // Not strictly needed for max amount retrieval
                    feeFactor: new BN(0), // Not strictly needed for max amount retrieval
                    feeBase: new BN(0), // Not strictly needed for max amount retrieval
                }
            }

            // Ensure provider is initialized
            if (!this.provider) {
                this.provider = await initProvider()
                if (!this.provider) {
                    console.error(
                        'Provider not initialized, cannot fetch balances.'
                    )
                    return
                }
            }

            if (this.isFromTon) {
                // Fetch the TON account from TonMask
                if (typeof window.ion === 'undefined') {
                    alert(this.$t('Bridge.errors.installTonMask') as string)
                    return
                }

                let account: string
                try {
                    const accounts = await window.ion.send(
                        'ton_requestAccounts'
                    )
                    account = accounts[0]
                    console.log(`Using ION/Ton account ${account}`)
                } catch (e) {
                    console.error('Failed to get TonMask account:', e)
                    return
                }

                // Get balance info from IonWeb
                const info = await this.provider.ionweb.provider.getAddressInfo(
                    account
                )
                // info.balance is in nanoTON, convert it to ION
                const tonBalance = parseFloat(info.balance) / 1e9
                console.log(`Current TON balance: ${tonBalance} ION`)

                // Set the input amount to the fetched balance
                this.amount = tonBalance
            } else {
                // Fetch ICE balance via MetaMask (wtonContract)
                const rawBalance = await this.provider.wtonContract.methods
                    .balanceOf(this.provider.myEthAddress)
                    .call()
                // rawBalance is a string in the smallest unit. Use fromUnit() to convert:
                const iceBalance = parseFloat('' + fromUnit(Number(rawBalance)))
                console.log(`Current ICE balance: ${iceBalance} WTON`)

                // Set the input amount to the fetched balance
                this.amount = iceBalance
            }
        },
    },
})
</script>

<style lang="less" scoped>
.Bridge {
}

@r: .Bridge;

@{r} {
    &-testnetWarning {
        position: absolute;
        left: 0;
        top: 0;
        color: white;
        width: 100%;
        padding: 0 0;
        text-align: center;
        background: red;
        font-weight: bold;
    }

    &-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 100px 40px 10px;

        @media (max-width: 800px) {
            padding: 48px 16px 10px;
        }
    }

    &-img {
        background-image: url('~assets/pics/swap.svg');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        max-width: 450px;
        width: 100%;
        height: 450px;
        transition: transform 0.15s ease-out;
        transform: scale(-1, 1);

        @media (max-width: 800px) {
            height: 300px;
        }

        &.isFromTon {
            transform: none;
        }
    }

    &-form {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 500px;
        width: 100%;
    }

    &-switchers {
        width: 100%;
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
        margin-bottom: 40px;

        &.isFromTon {
            flex-direction: row;
        }
    }

    &-switcher {
        position: relative;
        flex: 1 0;

        &Title {
            position: relative;
            font-size: 36px;
            font-weight: bold;
            cursor: pointer;
            white-space: nowrap;

            @media (max-width: 800px) {
                font-size: 22px;
            }

            &.disabled {
                cursor: default;
                pointer-events: none;
            }

            span {
                white-space: normal;
            }

            em {
                display: inline-block;
                vertical-align: 5px;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 10px 5px 0 5px;
                border-color: #000 transparent transparent transparent;
            }
        }

        // .isPointer &Title:hover &List,
        // .isTouch &Title:active &List {
        &Title:hover &List {
            transition: opacity 0.15s ease-in-out;
            opacity: 1;
            visibility: inherit;
        }

        &Anno {
            margin-top: 4px;
            height: 20px;

            a {
                display: inline-block;
                color: #000;
                border-bottom: 1px dotted #aaa;

                .isPointer &:hover,
                .isTouch &:active {
                    border-bottom: 1px dotted transparent;
                }

                &:after {
                    content: '';
                    display: inline-block;
                    height: 16px;
                    width: 16px;
                    background-image: url('~assets/pics/link.svg');
                    background-repeat: no-repeat;
                    background-size: contain;
                    background-position: 0 3px;

                    @media (max-width: 800px) {
                        display: none;
                    }
                }
            }

            @media (max-width: 800px) {
                font-size: 12px;
            }
        }

        &List {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgb(48 55 87 / 12%);
            box-sizing: border-box;
            color: #303757;
            font-size: 16px;
            left: -16px;
            line-height: 20px;
            list-style-type: none;
            margin: 0;
            padding: 12px 24px;
            position: absolute;
            right: -16px;
            top: 100%;
            word-break: break-word;
            white-space: normal;

            transition: all;
            opacity: 0;
            visibility: hidden;

            &:before {
                content: '';
                position: absolute;
                top: -20px;
                width: 100%;
                left: 0;
                height: 20px;
            }

            li {
                button {
                    padding: 10px 0;
                    color: #303757;
                    font-weight: 700;
                    cursor: pointer;

                    .isPointer &:hover,
                    .isTouch &:active {
                        color: #1d98dc;
                    }
                }
            }
        }
    }

    &-switcher-arrow {
        cursor: pointer;
        box-sizing: border-box;

        /* Auto layout */
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 16px;
        gap: 10px;

        position: absolute;
        width: 40px;
        height: 40px;
        left: calc(50% - 40px / 2 + 80px);
        top: 147px;

        background: #ffffff url('~assets/pics/arrow-icon.svg') center center
            no-repeat;
        border: 1px solid #cccccc;
        border-radius: 14px;

        z-index: 1;

        &[disabled] {
            cursor: default;
        }
    }

    &-pairFee {
        /* Auto layout */
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0;
        gap: 4px;

        position: absolute;
        width: 350px;
        height: 18px;
        left: 55px;
        top: 335px;
    }

    &-bridgeFee {
        /* Auto layout */
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0;
        gap: 4px;

        position: absolute;
        width: 350px;
        height: 18px;
        left: 55px;
        top: 365px;
    }

    &-bridgeFee span:nth-child(2),
    &-pairFee span:nth-child(2) {
        /* 0.00 BNB */
        height: 18px;

        /* Mainnet/Body (600) */
        font-family: 'Noto Sans', serif;
        font-style: normal;
        font-weight: 600;
        font-size: 13px;
        line-height: 18px;
        /* identical to box height, or 138% */
        display: flex;
        align-items: center;

        color: #000000;
    }

    &-footer {
        margin-top: 100px;
        text-align: center;
        font-size: 12px;
        color: #666666;

        a {
            color: #666666;
            text-decoration: underline;

            .isPointer &:hover,
            .isTouch &:active {
                text-decoration: none;
            }
        }
    }
}

.menu {
    box-sizing: border-box;

    position: relative;
    width: 1392px;
    height: 80px;
    left: calc(50% - 1392px / 2);
    top: 24px;

    background: #ffffff;
    box-shadow: 0 0 21px rgba(0, 0, 0, 0.1);
    border-radius: 20px;
}

.menu img {
    width: 188px;
    height: 40px;
    left: 16px;
}

.menu img.logo {
    position: absolute;
    width: 188px;
    height: 40px;
    left: 16px;
    top: calc(50% - 40px / 2);
}

.menu .tabs {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0;
    gap: 12px;

    position: absolute;
    width: 268px;
    height: 48px;
    left: calc(50% - 268px / 2);
    top: calc(50% - 48px / 2);
}

.menu .bridge-tab {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0 24px;
    gap: 6px;

    width: 133px;
    height: 48px;

    background: #f5f7ff;
    border-radius: 16px;
    border-width: 0;

    /* Inside auto layout */
    flex: none;
    order: 1;
    flex-grow: 0;

    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 17px;
    line-height: 23px;
    color: #0166ff;
}

.menu .bridge-tab img {
    width: 23px;
    height: 24px;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;
}

.menu .swap-tab {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0 24px;
    gap: 6px;

    width: 123px;
    height: 48px;

    background: white;
    border-radius: 16px;
    border-width: 0;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;

    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 17px;
    line-height: 23px;
    text-align: center;

    color: #9a9a9a;

    cursor: pointer;
}

.menu .swap-tab img {
    /* Frame */
    width: 24px;
    height: 24px;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;
}

/**
    `Connect Wallet` button.
 */
.menu .connect-wallet-button {
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;

    color: white;
    cursor: pointer;

    box-sizing: border-box;

    /* Auto layout */
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 12px 16px;
    gap: 8px;

    width: 189px;
    height: 48px;

    background: #0166ff;
    border: 1px solid #0166ff;
    border-radius: 16px;
}

.menu .connect-wallet-button:hover {
    background-color: #357abd; /* Darker blue on hover */
}

h1 {
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 700;
    font-size: 24px;
    line-height: 31px;
    align-items: center;
    color: #0e0e0e;

    position: relative;
    width: 204px;
    height: 31px;
    top: 40px;
    margin: 0;
}

/* Description form styling */
.description-form {
    box-sizing: border-box;

    /* Auto layout */
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 12px 20px;
    gap: 16px;

    position: absolute;
    width: 460px;
    height: 89px;
    left: calc(50% - 460px / 2);
    top: 762px;

    background: #ffffff;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.05);
    border-radius: 20px;
}

/* How does it work? */
.description-form h2 {
    margin: 0;

    /* Mainnet/Title (600) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 17px;
    line-height: 23px;
    display: flex;
    align-items: center;

    color: #0e0e0e;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;
}

/* If you have any questions, then check out our detailed guide on how it works */
.description-form span {
    /* Mainnet/Body 2 (400) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 18px;
    display: flex;
    align-items: center;
    text-align: left;

    color: #727689;

    /* Inside auto layout */
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
}

/* Container for the Connect Wallet button */
.connect-wallet-container {
    position: absolute;
    top: 20px;
    right: 20px;
}

/* Styling for the Connect Wallet button */
.connect-wallet-button {
    padding: 8px 16px;
    font-size: 13px;
    background-color: #4a90e2; /* Cool blue */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.connect-wallet-button img {
    width: 24px;
    height: 24px;
}

.disconnect-wallet-button {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 16px;
    gap: 8px;

    position: absolute;
    width: 189px;
    height: 48px;
    top: 53px;

    background: #ffffff;
    box-shadow: -2px -2px 16px rgba(29, 70, 235, 0.1);
    border-radius: 16px;
    border-width: 0;

    /* Mainnet/Subtitle (600) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;

    color: #fd4e4e;

    /* Inside auto layout */
    flex: none;
    order: 1;
    flex-grow: 0;

    cursor: pointer;
}

.disconnect-wallet-button img {
    width: 24px;
    height: 24px;
}

/* Swap form styling */
.Bridge-form {
    position: absolute;
    background-color: #fff;
    padding: 0;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(44, 62, 80, 0.1);
    width: 460px;
    height: 501px;
    top: 234px;
}

.form-group {
    width: 350px;
    height: 58px;
    left: calc(50% - 350px / 2);
}

.form-group-1 {
    position: absolute;
    top: 101px;
}

.form-group-1 input {
    width: 200px;
}

.form-group-1.insufficient-balance .input-field {
    border-color: #ff4d4f;
}

.form-group-1.insufficient-balance .max {
    color: #ff4d4f;
}

.form-group-1.insufficient-balance .normal {
    display: none;
}

.form-group-1 .alert {
    display: none;
}

.form-group-1.insufficient-balance .alert {
    display: block;
    color: #ff4d4f;
    text-align: left;
}

.form-group-2 {
    position: absolute;
    top: 175px;
}

.form-group-3 {
    position: absolute;
    top: 257px;
}

.form-group-3 input {
    width: 260px;
}

.form-group label {
    display: block;
    font-size: 14px;
    color: #34495e; /* Darker blue-gray */
    margin-bottom: 8px;
}

.input-field {
    display: flex;
    align-items: center;
    background-color: white;
    border-style: solid;
    border-color: #cccccc;
    border-width: 1px;
    border-radius: 12px;
    padding: 0;
    width: 350px;
    height: 58px;
}

.input-field .max {
    width: 47px;
    height: 18px;
    margin-left: auto;
    /**
     For some reason, in this site, this gives the opposite result, unlike in the Swap site.
     */
    /*
    padding-left: 17px;
     */

    /* Mainnet/Body (600) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 13px;
    line-height: 18px;
    /* identical to box height, or 138% */
    display: flex;
    align-items: center;

    color: #9a9a9a;
    cursor: pointer;
}

.input-field input {
    border: none;
    background: transparent;
    flex: 1;
    outline: none;
    padding: 0;

    /* Mainnet/Body (600) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 13px;
    line-height: 18px;

    /* identical to box height, or 138% */
    display: flex;
    align-items: center;

    color: #0e0e0e;

    /* Inside auto layout */
    flex: none;
    order: 1;
    flex-grow: 0;
}

.input-field .token {
    font-size: 16px;
    font-weight: bold;
    margin-left: 16px;
    color: #2c3e50;
}

.input-field .vertical-line-1 {
    margin-left: 16px;
    margin-right: 16px;
}

.input-field input::placeholder {
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 13px;
    line-height: 18px;
    color: #9a9a9a;
}

.input-field span {
    /* Terms */
    height: 16px;

    /* Mainnet/Caption (500) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    display: flex;
    align-items: center;

    color: #9a9a9a;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;
}

.input-field .normal.initial {
    font-weight: 600;
    font-size: 13px;
    line-height: 18px;
}

/* Styling for the Swap button */
.swap-button {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 12px 0;
    gap: 8px;
    background-color: #b8bcca;
    border-radius: 16px;
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;
    color: #ffffff;
    border-width: 0;

    position: absolute;
    width: 350px;
    height: 58px;
    left: calc(50% - 350px / 2);
    top: 287px;
    bottom: 51px;
}

/* Hover effect for the Swap button */
.swap-button:hover {
    background-color: #357abd; /* Darker blue on hover */
}

/* Disabled state styling for the Swap button */
.swap-button:disabled {
    background-color: #cccccc; /* Noticeably gray */
    color: #666666; /* Dark gray text */
    cursor: not-allowed;
}

/**
 Styles for icons.
 */
.meme-icon-white {
    stroke: white;
}

.meme-icon-blue {
    stroke: #0166ff;
}

.thousands-number-input {
    display: none !important;
}

.thousands-number-input.visible {
    display: inline !important;
}
</style>
