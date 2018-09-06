import * as uuid from 'uuid';
import { IAuditLogEntry } from 'types.hoepel.app/dist/src/audit-log';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export class AuditLogService {
    constructor(private readonly dynamodb = new DocumentClient()) {}

    persistLog(auditLogEntry: IAuditLogEntry): Promise<any> {
        const params = {
            TableName: process.env.DYNAMODB_TABLE,
            Item: {
                id: uuid.v4(),

                tenantId: auditLogEntry.triggeredBy.tenantId,
                timestamp: auditLogEntry.timestamp,

                entry: auditLogEntry,
            },
        };

        return this.dynamodb.put(params).promise();
    }

    getLogs() {
        throw new Error('Not implemented yet');
    }
}
