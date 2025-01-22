<template>
    <div class="BridgeProcessor">
        <button
            class="BridgeProcessor-transfer transfer-button"
            v-if="state.step === 0"
            :disabled="!isSwapValid"
            @click="onTransferClick">{{$t('Bridge.transfer')}}</button>

        <div class="BridgeProcessor-infoWrapper notifications-area" v-else>
            <div :class="`notification ${classForStep(1)}`">
                <div>
                    <img src="~assets/pics/pending-icon.svg" class="notification-status-icon" alt="Pending" v-if=pendingStep(1) />
                    <img src="~assets/pics/completed-icon.svg" class="notification-status-icon" alt="Completed" v-if=completedStep(1) />
                    Submitting transaction
                    <dots-cycler v-if=pendingStep(1) />
                </div>
            </div>
            <div :class="`notification ${classForStep(2)}`" v-if="!isFromTon && (pendingStep(2) || completedStep(2))">
                <div>
                    <img src="~assets/pics/pending-icon.svg" class="notification-status-icon" alt="Pending" v-if=pendingStep(2) />
                    <img src="~assets/pics/completed-icon.svg" class="notification-status-icon" alt="Completed" v-if=completedStep(2) />
                    <img src="~assets/pics/pending-icon.svg" class="notification-status-icon" alt="Pending" v-if=futureStep(2) />
                    {{ getStepInfoText2 }}
                    <dots-cycler v-if=pendingStep(2) />
                </div>
            </div>
            <div :class="`notification ${classForStep(3)}`" v-if="pendingStep(3) || completedStep(3)">
                <div>
                    <img src="~assets/pics/pending-icon.svg" class="notification-status-icon" alt="Pending" v-if=pendingStep(3) />
                    <img src="~assets/pics/completed-icon.svg" class="notification-status-icon" alt="Completed" v-if=completedStep(3) />
                    <img src="~assets/pics/pending-icon.svg" class="notification-status-icon" alt="Pending" v-if=futureStep(3) />
                    {{ getStepInfoText3 }}
                    <dots-cycler v-if=pendingStep(3) />
                </div>
            </div>
            <div :class="`notification ${classForStep(4)}`" v-if="pendingStep(4) || completedStep(4)">
                <div>
                    <img src="~assets/pics/pending-icon.svg" class="notification-status-icon" alt="Pending" v-if=pendingStep(4) />
                    <img src="~assets/pics/completed-icon.svg" class="notification-status-icon" alt="Completed" v-if=completedStep(4) />
                    <img src="~assets/pics/pending-icon.svg" class="notification-status-icon" alt="Pending" v-if=futureStep(4) />
                    {{ getStepInfoText4 }}
                    <dots-cycler v-if=pendingStep(4) />
                </div>
            </div>
        </div>

        <button
            v-if="isGetTonCoinVisible"
            class="BridgeProcessor-getTonCoin get-button"
            @click="mint">{{$t('Bridge.getToncoin')}}</button>

        <button
            v-if="isDoneVisible"
            class="BridgeProcessor-done done-button"
            @click="onDoneClick">{{$t('Bridge.done')}}</button>

        <button
            v-if="isCancelVisible"
            class="BridgeProcessor-cancel cancel-button"
            @click="onCancelClick">{{$t('Bridge.cancel')}}</button>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Web3 from 'web3';
import IonWeb from 'ionweb';
import WTON from '~/assets/WTON.json';
import IONBridgeRouter from '~/assets/IONBridgeRouter.json';
import ERC20 from '~/assets/ERC20.json';
import {ethers} from "ethers";
import {Contract} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';
import { toUnit, toEther, fromUnit, fromEther, getNumber, getBool, decToHex, parseAddressFromDec } from '~/utils/helpers';
import {PARAMS} from '~/utils/constants';
import keccak256 from 'keccak256'
import DotsCycler from './DotsCycler.vue'

const BN = IonWeb.utils.BN;

declare interface IEthToTon {
    transactionHash: string,
    logIndex: number,
    to: {
        workchain: number,
        address_hash: string
    }
    value: number,
    blockTime: number,
    blockHash: string,
    blockNumber: number,
    from: string
}

declare interface ISwapData {
    type: string,
    receiver: string,
    amount: string,
    tx: {
        address_: {
            workchain: number,
            address_hash: string
        },
        tx_hash: string,
        lt: number
    }
}

declare interface IVoteEth {
    publicKey: string,
    r: string,
    s: string,
    v: number | undefined
}

declare interface IProvider {
    oraclesTotal: number,
    blockNumber: number,
    myEthAddress: string,
    wtonContract: Contract,
    ionBridgeRouter: Contract,
    ice1Contract: Contract,
    web3: Web3,
    ionweb: IonWeb,
    feeFlat: typeof BN,
    feeFactor: typeof BN,
    feeBase: typeof BN
}

declare interface IState {
    swapId: string,
    queryId: string,
    fromCurrencySent: boolean,
    toCurrencySent: boolean,
    step: number,
    votes: IVoteEth[] | number[] | null,
    swapData: ISwapData | null,
    createTime: number,
    blockNumber: number,
}

declare interface IComponentData {
    newBlockHeadersSubscription: any,
    updateStateInterval: null | ReturnType<typeof setInterval>,
    provider: IProvider | null,
    state: IState,
    ethToTon: IEthToTon | null,
    alertTimeout: number,
}

