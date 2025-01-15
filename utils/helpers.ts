import IonWeb from 'ionweb'

const BN = IonWeb.utils.BN

export {
    toUnit,
    fromUnit,
    getNumber,
    getBool,
    decToHex,
    parseAddressFromDec,
    supportsLocalStorage,
}

function supportsLocalStorage(): boolean {
    try {
        return 'localStorage' in window && window['localStorage'] !== null
    } catch (e) {
        return false
    }
}

function toUnit(n: number): number {
    return n * 1e9 // todo: BN
}

export function toEther(n: number): typeof BN {
    const value = new BN(n);
    return value.mul(new BN(10).pow(new BN(18)));
}

function fromUnit(n: number): number {
    return n / 1e9 // todo: BN
}

export function fromEther(n: typeof BN): typeof BN {
    return n.div(new BN(10).pow(new BN(18)));
}

function getNumber(pair: Array<string>): number {
    return parseInt(pair[1], 16)
}

function getBool(pair: Array<string>): boolean {
    return getNumber(pair) === 1
}

function decToHex(dec: number): string {
    return '0x' + new IonWeb.utils.BN(dec).toString(16)
}

function parseAddressFromDec(data: any): string {
    return decToHex(data.number.number)
}
