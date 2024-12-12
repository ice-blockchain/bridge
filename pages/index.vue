<template>
    <main class="Bridge">
        <div class="Bridge-testnetWarning" v-if="isTestnet">{{$t('Bridge.testnet')}}</div>
        <div class="menu">

            <img src="~assets/pics/ice-open-network-logo.svg" alt="Ice Open Network" class="logo"/>

            <div class="tabs">
                <button class="swap-tab" @click="openSwap()">
                    <img src="~assets/pics/meme-markers.svg" class="meme-icon-blue" alt="Swap" />
                    Swap
                </button>

                <button class="bridge-tab">
                    <img src="~assets/pics/bridge-icon.svg" class="bridge-icon-gray" alt="Bridge" />
                    Bridge
                </button>
            </div>

            <div class="connect-wallet-container">
                <button class="connect-wallet-button" @click="connectWallet()">
                    <img src="~assets/pics/plus-icon.svg" alt="Connect wallet"/>
                    Connect wallet
                </button>
            </div>
        </div>
        <div class="Bridge-content">
            <div class="Bridge-form">
                <div class="Bridge-switchers" :class="{isFromTon}" :key="isFromTon">
                    <div class="Bridge-switcher">
                        <div class="Bridge-switcherTitle" :class="{disabled: isInterfaceBlocked}">
                            <span>{{tonNetworkName}}&nbsp;▾</span>
                            <ul class="Bridge-switcherList">
                                <li
                                    v-for="item in fromPairs"
                                    :key="item"
                                    @click="onPairClick(true, item)"><button>{{$t(`Bridge.networks.${item}.${netTypeName}.name`)}}</button></li>
                            </ul>
                        </div>
                        <div class="Bridge-switcherAnno">{{tonNetworkCoin}}</div>
                    </div>

                    <button
                        class="Bridge-switcher-arrow"
                        :disabled="isInterfaceBlocked"
                        @click="toggleFromTon"></button>

                    <div class="Bridge-switcher">
                        <div class="Bridge-switcherTitle" :class="{disabled: isInterfaceBlocked}">
                            <span>{{pairNetworkName}}&nbsp;▾</span>
                            <ul class="Bridge-switcherList">
                                <li
                                    v-for="item in toPairs"
                                    :key="item"
                                    @click="onPairClick(item === 'ton', item === 'ton' ? pair : item)"><button>{{$t(`Bridge.networks.${item}.${netTypeName}.name`)}}</button></li>
                            </ul>
                        </div>
                        <div class="Bridge-switcherAnno"><a :href="pairNetworkCoinUrl" target="_blank">{{pairNetworkCoin}}</a></div>
                    </div>
                </div>

                <div class="Bridge-inputWrapper">
                    <label for="amountInput">{{$t('Bridge.amountOfTon')}}</label><br>
                    <input
                        :disabled="isInterfaceBlocked"
                        type="number"
                        id="amountInput"
                        v-model="amountInner">
                </div>

                <div class="Bridge-inputWrapper">
                    <label for="toInput" id="toInputLabel">{{addressInputLabel}}</label><br>
                    <input
                        :disabled="isInterfaceBlocked"
                        type="text"
                        id="toInput"
                        v-model="toAddress">
                </div>

                <div class="Bridge-pairFee">{{pairFee}}</div>
                <div class="Bridge-bridgeFee">{{bridgeFee}}</div>

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
                    :to-address="toAddress"
                    @interface-blocked="onInterfaceBlocked"
                    @state-changed="getPairGasFee__debounced"
                    @reset-state="resetState"
                    @save-state="saveState"
                    @delete-state="deleteState"
                /></BridgeProcessor>

                <div class="description-form">
                    <img src="~assets/pics/description-icon.svg" alt="Help"/>
                    <div>
                        <h2>How does it work?</h2>
                        <span>If you have any questions, then check out our detailed guide on how it works</span>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script lang="ts">
import Vue from 'vue'
import lodashDebounce from 'lodash.debounce';
import { supportsLocalStorage } from '~/utils/helpers';
import { PARAMS } from '~/utils/constants';
import BridgeProcessor from '~/components/BridgeProcessor.vue'

const PAIRS = [/*'eth',*/ 'bsc'];

declare interface IComponentData {
    getPairGasFee__debounced: () => void,
    gasPrice: number,

    isTestnet: boolean,
    isRecover: boolean,
    lt: number,
    hash: string,

    isFromTon: boolean,
    pair: string,
    amountInner: string,
    toAddress: string,

    isInterfaceBlocked: boolean
}

