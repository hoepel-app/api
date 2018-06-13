import * as Ajv from 'ajv';
import * as schema from "../../docs.hoepel.app/schema.json"


export const verify = (schemaName: string, input) => {
  const ajv = new Ajv({ allErrors: true });

  ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

  const deep = Object.assign(schema, schema.definitions[schemaName]);
  const valid = ajv.validate(deep, input);

  return {
    valid,
    errors: ajv.errors,
  }
};
