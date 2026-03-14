export type FileInfo = {
    file_id: string;
    metadata: FileMetadata;
    url: string;
}

export type FileMetadata = {
    name: EncryptedValue;
    /**
     * Legacy property that contains an encrypted MD5 checksum.
     * Replaced by `checksums`.
     */
    checksum?: EncryptedValue;
    /**
     * Contains key/value pairs of the algorithm and an encrypted checksum.
     */
    checksums?: Record<string, EncryptedValue>;
    iv: string;
    size: number;
}

export type EncryptedValue = {
    value: string;
    iv: string;
}