export default Vue.extend({

    components: {
        BridgeProcessor
    },

    head(): object {
        return {
            title: this.$t(`Bridge.networks.${this.pair}.pageTitle`) as string
        }
    },

    data(): IComponentData {
        return {
            getPairGasFee__debounced: () => {},
            gasPrice: 0,

            isTestnet: false,
            isRecover: false,
            lt: 0,
            hash: '',

            isFromTon: true,
            pair: 'bsc', // Initially: 'eth'
            amountInner: '',
            toAddress: '',

            isInterfaceBlocked: false
        }
    },

    computed: {
        netTypeName(): string {
            return this.isTestnet ? 'test' : 'main';
        },
        params(): IParamsNetwork {
            const pairParams = PARAMS.networks[this.pair];
            return pairParams[this.netTypeName as keyof typeof pairParams];
        },
        tonNetworkName(): string {
            return this.$t(`Bridge.networks.ton.${this.netTypeName}.name`) as string;
        },
        tonNetworkCoin(): string {
            return this.$t(`Bridge.networks.ton.${this.netTypeName}.coin`) as string;
        },
        pairNetworkName(): string {
            return this.$t(`Bridge.networks.${this.pair}.${this.netTypeName}.name`) as string;
        },
        pairNetworkCoin(): string {
            return this.$t(`Bridge.networks.${this.pair}.${this.netTypeName}.coin`) as string;
        },
        pairNetworkCoinUrl(): string {
            const url = this.params.explorerUrl as string;
            const address = this.params.wTonAddress as string;
            return url.replace('<ADDRESS>', address) as string;
        },
        addressInputLabel(): string {
            const pair = this.isFromTon ? this.pair : 'ton';
            const networkFillName = this.$t(`Bridge.networks.${pair}.${this.netTypeName}.full`) as string;
            const label = this.$t(`Bridge.addressInputLabel`) as string;
            return label.replace('<NETWORK>', networkFillName) as string;
        },
        pairFee(): string {
            const n = this.gasPrice ? this.gasPrice / this.params.defaultGwei : 1;
            const fee = this.isFromTon ? (this.params.coinsPerGweiTo * n) : (this.params.coinsPerGweiFrom * n);

            return (this.$t(`Bridge.networks.${this.pair}.gasFee`) as string).replace('<FEE>', fee.toFixed(4));
        },
        amount: {
            get(): number {
                const amount = parseFloat(this.amountInner);
                return !amount || isNaN(amount) ? 0 : amount;
            },

            set(value: number): void {
                this.amountInner = isNaN(value) ? '' : String(value);
            }
        },
        bridgeFee(): string {
            if (!isNaN(this.amount) && this.amount >= 10) {
                return (this.$t('Bridge.bridgeFeeAbove10') as string).replace('<FEE>', String(5 + (this.amount - 5) * (0.25 / 100)));
            } else {
                return this.$t('Bridge.bridgeFeeBelow10') as string;
            }
        },
        fromPairs(): string[] {
            return PAIRS;
        },
        toPairs(): string[] {
            return ['ton', ...PAIRS.filter(i => i !== this.pair)];
        }
    },

    watch: {
        isFromTon() {
            this.getPairGasFee__debounced();
        },
        pair() {
            this.getPairGasFee__debounced();
        }
    },

    created(): void {
        this.getPairGasFee__debounced = lodashDebounce(this.getPairGasFee, 100);

        if (this.$route.query.testnet) {
            this.isTestnet = (this.$route.query.testnet as string).toLowerCase() === 'true';
        }
        if (this.$route.query.recover || this.$route.query.recovery) {
            this.isRecover = true;
        }
        if (this.$route.query.lt) {
            const lt = parseInt(this.$route.query.lt, 10);
            this.lt = !lt || isNaN(lt) ? 0 : lt;
        }
        if (this.$route.query.hash) {
            this.hash = this.$route.query.hash as string;
        }
        if (this.$route.query.amount) {
            const amount = parseFloat(this.$route.query.amount) / 1e9; //TODO refactor
            this.amount = !amount || isNaN(amount) ? 0 : amount;
        }
        if (this.$route.query.toAddress) {
            this.toAddress = this.$route.query.toAddress as string;
        }
        if (this.$route.query.fromNetwork && this.$route.query.toNetwork) {
            const fromNetwork = this.$route.query.fromNetwork.toLowerCase();
            const toNetwork = this.$route.query.toNetwork.toLowerCase();

            if (fromNetwork === 'ton' && PAIRS.includes(toNetwork))  {
                this.isFromTon = true;
                this.pair = toNetwork;
            }

            if (toNetwork === 'ton' && PAIRS.includes(fromNetwork))  {
                this.isFromTon = false;
                this.pair = fromNetwork;
            }
        }
    },

    mounted(): void {
        this.getPairGasFee__debounced();
        this.loadState();
    },

    methods: {
        openSwap() {
            // TODO: Move this to settings, when possible
            window.open('https://swap.staging.ice.io', '__empty');
        },
        connectWallet() {
            alert(";)");
        },
        onPairClick(switchDirection: boolean, toPair: string): void {
            if (this.isInterfaceBlocked) {
                return
            }

            if (switchDirection) {
                this.isFromTon = !this.isFromTon;
            }
            this.pair = toPair;
        },
        resetState(): void {
            this.isRecover = false;
            this.lt = 0;
            this.hash = '';
            this.amountInner = '';
            this.toAddress = '';
        },
        loadState(): void {
            if (!supportsLocalStorage) {
                return;
            }

            const raw = localStorage.getItem('bridgeState');

            if (raw) {
                let state: any;
                try {
                    state = JSON.parse(raw);
                } catch (e) {
                    return;
                }

                // for previous version
                if (!state.pair) {
                    return;
                }

                this.amount = state.amount;
                this.toAddress = state.toAddress;
                this.pair = state.pair;

                this.$nextTick(() => {
                    this.$refs.bridgeProcessor.loadState(state.processingState);
                });
            }
        },
        saveState(processingState: any): void {
            if (!supportsLocalStorage) {
                return;
            }

            const state = {
                amount: this.amount,
                toAddress: this.toAddress,
                pair: this.pair,
                processingState: processingState
            }

            localStorage.setItem('bridgeState', JSON.stringify(state));
        },
        deleteState(): void {
            if (!supportsLocalStorage) {
                return;
            }

            localStorage.removeItem('bridgeState');
        },
        onInterfaceBlocked(isBlocked: boolean): void {
            this.isInterfaceBlocked = isBlocked;
        },
        toggleFromTon(): void {
            if (this.isInterfaceBlocked) {
                return
            }
            this.isFromTon = !this.isFromTon;
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
        }
    }
})
</script>


