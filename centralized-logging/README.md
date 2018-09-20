# Centralized logging

Assumes existing log shipping function on Lambda (DataDog in this case).

## Permission for log shipper

```
$ aws lambda add-permission --function-name DataDogLogShipper --action lambda:InvokeFunction --principal logs.eu-west-3.amazonaws.com --statement-id sid0
$ aws lambda add-permission --function-name DataDogLogShipper --action lambda:InvokeAsync --principal logs.eu-west-3.amazonaws.com --statement-id sid1
```

## Updating log groups

1. open the `process_all.js` script, and fill in the missing configuration values

2. run `node process_all.js`

