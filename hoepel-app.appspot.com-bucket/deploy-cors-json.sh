#!/bin/bash

echo "Deploying cors.json..."
echo "Details: https://firebase.google.com/docs/storage/web/download-files#cors_configuration"

gsutil cors set cors.json gs://hoepel-app.appspot.com
