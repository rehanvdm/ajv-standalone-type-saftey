# TypeScript Type Safety with AJV Standalone

This is the code base for a blog post: https://www.rehanvdm.com/blog/typescript-type-safety-with-ajv-standalone

Have a read through the blog post to understand what is happening, you can use the commands in the `package.json`
to run the `app-basic` and `app-abstracted` examples. 

## Intro:

In this blog we start of by exploring what Type means in TypeScript and how to achieve type safety at runtime. Then a
quick comparison of the current tools to achieve this and deep dive into the implementation using the AJV Standalone
method.

>_**TL;DR** TypeScript does a great job at compile time type safety, but **we still need to do runtime checks** just like in JavaScript.
There are many packages and tools to help with this, we focused on AJV Standalone that outputs JS validation functions at compile time to
be used at runtime. **Going from TS Types to JSON Schema to JS functions** allows us to validate TS Types where the
other packages all work with classes and reflection._

... Read more here: https://www.rehanvdm.com/blog/typescript-type-safety-with-ajv-standalone
