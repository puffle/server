# Ratelimits

The server has a built-in ratelimit, capable of limiting connections in certain events. All limitations are set **per IP**.

> The use of ratelimits in Node.js is quite expensive, because they can use a lot of memory. If possible, it is recommended to use an external ratelimiter (load balancers, reverse proxies) that fulfill the same function.

To start using the ratelimiter, go to your configuration file and activate the ratelimiter.

Each connection is verified with a system of "points" and "durations". Each time a packet is received, one point will be consumed. If the number of available `points` reaches zero, all subsequent packets will be blocked. The number of available points is reset after the `duration` has elapsed.

Currently, there are two preconfigured ratelimiters: "connections" and "messages".

- `connections`: Sets the maximum number of connections per IP (`points`) to a game world in a given time (`duration`).
- `messages`: Sets the maximum number of messages per IP (`points`) to a game world in a given time (`duration`).