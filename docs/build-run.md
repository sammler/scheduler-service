<!-- Build & Run -->

Run the development environment:

```sh
$ npm run dc-up:dev

# Just a shortcut for 
# $ docker-compose f=./docker-compose.dev.yml run
```

Run the development environment (+ enforce rebuilding):

```sh
$ npm run dc-up:devb
```

**Hint:** The development environment relies on some basic services defined in [sammler-base](https://github.com/sammler/sammler-base)