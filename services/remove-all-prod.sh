#!/bin/bash

CURRENT_DIR=$(pwd)

for DIR in */; do
  cd $DIR/;
  echo ">> WORKING IN $DIR";
  sls remove --stage=prod;
  echo -e "\n\n\n";
  cd $CURRENT_DIR;
done;

