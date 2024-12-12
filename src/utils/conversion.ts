export function bnToUint8Array(bn: bigint, array: Uint8Array) {
    const maxSizeForArray = (1n << BigInt(array.length * 8)) - 1n
    if (bn > maxSizeForArray) {
        throw Error(`bigint doesn't fit in array of length ${array.length}`)
    }
    for (let i = array.length - 1, shift = 0n; i >= 0; i--, shift += 8n) {
        array[i] = Number((bn >> shift) & 0xffn)
    }
}

export function bufToBn(buf: ArrayBuffer): bigint {
    const view = new DataView(buf)
    const length = view.byteLength
    if (length == 0) {
        return 0n;
    }

    let res = 0n
    let byteOffset = 0

    do {
        const remaining = (length - byteOffset)
        if (remaining % 8) {
            res += BigInt(view.getUint8(byteOffset)) << BigInt((remaining - 1) * 8)
            byteOffset++
        } else {
            res += view.getBigUint64(byteOffset) << BigInt((remaining - 8) * 8)
            byteOffset += 8
        }
    } while (byteOffset < length)

    return res
}