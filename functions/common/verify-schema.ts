import * as Ajv from 'ajv';
import * as fs from 'fs';
//import * as schema from "../../docs.hoepel.app/schema.json"

const schema = JSON.parse(fs.readFileSync('docs.hoepel.app/schema.json').toString());

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
