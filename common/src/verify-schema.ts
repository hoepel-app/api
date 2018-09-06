import * as Ajv from 'ajv';
import { schema } from 'types.hoepel.app/dist/schema';

export const verify = (schemaName: string, input) => {
  const ajv = new Ajv({ allErrors: true, schemaId: 'auto' });

  const deep = Object.assign(schema, schema.definitions[schemaName]);
  const valid = ajv.validate(deep, input);

  return {
    valid,
    errors: ajv.errors,
  }
};
