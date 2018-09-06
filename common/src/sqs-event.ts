export interface SqsMessage {
    readonly messageId: string; // UUID
    readonly receiptHandle: string;
    readonly body: string; // What we want most of all - still need to parse this
    readonly attributes: ReadonlyArray<any>;
    readonly messageAttributes: any;
    readonly md5OfBody: string;
    readonly eventSource: string; // e.g. 'aws:sqs'
    readonly eventSourceARN: string;
    readonly awsRegion: string;
}

export interface SqsEvent {
    readonly Records: ReadonlyArray<SqsMessage>;
}
