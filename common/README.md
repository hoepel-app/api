# Serverless back-end for hoepel.app

## Adding a new route

1. Implement it in `common/functions/something.ts`
1. Create a service in `services/` or use existing services
1. Add route to `services/my-service/serverless.yml`
1. Use `tooling/create-routes.js` to regenerate routes and copy them to `common/` project
1. Build `common`
1. Build your service and deploy! (Don't forget to update the common project used by the service - `npm link` is great for development)


