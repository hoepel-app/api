#!/bin/bash

CURRENT_DIR=$(pwd)

for DIR in */; do
  cd $DIR/;
  echo ">> WORKING IN $DIR";
  sls deploy --stage=prod;
  echo -e "\n\n\n";
  cd $CURRENT_DIR;
done;

