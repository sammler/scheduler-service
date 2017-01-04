<!-- Configuration -->

The following environment variables need to be defined for running the service:

- `SAMMLER_RABBITMQ_URI`
- `SAMMLER_JOBS_SERVICE_URI`
- `SAMMLER_LOG_SERVICE_URI`

## Build & Run

Run the development environment:

```sh
$ yarn run dc-dev-up

# Just a shortcut for 
# $ docker-compose f=./docker-compose.dev.yml run --build
```