<style lang="less" scoped>
@r: .Bridge;

@{r} {
    &-testnetWarning {
        position: absolute;
        left: 0;
        top: 0;
        color: white;
        width: 100%;
        padding: 8px 0;
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
                border-bottom: 1px dotted #AAA;

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
                        display: none
                    };
                }
            }

            @media (max-width: 800px) {
                font-size: 12px;
            }
        }

        &List {
            background: #FFF;
            border-radius: 16px;
            box-shadow: 0px 8px 24px rgb(48 55 87 / 12%);
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

            transition: all 0 ease-in-out;
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
        background-image: url('~assets/pics/arrow.svg');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        width: 32px;
        height: 32px;
        margin-left: 16px;
        margin-right: 16px;

        &[disabled] {
            cursor: default;
        }
    }

    &-inputWrapper {
        width: 100%;

        input {
            line-height: 36px;
            width: 100%;
            max-width: 500px;
            padding: 8px;
            font-size: 18px;
            border: 1px solid #ccc;
            border-radius: 8px;
            margin-top: 8px;
            margin-bottom: 20px;
            -webkit-appearance: none;

            &[disabled] {
                color: gray;
            }
        }
    }

    &-pairFee {
        color: #666666;
        margin-bottom: 4px;
    }

    &-bridgeFee {
        color: #666666;
        margin-bottom: 10px;
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
    left: calc(50% - 1392px/2);
    top: 24px;

    background: #FFFFFF;
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
    top: calc(50% - 40px/2);
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
    left: calc(50% - 268px/2);
    top: calc(50% - 48px/2);
}

.menu .bridge-tab {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0px 24px;
    gap: 6px;

    width: 133px;
    height: 48px;

    background: #F5F7FF;
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
    color: #0166FF;
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
    padding: 0px 24px;
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

    color: #9A9A9A;

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

.menu .connect-wallet-button {
    box-sizing: border-box;

    /* Auto layout */
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 12px 24px;
    gap: 8px;

    width: 189px;
    height: 48px;

    background: #0166FF;
    border: 1.2px solid #0166FF;
    border-radius: 16px;
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
    margin-top: 17px;
    margin-bottom: 117px;

    position: relative;
    width: 460px;
    height: 89px;
    left: calc(50% - 460px/2);

    background: #FFFFFF;
    box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.05);
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

    color: #0E0E0E;

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
    display: none;
}

/* Styling for the Connect Wallet button */
.connect-wallet-button {
    padding: 8px 16px;
    font-size: 13px;
    background-color: #4A90E2; /* Cool blue */
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

    background: #FFFFFF;
    box-shadow: -2px -2px 16px rgba(29, 70, 235, 0.1);
    border-radius: 16px;
    border-width: 0;

    /* Mainnet/Subtitle (600) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;

    color: #FD4E4E;

    /* Inside auto layout */
    flex: none;
    order: 1;
    flex-grow: 0;

    cursor: pointer;
}

.meme-icon-white {
    stroke: white;
}

.meme-icon-blue {
    stroke: #0166FF;
}

</style>
