declare class FileInfo {
    file_id: string;
    metadata: FileMetadata;
    url: string;
}

declare class FileMetadata {
    name: EncryptedValue;
    checksum: EncryptedValue;
    iv: string;
    size: number;
}

declare class EncryptedValue {
    value: string;
    iv: string;
}