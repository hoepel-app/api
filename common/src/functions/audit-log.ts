import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { ResponseBuilder } from '../response-builder';
import { SqsEvent } from '../sqs-event';
import { tryParseJson } from '../try-parse-json';
import { verify } from '../verify-schema';
import { AuditLogService } from '../services/audit-log-service';

const auditLogService = new AuditLogService();
const responseBuilder = new ResponseBuilder();

export const getLogs: Handler = (event: APIGatewayEvent, context: Context, cb: Callback) => {
    // Take query string offset and count into account, perhaps also filtering
};

export const handleIncomingLog: Handler = async (event: SqsEvent) => {
    event.Records.map(record => {
       const entry = tryParseJson(record.body);

       if (!entry) {
           console.error('Could not parse JSON body. Offending data: ', record.body);
           return;
       }

       if (!verify('IAuditLogEntry', entry)) {
          console.error('Could not verify incoming data to IAuditLogEntry schema. Offending data:', JSON.stringify(entry));
          return;
       }

       // Persist entry
        auditLogService.persistLog(entry).catch(err => console.error('Error while persisting log entry:', err));
    });

    // TODO seems like messages don't get deleted? Or perhaps they were badly formatted?
    return responseBuilder.ok();
};
