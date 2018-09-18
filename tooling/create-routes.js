#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const _ = require('lodash');
const Permission = require('types.hoepel.app/dist/src/permission').Permission;
const rimraf = require('rimraf');


// Converts routes like 'child/{id}/attendances' to 'child/:id/attendances'
const serverlessPathParamToRouteParam = (path) => {
  return path.replace(/(\{[a-zA-Z]*\})/g, (value) => ':' + value.slice(1, -1))
};


const allServiceYmlFiles = fs.readdirSync('../services').map(dir => `../services/${dir}/serverless.yml`);

const allServiceYmlFilesExistance = allServiceYmlFiles.map(file => [ fs.existsSync(file), file ] );

allServiceYmlFilesExistance.forEach(arr => {
  if (!arr[0]) {
    console.warn(`${arr[1]} does not exist!`);
  }
});


const outputFiles = allServiceYmlFiles.map( fileLocation => {
  const fileContents = fs.readFileSync(fileLocation, 'utf-8');
  const doc = yaml.safeLoad(fileContents);

  const basePath = doc.custom.customDomain.basePath;
  const functions = Object.entries(doc.functions); 

  const allRoutesForFunctions = _.flatten(functions.map(fn => {
    const functionName = fn[0];

    if (!fn[1].events) {
      return;
    }


    // Warn on events that have an authorizer but no 'permissionNeeded' field
    fn[1].events
      .filter(event => event.http && event.http.authorizer && !event.http.authorizer.permissionNeeded)
      .forEach(event => console.warn(`${fileLocation}: Function ${functionName} has authorizer but is missing 'permissionNeeded' field`))

    const eventsWithPermissions = fn[1].events.filter(event => event.http && event.http.authorizer && event.http.authorizer.permissionNeeded); 
    
    const routes = eventsWithPermissions.map(event => event.http).map(event => {
      if (!Permission.parsePermissionName(event.authorizer.permissionNeeded)) {
        console.warn(`Could not parse permission '${event.authorizer.permissionNeeded}', probably invalid permission name`);
      }

      return `{ path: '/${basePath +  serverlessPathParamToRouteParam(event.path)}', method: '${event.method.toUpperCase()}', permissionNeeded: Permission.parsePermissionName('${event.authorizer.permissionNeeded}') }`
    });

    return routes;
  }).filter(x => x));


  // Generate routes file
  const outputFile = `
//
// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT
//

import { Routes } from '../route.types';
import { Permission } from 'types.hoepel.app/dist/src/permission';

export const routes: Routes = [
${allRoutesForFunctions.map(x => '  ' + x + "\n")}
];`;


  const outputFileName = basePath + '.routes.ts';
  const importName = basePath.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }) + 'Routes';

  // Output the file name, the contents of the file, and the name the import should be renamed to when importing this file
  return [ outputFileName, outputFile, importName ];

});

// Delete old output
rimraf.sync('./output');
fs.mkdirSync('./output');

// Write files to output directory
outputFiles.forEach(file => {
  const fileName = file[0];
  const contents = file[1];
  fs.writeFileSync('./output/' + fileName, contents);
});


// Generate all-routes.ts
console.log('//\n// THIS FILE WAS AUTO-GENERATED - DO NOT EDIT\n//\n\n')
console.log(`import { Routes } from './route.types';\n`);
outputFiles.forEach(file => console.log(`import { routes as ${file[2]} } from './routes/${file[0].slice(0, -3)}'`));
console.log('\n');
console.log('export const allRoutes: Routes = [');
outputFiles.forEach(file => console.log('  ...' + file[2] + ','));
console.log('];\n\n');