declare global {
    interface Window {
        ton?: any;
    }
}

export default Vue.extend({
    components: {
        DotsCycler
    },
    props: {
        isTestnet: {
            type: Boolean,
            required: true
        },
        isRecover: {
            type: Boolean,
            required: true
        },
        hasEnoughIce: {
            type: Boolean,
            required: true,
        },
        isConnected: {
          type: Boolean,
          required: true
        },
        lt: {
            type: Number,
            required: true
        },
        hash: {
            type: String,
            required: true
        },
        isFromTon: {
            type: Boolean,
            required: true
        },
        pair: {
            type: String,
            required: true
        },
        amount: {
            type: Number
        },
        toAddress: {
            type: String,
            required: true
        },
    },

    data(): IComponentData {
        return {
            newBlockHeadersSubscription: null,
            updateStateInterval: null,
            provider: null,
            ethToTon: null,
            alertTimeout: 0,

            state: {
                swapId: '',
                queryId: '0',
                fromCurrencySent: false,
                toCurrencySent: false,
                step: 0,
                votes: null,
                swapData: null,
                createTime: 0,
                blockNumber: 0
            }
        }
    },

    computed: {
        isSwapValid() {

            // Return false if not connected or already swapping
            if (!this.isConnected) {
                return false;
            }

            // Check if amount is empty or zero
            if (!this.amount) {
                return false;
            }

            return this.hasEnoughIce;
        },
        netTypeName(): string {
            return this.isTestnet ? 'test' : 'main';
        },
        params(): IParamsNetwork {
            const pairParams = PARAMS.networks[this.pair];
            return pairParams[this.netTypeName as keyof typeof pairParams];
        },
        isGetTonCoinVisible(): boolean {
            return this.isFromTon && !this.state.toCurrencySent && this.state.step === 4;
        },
        isDoneVisible(): boolean {
            return this.state.step > 4;
        },
        isCancelVisible(): boolean {
            return this.isFromTon && this.state.step === 1;
        },
        fromCoin(): string {
            return this.isFromTon ?
                this.$t(`Bridge.networks.ton.${this.netTypeName}.coinShort`) as string :
                this.$t(`Bridge.networks.${this.pair}.${this.netTypeName}.coinShort`) as string;
        },
        toCoin(): string {
            return !this.isFromTon ?
                this.$t(`Bridge.networks.ton.${this.netTypeName}.coinShort`) as string :
                this.$t(`Bridge.networks.${this.pair}.${this.netTypeName}.coinShort`) as string;
        },
        toNetwork(): string {
            const pair = this.isFromTon ? this.pair : 'ton';
            return this.$t(`Bridge.networks.${pair}.${this.netTypeName}.name`) as string;
        },
        getStepInfoText1(): object {
            if (this.state.step === 1) {
                if (this.isFromTon) {
                    const url = PARAMS.tonTransferUrl
                        .replace('<BRIDGE_ADDRESS>', this.params.tonBridgeAddress)
                        .replace('<AMOUNT>', String(toUnit(this.amount)))
                        .replace('<TO_ADDRESS>', this.toAddress);

                    const sendAmount = (this.$t(`Bridge.networks.ton.transactionSendAmount`) as string)
                        .replace('<AMOUNT>', String(this.amount))
                        .replace('<FROM_COIN>', this.fromCoin);

                    return {
                        isOnlyText: false,
                        sendAmount,
                        url,
                        sendFromPersonal: this.$t(`Bridge.networks.ton.transactionSendFromPersonal`) as string,
                        sendNotFromExchanges: this.$t(`Bridge.networks.ton.transactionSendNotFromExchanges`) as string
                    }
                } else {
                    return {
                        isOnlyText: true,
                        text: this.state.fromCurrencySent ?
                            this.$t(`Bridge.networks.${this.pair}.transactionWait`) as string :
                            this.$t(`Bridge.networks.${this.pair}.transactionSend`) as string
                    }
                }
            } else {
                const pair = this.isFromTon ? 'ton' : this.pair;
                return {
                    isOnlyText: true,
                    text: this.$t(`Bridge.networks.${pair}.transactionCompleted`) as string
                }
            }
        },
        getStepInfoText2(): string {
            if (this.isFromTon) {
                return '';
            }

            if (this.state.step === 2) {
                let blocksConfirmations = (this.provider?.blockNumber || this.state.blockNumber) - this.state.blockNumber;
                blocksConfirmations = Math.min(blocksConfirmations, this.params.blocksConfirmations);

                return (this.$t(`Bridge.networks.${this.pair}.blocksConfirmations`) as string)
                    .replace('<COUNT>', String(blocksConfirmations) + '/' + String(this.params.blocksConfirmations));
            } else if (this.state.step > 2) {
                return this.$t('Bridge.blocksConfirmationsCollected') as string;
            } else {
                return this.$t('Bridge.blocksConfirmationsWaiting') as string;
            }
        },
        getStepInfoText3(): string {
            if (this.state.step === 3) {
                const votesConfirmations = (this.state.votes?.length || 0) + '/' + (this.provider?.oraclesTotal || 0);

                return (this.$t(`Bridge.oraclesConfirmations`) as string)
                    .replace('<COUNT>', String(votesConfirmations));
            } else if (this.state.step > 3) {
                return this.$t('Bridge.oraclesConfirmationsCollected') as string;
            } else {
                return this.$t('Bridge.oraclesConfirmationsWaiting') as string;
            }
        },
        getStepInfoText4(): string {
            if (this.state.step === 4) {
                if (this.isFromTon) {
                    return this.state.toCurrencySent ?
                        this.$t(`Bridge.networks.${this.pair}.transactionWait`) as string :
                        (this.$t(`Bridge.getCoinsByMetamask`) as string)
                            .replace('<TO_COIN>', this.toCoin);

                } else {
                    return (this.$t(`Bridge.coinsSent`) as string)
                        .replace('<TO_COIN>', this.toCoin);
                }
            } else if (this.state.step > 4) {
                return (this.$t(`Bridge.coinsSent`) as string)
                    .replace('<TO_COIN>', this.toCoin);
            } else {
                return (this.$t(`Bridge.getCoins`) as string)
                    .replace('<TO_COIN>', this.toCoin)
                    .replace('<TO_NETWORK>', this.toNetwork);
            }
        }
    },

    watch: {
        'state.step': {
            immediate: true,
            handler(val): void {
                this.$emit('state-changed');
                this.$emit('interface-blocked', val > 0);
            }
        }
    },

    mounted(): void {
        this.updateState();
        this.updateStateInterval = setInterval(this.updateState, 5000);
    },

    beforeDestroy(): void  {
        clearInterval(this.updateStateInterval as ReturnType<typeof setInterval>);

        if (this.newBlockHeadersSubscription) {
            this.newBlockHeadersSubscription.unsubscribe();
        }

        const ethereum = window.ethereum;

        if (ethereum) {
            ethereum.removeListener('accountsChanged', this.onAccountChanged);
        }
    },

    methods: {
        // Clear any existing timeout first
        unScheduleReset() {
            if (this.alertTimeout) {
                clearTimeout(this.alertTimeout);
                this.alertTimeout = 0;
            }
        },
        scheduleReset(): void {
            // Clear any existing timeout first
            if (this.alertTimeout) {
                clearTimeout(this.alertTimeout);
                this.alertTimeout = 0;
            }

            // Set new timeout to reset state after 30 seconds
            this.alertTimeout = Number(setTimeout(() => {
                this.resetState();
            }, 30000));
        },
        classForStep(step: number): string {
            if (this.state.step <= step) {
                return 'step-pending';
            } else if (this.state.step > step) {
                return 'step-completed';
            }

            return 'step-error';
        },
        pendingStep(step: number): boolean {
            return this.state.step === step;
        },
        completedStep(step: number): boolean {
            return this.state.step > step;
        },
        futureStep(step: number): boolean {
            return false;

            // return this.state.step < step;
        },
        resetState(): void {
            this.state.swapId = '';
            this.state.queryId = '0';
            this.state.fromCurrencySent = false;
            this.state.toCurrencySent = false;
            this.state.step = 0;
            this.state.votes = null;
            this.state.swapData = null;
            this.state.createTime = 0;
            this.state.blockNumber = 0;

            this.$emit('reset-state');
        },
        async loadState(processingState: IState): Promise<void> {
            if (!processingState) {
                 return;
            }

            this.provider = await this.initProvider();

            if (!this.provider) {
                return;
            }
            Object.assign(this.state, processingState);

            await this.updateState();
        },
        saveState(): void {
            this.$emit('save-state', this.state);
        },
        deleteState(): void {
            this.$emit('delete-state');
        },
        async updateState(): Promise<void> {
            if (this.state.step === 1 && this.isFromTon) {
                const swap = await this.getSwap(this.amount, this.toAddress, this.state.createTime);
                if (swap) {
                    this.state.swapId = this.getSwapTonToEthId(this.provider!.web3, swap);
                    this.state.swapData = swap;
                    this.state.step = 3;
                }
            }

            if (this.state.step === 2 && !this.isFromTon) {
                const blocksConfirmations = (this.provider?.blockNumber || this.state.blockNumber) - this.state.blockNumber;

                if (blocksConfirmations > this.params.blocksConfirmations) {
                    const block = await this.provider!.web3.eth.getBlock(this.state.blockNumber);

                    this.ethToTon!.blockTime = Number(block.timestamp);
                    this.ethToTon!.blockHash = block.hash;

                    this.state.queryId = this.getQueryId(this.ethToTon!).toString();
                    this.state.step = 3;
                }
            }

            if (this.state.step === 3) {
                this.state.votes = this.isFromTon ? await this.getEthVote(this.state.swapId) : await this.getTonVote(this.state.queryId);
                if (this.state.votes) {
                    console.log(`Comparing ${this.provider!.oraclesTotal * 2 / 3} desired votes to ${this.state.votes!.length} factual votes`);
                    if (this.state.votes && this.state.votes!.length >= this.provider!.oraclesTotal * 2 / 3) {
                        const newStep = this.isFromTon ? 4 : 5;
                        if (newStep === 5) {
                            this.scheduleReset();
                        }
                        this.state.step = newStep;
                    }
                }
            }
        },
        getSwapTonToEthId(web3: any, d: ISwapData): string {
            let encodedParams;

            if (this.pair === 'eth' && !this.isTestnet) {
                encodedParams = web3.eth.abi.encodeParameters(
                    ['int', 'address', 'uint256', 'int8', 'bytes32', 'bytes32', 'uint64'],
                    [0xDA7A, d.receiver, d.amount, d.tx.address_.workchain, d.tx.address_.address_hash, d.tx.tx_hash, d.tx.lt]
                )
            }

            if (this.pair === 'bsc' || this.isTestnet) {
                const hashedObject = [0xDA7A, this.params.wTonAddress, d.receiver, d.amount, d.tx.address_.workchain, d.tx.address_.address_hash, d.tx.tx_hash, d.tx.lt];
                encodedParams = web3.eth.abi.encodeParameters(
                    ['int', 'address', 'address', 'uint256', 'int8', 'bytes32', 'bytes32', 'uint64'],
                    hashedObject
                );
                console.log('Hashed object', hashedObject);
            }

            const hash = Web3.utils.sha3(encodedParams) as string;
            console.log('Calculated hash', hash);
            return hash;
        },
        serializeEthToTon(ethToTon: IEthToTon) {
            const bits = new IonWeb.boc.BitString(8 + 256 + 16 + 8 + 256 + 64);
            bits.writeUint(0, 8); // vote op
            bits.writeUint(new BN(ethToTon.transactionHash.substr(2), 16), 256);
            bits.writeInt(ethToTon.logIndex, 16);
            bits.writeUint(ethToTon.to.workchain, 8);
            bits.writeUint(new BN(ethToTon.to.address_hash, 16), 256);
            bits.writeUint(new BN(ethToTon.value), 64);
            return bits.array;
        },
        getQueryId(ethToTon: IEthToTon): typeof BN {

            console.log(`Calculating 'getQueryId' for ${JSON.stringify(ethToTon)}`);

            // web3@1.3.4 has an error in the algo for computing SHA
            // it doesn't strictly check input string for valid HEX relying only for 0x prefix
            // but the query string is formed that way: 0xBLOCKHASH + '_' + 0xTRANSACTIONHASH + '_' + LOGINDEX
            // the keccak algo splits string to pairs of symbols, and treats them as hex bytes
            // so _0 becames NaN, x7 becames NaN, d_ becames 13 (it only sees first d and skips invalid _)
            // web3@1.6.1 has this error fixed, but for our case this means that we've got different hashes for different web3 versions
            // and getLegacyQueryString code transforms query string in the way, that SHA from web3@1.6.1 can return the same exact value as web3@1.3.4
            // for example:
            // old one: 0xcad62a0e0090e30e0133586f86ed8b7d0d2eac5fa8ded73b8180931ff379b113_0x77e5617841b2d355fe588716b6f8f506b683e985fc98fdb819ddf566594d4cfd_64
            // new one: 0xcad62a0e0090e30e0133586f86ed8b7d0d2eac5fa8ded73b8180931ff379b11300007e5617841b2d355fe588716b6f8f506b683e985fc98fdb819ddf566594d4cf0d64
            // diff   :                                                                   ^^^^                                                              ^^
            function getLegacyQueryString(str: string): string {
                const strArr = str.split('');
                strArr[66] = '0';
                strArr[67] = '0';
                strArr[68] = '0';
                strArr[69] = '0';
                strArr[133] = strArr[132];
                strArr[132] = '0';
                return strArr.join('');
            }

            function hexToUint8Array(hex: string): Uint8Array {

                // Remove 0x prefix if present
                const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

                const bytes = new Uint8Array(cleanHex.length / 2);
                for (let i = 0; i < bytes.length; i++) {
                    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
                }

                return bytes;
            }

            const MULTISIG_QUERY_TIMEOUT = 30 * 24 * 60 * 60; // 30 days
            const VERSION = 2;
            const timeout = ethToTon.blockTime + MULTISIG_QUERY_TIMEOUT + VERSION;

            const input = getLegacyQueryString(ethToTon.blockHash + '_' + ethToTon.transactionHash + '_' + String(ethToTon.logIndex));
            console.log(`getQueryId input ${input}`);
            const query_id = keccak256(input).toString('hex').substr(2, 8); // get first 32 bit
            console.log(`getQueryId query_id ${query_id}`);

            return new BN(timeout).mul(new BN(4294967296)).add(new BN(query_id, 16));
        },
        getFeeAmount(amount: typeof BN): string {
            const rest = new BN(amount).sub(this.provider!.feeFlat);
            const percentFee = rest.mul(this.provider!.feeFactor).div(this.provider!.feeBase);
            return this.provider!.feeFlat.add(percentFee)
        },
        makeAddress(address: string): string {
            if (!address.startsWith('0x')) throw new Error('Invalid address ' + address);
            let hex = address.substr(2);
            while (hex.length < 40) {
                hex = '0' + hex;
            }
            return '0x' + hex;
        },
        async getSwap(myAmount: number, myToAddress: string, myCreateTime: number): Promise<null | ISwapData> {

            const findLogOutMsg = (outMessages?: any[]): any => {
                if (!outMessages) return null;
                for (const outMsg of outMessages) {
                    if (outMsg.destination === '') return outMsg;
                }
                return null;
            }

            const getRawMessageBytes = (logMsg: any): Uint8Array | null => {
                const message = logMsg.message.substr(0, logMsg.message.length - 1); // remove '\n' from end
                const bytes = IonWeb.utils.base64ToBytes(message);
                if (bytes.length !== 28) {
                    return null;
                }
                return bytes;
            }

            const getTextMessageBytes = (logMsg: any): Uint8Array | null => {
                const message = logMsg.msg_data?.text;
                const textBytes = IonWeb.utils.base64ToBytes(message);
                const bytes = new Uint8Array(textBytes.length + 4);
                bytes.set(textBytes, 4);
                return bytes;
            }

            const getMessageBytes = (logMsg: any): Uint8Array | null => {
                const msgType = logMsg.msg_data['@type'];
                if (msgType === 'msg.dataText') {
                    return getTextMessageBytes(logMsg);
                } else if (msgType === 'msg.dataRaw') {
                    return getRawMessageBytes(logMsg);
                } else {
                    console.error('Unknown log msg type ' + msgType);
                    return null;
                }
            }

            try {
                // Fetch the current account state to get the latest logical time (lt)
                const accountState = await this.provider!.ionweb.provider.getAddressInfo(this.params.tonBridgeAddress);
                let lt = accountState.last_transaction_id.lt;

                while (true) {
                    // Request only one transaction starting from the current logical time
                    const transactions = await this.provider!.ionweb.provider.getTransactions(
                        this.params.tonBridgeAddress,
                        1,
                        lt,
                        undefined,
                        undefined,
                        true
                    );

                    if (transactions.length === 0) {
                        break;
                    }

                    console.log('ION transactions count:', transactions.length);

                    for (const t of transactions) {
                        // Check if transaction is newer than the swap start time
                        // `t.utime` is in seconds, convert to milliseconds before comparing.
                        if ((t.utime * 1000) < myCreateTime) {
                            // This transaction is older than when we initiated the swap, skip it.
                            // Sleep 1 second asynchronously before continuing
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                        }

                        const logMsg = findLogOutMsg(t.out_msgs);
                        if (logMsg) {
                            const bytes = getMessageBytes(logMsg);
                            if (bytes === null) continue;

                            const destinationAddress = this.makeAddress('0x' + IonWeb.utils.bytesToHex(bytes.slice(0, 20)));
                            const amountHex = IonWeb.utils.bytesToHex(bytes.slice(20, 28));
                            const amount = new BN(amountHex, 16);
                            const senderAddress = new IonWeb.utils.Address(t.in_msg.source);

                            const addressFromInMsg = t.in_msg.message.slice('swapTo#'.length);
                            if (destinationAddress.toLowerCase() !== addressFromInMsg.toLowerCase()) {
                                continue;
                            }

                            const amountFromInMsg = new BN(t.in_msg.value);
                            const amountFromInMsgAfterFee = amountFromInMsg.sub(this.getFeeAmount(amountFromInMsg));
                            if (!amount.eq(amountFromInMsgAfterFee)) {
                                continue;
                            }

                            const event: ISwapData = {
                                type: 'SwapTonToEth',
                                receiver: destinationAddress,
                                amount: amount.toString(),
                                tx: {
                                    address_: {
                                        workchain: senderAddress.wc,
                                        address_hash: '0x' + IonWeb.utils.bytesToHex(senderAddress.hashPart),
                                    },
                                    tx_hash: '0x' + IonWeb.utils.bytesToHex(IonWeb.utils.base64ToBytes(t.transaction_id.hash)),
                                    lt: t.transaction_id.lt,
                                }
                            };

                            console.log("Swap event:", JSON.stringify(event));

                            const myAmountNano = new BN(myAmount * 1e9);
                            const amountAfterFee = myAmountNano.sub(this.getFeeAmount(myAmountNano));

                            if (amount.eq(amountAfterFee) && event.receiver.toLowerCase() === myToAddress.toLowerCase()) {
                                return event;
                            }
                        }
                    }

                    // Move to the next logical time block
                    lt = transactions[0].transaction_id.lt;
                }
            } catch (error) {
                console.error('Error in getSwap:', error);
            }

            return null;
        },
        parseEthSignature(data: any) {
            const tuple = data.tuple.elements;
            const publicKey = this.makeAddress(decToHex(tuple[0].number.number));

            const rsv = tuple[1].tuple.elements;
            const r = decToHex(rsv[0].number.number);
            const s = decToHex(rsv[1].number.number);
            const v = Number(rsv[2].number.number);
            return {
                publicKey,
                r,
                s,
                v
            }
        },
        async getEthVote(voteId: string): Promise<null | IVoteEth[]> {
            console.log('getEthVote ', voteId);

            const result = await this.provider!.ionweb.provider.call(this.params.tonCollectorAddress, 'get_external_voting_data', [['num', voteId]]);
            if (result.exit_code === 309) {
                return null;
            }

            let list;
            try {
                list = result.stack[0][1].elements;
            } catch (e) {
                console.log('getEthVote, corrupted result', result);
                return null;
            }

            const status = {
                signatures: list.map(this.parseEthSignature)
            };

            return status.signatures;
        },
        async getTonVote(queryId: string): Promise<null | number[]> {
            console.log(`${this.params.tonMultisigAddress}~getTonVote `, queryId);

            const result = await this.provider!.ionweb.provider.call(this.params.tonMultisigAddress, 'get_query_state', [['num', queryId]]);

            let a, b;
            try {
                a = getNumber(result.stack[0]);
                b = getNumber(result.stack[1]);
            } catch (e) {
                console.log('getTonVote, corrupted result', result);
                return null;
            }
            console.log('getTonVote', result, a, b);

            const arr = [];
            const count = a === -1 ? this.provider!.oraclesTotal : b.toString(2).split('0').join('').length; // count of bits
            for (let i = 0; i < count; i++) {
                arr.push(1);
            }
            return arr;
        },
        async mint(): Promise<any> {
            let receipt;
            try {

                // First check and set allowance for WTON
                const currentWTONAllowance = await this.provider!.wtonContract.methods.allowance(
                    this.provider!.myEthAddress,
                    this.provider!.ionBridgeRouter.options.address
                ).call();

                // Convert to amount to the right decimals (from 10^9 to 10^18)
                const amountForApproval = new BN(this.state.swapData!.amount);

                if (new BN(currentWTONAllowance).lt(amountForApproval)) {
                    console.log('Requesting WTON token approval...');
                    const approvalReceipt = await this.provider!.wtonContract.methods.approve(
                        this.provider!.ionBridgeRouter.options.address,
                        amountForApproval
                    ).send({ from: this.provider!.myEthAddress });

                    if (!approvalReceipt.status) {
                        throw new Error('WTON token approval failed');
                    }
                    console.log('WTON token approval successful');
                }

                let signatures = (this.state.votes! as IVoteEth[]).map(v => {
                    return {
                        signer: v.publicKey,
                        signature: ethers.utils.joinSignature({r: v.r, s: v.s, v: v.v})
                    }
                })

                signatures = signatures.sort((a, b) => {
                    return new BN(a.signer.substr(2), 16).cmp(new BN(b.signer.substr(2), 16));
                });

                console.log('voteForMinting', JSON.stringify(this.state.swapData!), JSON.stringify(signatures));

                receipt = await this.provider!.ionBridgeRouter.methods.voteForMinting(this.state.swapData!, signatures).send({from: this.provider!.myEthAddress})
                    .on('transactionHash', () => {
                        this.state.toCurrencySent = true;
                        this.deleteState();
                    });
            } catch (e) {
                console.error(e);
                return;
            }

            if (receipt.status) {
                this.state.step = 5;
                this.deleteState();
                this.scheduleReset();
            } else {
                console.error('transaction fail', receipt);
            }
        },
        async burn(): Promise<void> {
            const fromAddress = this.provider!.myEthAddress;
            const toAddress = this.toAddress;
            const amount = this.amount;

            const addressTon = new IonWeb.utils.Address(toAddress);
            const wc = addressTon.wc;
            const hashPart = IonWeb.utils.bytesToHex(addressTon.hashPart);
            const amountUnit = toUnit(amount ? amount : 0);
            const amountEther = toEther(amount ? amount : 0);

            console.log(`Address hash: 0x${hashPart}`);

            // First check the allowance for ice1Contract
            let currentAllowance = await this.provider!.ice1Contract.methods.allowance(
                fromAddress,
                this.provider!.ionBridgeRouter.options.address
            ).call();
            currentAllowance = new BN(currentAllowance);

            // If allowance is less than amount, request approval
            console.log(`Current allowance: ${currentAllowance}, expected amount: ${amountEther}`);
            if (currentAllowance.lt(amountEther)) {
                console.log('Requesting ICE token approval...');

                // Now approve the actual amount
                const approvalReceipt = await this.provider!.ice1Contract.methods.approve(
                    this.provider!.ionBridgeRouter.options.address,
                    amountEther
                ).send({ from: fromAddress });

                if (!approvalReceipt.status) {
                    throw new Error('ICE token approval failed');
                }
                console.log('ICE token approval successful');
            }

            let receipt;

            try {
                receipt = await this.provider!.ionBridgeRouter.methods.burn(amountEther, {
                    workchain: wc,
                    address_hash: '0x' + hashPart
                }).send({from: fromAddress})
                    .on('transactionHash', () => {
                        this.state.fromCurrencySent = true;
                    });
            } catch (e) {
                console.error(e);
                this.resetState();
                return;
            }

            if (receipt.status) {
                console.log('Transaction receipt', receipt);

                // Find SwapEthToIon event by its signature
                const SWAP_ETH_TO_ION_SIGNATURE = "SwapEthToIon(address,int8,bytes32,uint256)";
                const SWAP_ETH_TO_ION_TOPIC = Web3.utils.sha3(SWAP_ETH_TO_ION_SIGNATURE);

                const swapEvent = receipt.events && Object.values(receipt.events).find((event: any) =>
                    event.raw &&
                    event.raw.topics &&
                    event.raw.topics[0] === SWAP_ETH_TO_ION_TOPIC
                );

                if (!swapEvent) {
                    console.error('SwapEthToIon event not found in receipt');
                    return;
                } else {
                    console.log('Swap event:', swapEvent);
                }

                this.state.blockNumber = receipt.blockNumber;
                this.ethToTon = {
                    transactionHash: receipt.transactionHash,
                    logIndex: swapEvent.logIndex, // Use logIndex from found event
                    blockNumber: this.state.blockNumber,
                    blockTime: 0,
                    blockHash: '',
                    from: fromAddress,
                    to: {
                        workchain: wc,
                        address_hash: hashPart
                    },
                    value: amountUnit
                };

                this.state.step = 2;
            } else {
                console.error('Transaction failed', receipt);
            }
        },
        onDoneClick(): void {
            this.resetState();
        },
        onCancelClick(): void {
            this.deleteState();
            this.resetState();
        },
        async onAccountChanged(accounts: Array<any>): Promise<void>  {
            console.log('accountsChanged', accounts);
            const address: string = accounts[0] as string;
            if (!this.provider) {
                return;
            }
            if (!(new BN(await this.provider!.web3.eth.getBalance(address)).gt(new BN('0')))) {
                alert(this.$t(`Bridge.networks.${this.pair}.errors.lowBalance`) as string);
                return;
            }
            this.provider!.myEthAddress = address;
            console.log('address is', this.provider!.myEthAddress);
        },
        async initProvider(): Promise<IProvider | null> {
            const ethereum = window.ethereum;

            if (!ethereum) {
                alert(this.$t('Bridge.errors.installMetamask') as string);
                return null;
            } else {
                let myEthAddress;
                try {
                    const accounts = (await ethereum.send('eth_requestAccounts')).result;
                    myEthAddress = accounts[0];
                    console.log('address is', myEthAddress);
                } catch (error) {
                    console.log(error);
                    return null;
                }

                ethereum.addListener('accountsChanged', this.onAccountChanged);

                if (ethereum.networkVersion as string !== String(this.params.chainId)) {
                    //eth
                    const error = (this.$t('Bridge.errors.wrongMetamaskNetwork') as string)
                        .replace('<NETWORK>', this.$t(`Bridge.networks.${this.pair}.${this.netTypeName}.full`) as string)
                    alert(error);
                    return null;
                }

                const web3 = new Web3(ethereum);
                const wtonContract = new web3.eth.Contract(WTON as AbiItem[], this.params.wTonAddress);
                const ionBridgeRouter = new web3.eth.Contract(IONBridgeRouter as AbiItem[], this.params.ionBridgeRouterAddress);
                const ice1Contract = new web3.eth.Contract(ERC20 as AbiItem[], this.params.ice1TokenAddress);
                const oraclesTotal = (await wtonContract.methods.getFullOracleSet().call()).length;

                if (!(oraclesTotal > 0)) {
                    alert("Total oracles should be more than 0");
                    return null;
                }

                if (!(new BN(await web3.eth.getBalance(myEthAddress)).gt(new BN('0')))) {
                    alert(this.$t(`Bridge.networks.${this.pair}.errors.lowBalance`) as string);
                    return null;
                }

                this.newBlockHeadersSubscription = web3.eth.subscribe('newBlockHeaders')
                    .on('data', (blockHeader) => {
                        this.provider!.blockNumber = blockHeader.number;
                    })
                    .on('error', (error) => {
                        console.error("Error on newBlockHeaders", error);
                    });

                const ionweb = new IonWeb(new IonWeb.HttpProvider(this.params.tonCenterUrl, {apiKey: 'ba68682c292bf1ad6150319d94670d36a81313f08fe67592c99e43c8f718d298'}));

                const bridgeData = (await ionweb.provider.call(this.params.tonBridgeAddress, 'get_bridge_data', [])).stack;

                console.log("Bridge data", bridgeData);

                if (bridgeData.length !== 8) throw new Error('Invalid bridge data')
                const stateFlags = getNumber(bridgeData[0]);
                const totalLocked = getNumber(bridgeData[1]);
                const collectorWc = getNumber(bridgeData[2]);
                const collectorAddr = bridgeData[3][1]; // string
                const feeFlat = new BN(getNumber(bridgeData[4]));
                const feeNetwork = new BN(getNumber(bridgeData[5]));
                const feeFactor = new BN(getNumber(bridgeData[6]));
                const feeBase = new BN(getNumber(bridgeData[7]));

                const res: IProvider = {
                    blockNumber: 0,
                    myEthAddress,
                    web3,
                    wtonContract,
                    ionBridgeRouter,
                    ice1Contract,
                    ionweb,
                    oraclesTotal,
                    feeFlat: feeFlat.add(feeNetwork),
                    feeFactor,
                    feeBase
                };

                return res;
            }
        },
        async onTransactClick(): Promise<void> {

            if (!this.amount) {

                console.log(`onTransactClick - amount not set`);
                return;
            }

            console.log(`onTransactClick`);

            if (typeof window.ion !== 'undefined') {
                console.log('OpenMask is installed!');
            }

            const connect = async () => {
                const provider = window.ion;
                try {
                    const accounts = await provider.send("ton_requestAccounts");
                    const account = accounts[0];

                    console.log(`Using ION account ${account}`);

                    return account;
                } catch (e) {
                    console.error(e);
                }
            };

            const account = await connect();

            const message = `swapTo#${this.toAddress}`;

            // Send transaction
            const result = await window.ion.send('ton_sendTransaction', {
                from: account,
                value: String(toUnit(this.amount)),
                to: this.params.tonBridgeAddress,
                data: message
            });

            console.log('Transaction sent:', result);
            return result;
        },
        async onTransferClick(): Promise<void> {
            if (isNaN(this.amount)) {
                alert(this.$t('Bridge.errors.notValidAmount') as string);
                return;
            }
            if (this.amount < 10) {
                alert(this.$t('Bridge.errors.amountBelow10') as string);
                return;
            }

            if (this.toAddress.toLowerCase() === this.params.wTonAddress.toLowerCase() ||
                this.toAddress.toLowerCase() === this.params.tonBridgeAddress.toLowerCase()) {
                alert(this.$t('Bridge.errors.needPersonalAddress') as string);
                return;
            }

            if (this.isFromTon) {
                if (!Web3.utils.isAddress(this.toAddress)) {
                    alert(this.$t(`Bridge.networks.${this.pair}.errors.invalidAddress`) as string);
                    return;
                }
            } else {
                if (!IonWeb.utils.Address.isValid(this.toAddress)) {
                    alert(this.$t(`Bridge.networks.ton.errors.invalidAddress`) as string);
                    return;
                }
            }

            if (!this.provider) {
                this.provider = await this.initProvider();
                if (!this.provider) {
                    return;
                }
            }

            if (!this.isFromTon) {
                const userErcBalance = fromUnit(Number(await (this.provider!.wtonContract.methods.balanceOf(this.provider!.myEthAddress).call())));
                if (this.amount > userErcBalance) {
                    alert((this.$t('Bridge.errors.toncoinBalance') as string).replace('<BALANCE>', String(userErcBalance)));
                    return;
                }
            }

            this.unScheduleReset();

            this.state.createTime = Date.now();
            this.state.step = 1;

            if (this.isFromTon) {
                this.saveState();
                try {
                    await this.onTransactClick();
                } catch (error) {
                    console.error(error);

                    this.resetState();
                    this.deleteState();
                }
            } else {
                await this.burn();
            }
        }
    }
})
</script>


