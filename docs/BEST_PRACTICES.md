## Promises with [Prisma](https://www.prisma.io)

Prisma uses its own type of promises called "PrismaPromise". These promises are Lazy Promises ([example](https://github.com/sindresorhus/p-lazy)).  
This means that all functions accessing the database must be [awaited](https://www.prisma.io/docs/concepts/components/prisma-client#3-use-prisma-client-to-send-queries-to-your-database), regardless of whether the result of that promise will be used or not ([ref](https://github.com/prisma/docs/issues/800)).

As a *workaround*, wrapper functions can be used to "convert" PrismaPromises into standard Promises ([example](https://github.com/puffle/server/blob/8bd358d0510377212ab4b54042c4a090cd82fb40/src/classes/user.ts#L122)).

To prevent possible race conditions, it is a good idea to await all database accesses, or use [specific libraries](https://www.npmjs.com/package/async-mutex) to implement mutexes or semaphores in JavaScript.
