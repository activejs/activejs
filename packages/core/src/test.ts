// This file is required by karma.conf.js and loads recursively all the .spec and framework files

type Require = {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// Then we find all the tests.
// @ts-ignore
const context = ((require as any) as Require).context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
