# Throwing errors

One of the main differences between Puffle and Yukon is that Puffle is programmed in TypeScript. That means that we enjoy the benefits of type validation in compile-time.

In Yukon, many functions are not validated correctly, and it may be possible to produce undefined behavior at run-time. While precautions have been taken to avoid calling functions that require variables that are not defined at call time, this may not always be the case.

In some cases it is not possible to determine the best action to take or value to return in case of an undefined variable. In these cases, it is preferable to throw an error (or CustomError, in our case) and force the server to crash, rather than face an undefined behavior that may result in data corruption.

A perfect example is found inside the `src/classes/instance/card/ninja/Ninja.ts` file. Many of the functions in that file require variables that, at the time the function is called, may be undefined.