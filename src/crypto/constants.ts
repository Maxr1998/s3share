export const AES_BLOCK_SIZE = 16 // AES default block size
export const IV_LENGTH = AES_BLOCK_SIZE
export const IV_SIZE = 8 // actual IV size (8 bytes) for AES-CTR without the counter
export const COUNTER_BITS = 64 // half of the IV / AES block size