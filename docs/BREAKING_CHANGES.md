## 🧩 Breaking changes

This server was designed with the idea of being as compatible as possible with Yukon, however, there are some design differences that make it incompatible with the current client.

- The login uses HTTP instead of WebSockets.
- The default user rank is zero (number one is now a moderator rank).
- The database schema is a bit different.
- Some game events have been modified, deleted or merged.
- The configuration file (config.json) is different and has different options.
- Prisma ORM does not support database triggers, so these are not included by default.

Changes to the client were required to make it compatible with these features. The modified client can be found [here](https://github.com/puffle/client).
