# Serverless hoepel.app back-end

These Firebase functions power the back end of `hoepel.app`.

## Run functions locally

First, get the config:

```
firebase functions:config:get > .runtimeconfig.json
```

Then, serve using Firebase emulator:

```
firebase emulators:start --only functions
```

