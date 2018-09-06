#!/bin/bash

METHOD=$1
URL=$2

REFERENCE=https://api.speelplein.cloud/api/v1
COMPARE_TO=https://api.hoepel.org

echo "$METHOD $REFERENCE$URL"

curl -X $METHOD "$REFERENCE$URL?tenant=despeelberg" -H "Authorization: Bearer $TOKEN"

echo -e "\n\n\n\n\n"

echo "$METHOD $COMPARE_TO$URL"

curl -X $METHOD "$COMPARE_TO$URL?tenant=despeelberg" -H "Authorization: Bearer $TOKEN"

