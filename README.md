# Puffle Server

**Puffle** is a next-gen [Yukon](https://github.com/wizguin/yukon-server/)-inspired "*any game*" private server.

> :warning: Puffle is under development and one or more features of Yukon may not yet be available.  
You can check the current status on the [Projects tab](https://github.com/orgs/puffle/projects/3).

## 🃏 Features

- **TypeScript**: Uses TypeScript instead of JavaScript, getting all the benefits of the language.
- **Validation**: Strong validation of all user input thanks to [ajv](https://ajv.js.org/).
- **Multi-threaded**: Each world/server runs in its own node.js process efficiently.
- ~~**Cache Manager**: Various ways of storing the cache (like [Redis](https://redis.io/)).~~ (**Not yet implemented**).
- **ORM**: Thanks to [Prisma](https://www.prisma.io/), it is possible to use several types of databases.
- **Fastify**: Uses the high-performance [Fastify](https://fastify.dev/) as a web server.
- **Configurable**: Highly configurable through the use of JSON-based config files.

## 🚀 Deploy

> :warning: This code has [breaking changes](docs/BREAKING_CHANGES.md) that make it incompatible with the Yukon client. A modified client can be found [here](https://github.com/puffle/client).

The easiest way to deploy is by using Docker!  
For your convenience, we have a repository with recommended Docker images and scripts to run a full copy of the client and server.  
[Jump to the Docker repository](https://github.com/puffle/docker)

## 🛠️ Develop

This repository has VSCode dev containers, making it possible to run the code effortlessly.

1. Install [Docker](https://www.docker.com/) and the [VSCode's Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.
3. Start the container and install the Node dependencies inside the container (`pnpm i`).

You may need to edit the configuration file (`config/config.json`) to make Fastify run on any interface.

## ⚙️ Configuration

When starting the server, an attempt will be made to automatically load the `config/config.json` file if no file path is explicitly defined in the command (e.g.: `pnpm http config/another-config.json`).  
All keys in the JSON file are optional, if a key is not found, the default value defined in the Config Manager will be used.

> If you want to use all default values, you can create an empty but **valid** JSON file with the following content: `{}`.  
> You can place that valid JSON on the default `config/config.json` file.

## 📝 Changelog

Read the [commits](../../commits) for a comprehensive list of changes.

## 👍 Acknowledgements

- [wizguin](https://github.com/wizguin/) - For creating Yukon and making this project possible.

## 📜 License

Licensed under [MIT License](LICENSE).