<style lang="less" scoped>
@r: .BridgeProcessor;

@{r} {
    &-transfer,
    &-transact,
    &-getTonCoin,
    &-done,
    &-cancel {
        -webkit-appearance: none;
        background-color: #1d98dc;
        border-radius: 25px;
        color: white;
        font-size: 16px;
        line-height: 19px;
        border: none;
        padding: 15px 35px 14px;

        .isPointer &:hover,
        .isTouch &:active {
            background-color: #0E2BC6;
        }
    }

    &-infoWrapper {
        text-align: left;
        width: fit-content;
        font-size: 18px;

        @media (max-width: 800px) {
            font-size: 16px;
        }
    }

    &-infoLine {
        margin-top: 20px;
        display: flex;
        align-items: center;
    }

    &-info-icon {
        flex-shrink: 0;

        &.done {
            width: 18px;
            height: 18px;
            background-image: url('~assets/pics/done.svg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            margin-right: 10px;
        }

        &.pending {
            width: 12px;
            height: 12px;
            border: 3px solid #1d98dc;
            border-left: 3px solid transparent;
            border-radius: 50%;
            animation: rotating 2s linear infinite;
            margin-right: 13px;
            margin-left: 3px;
        }

        &.none {
            width: 8px;
            height: 8px;
            margin-left: 4px;
            margin-right: 14px;
            background-color: #1d98dc;
            border-radius: 50%;
        }
    }

    &-info-text {
        a {
            color: #1d98dc;
            text-decoration: underline;

            .isPointer &:hover,
            .isTouch &:active {
                text-decoration: none;
            }
        }

        .note {
            margin-top: 8px;
        }
    }

    @keyframes rotating {
        from {
            -ms-transform: rotate(0deg);
            -moz-transform: rotate(0deg);
            -webkit-transform: rotate(0deg);
            -o-transform: rotate(0deg);
            transform: rotate(0deg);
        }
        to {
            -ms-transform: rotate(360deg);
            -moz-transform: rotate(360deg);
            -webkit-transform: rotate(360deg);
            -o-transform: rotate(360deg);
            transform: rotate(360deg);
        }
    }
}

/* Styling for the Swap button */
.transfer-button, .cancel-button, .get-button, .done-button {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 12px 0;
    gap: 8px;
    background-color: #0166FF;
    border-radius: 16px;
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;
    color: #FFFFFF;
    border-width: 0;

    position: absolute;
    width: 350px;
    height: 58px;
    left: calc(50% - 350px / 2);
    top: 403px;
    bottom: 51px;
}

/* Hover effect for the Swap button */
.transfer-button:hover {
    background-color: #357ABD; /* Darker blue on hover */
}

/* Disabled state styling for the Swap button */
.transfer-button:disabled {
    background-color: #cccccc; /* Noticeably gray */
    color: #666666; /* Dark gray text */
    cursor: not-allowed;
}

.notifications-area {
    width: 267px;
    left: calc(50% - 1392px/2);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh; /* Full height to center vertically */
    position: fixed;
    top: 0;
    overflow-y: auto; /* Allow scrolling if content overflows */
    z-index: 10;
}

.notification {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;

    background: #FFFFFF;
    border-radius: 16px;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;

    width: 100%;
    height: 44px;
    color: black;
    margin-bottom: 10px;
    text-align: center;

    /* Mainnet/Subtitle 3 (400) */
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
}

.notification div {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 10px 7px;
    gap: 4px;

    width: 100%;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;

    vertical-align: middle;
}

.notification-status-icon {
    /* icon/block_checkbox_on */
    width: 24px;
    height: 24px;

    /* Inside auto layout */
    flex: none;
    order: 0;
    flex-grow: 0;
}

@media only screen and (max-width:768px) {
    .BridgeProcessor {
        width: 100%;
        margin: 10px 0 4px 0;
    }
    .BridgeProcessor-transfer  {
        position: relative;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        width: 100%;
    }

    .notifications-area {
        position: relative;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        width: 100%;
        height: auto;
        margin-top: 19px;
    }
}
</style>
