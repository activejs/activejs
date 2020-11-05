<p align="center">
    <a href="https://activejs.dev">
        <img width="700px" src="https://raw.githubusercontent.com/activejs/static/master/AJS%20Logo%20Full%20-%20Banner.svg"/>
    </a>
    <br/>
    <b>Pragmatic, Reactive State Management for JavaScript Apps</b><br><br>
    <a aria-label="MIT license" href="https://github.com/activejs/activejs/blob/master/LICENSE">
        <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=0169FF&labelColor=000">
    </a>
    <a aria-label="npm version" href="https://www.npmjs.com/package/@activejs/core">
        <img src="https://img.shields.io/npm/v/@activejs/core?style=flat-square&color=0169FF&labelColor=000">
    </a>
    <a aria-label="Discord chat" href="https://discord.gg/M8r9gcEDR6">
        <img src="https://img.shields.io/badge/chat-discord-blue.svg?style=flat-square&color=0169FF&labelColor=000">
    </a>
    <a aria-label="PRs welcome" href="http://makeapullrequest.com">
        <img src="https://img.shields.io/badge/PRs-welcome-blue.svg?style=flat-square&color=0169FF&labelColor=000">
    </a>
</p>

```shell script
npm i @activejs/core
```

### 🚀 [Get Started](https://docs.activejs.dev/intro/getting-started)

### 📖 [Documentation](https://docs.activejs.dev)

### 🤾 [Playground](https://activejs.dev/#/playground)

### 📑 [TodoMVC Example](https://activejs.dev/#/examples/todomvc)

### ⚡ Quick Example

This is how an implementation of a simple **counter** looks like, using a
[NumUnit](https://docs.activejs.dev/fundamentals/units/numunit), one of
the reactive data structures that ActiveJS provides. The NumUnit stores
and provides a `number` value at all times ensuring the **type-safety**.

```typescript
// initialize a reactive data structure to store numbers
const counter = new NumUnit(); // with default initial-value 0

// two pure functions to produce an appropriate new value
const increment = value => value + 1;
const decrement = value => value - 1;

// subscribe for reactive value access, and log the value
counter.subscribe(value => console.log(value));
// immediately logs 0, and will log any future values

// increment
counter.dispatch(increment); // you'll see 1 in the console
// the pure function is called with the current value and
// the returned value is dispatched automatically

// decrement
counter.dispatch(decrement); // you'll see 0 in the console
// that's it our counter is complete

// you can also access the value directly
console.log(counter.value()); // logs 0
```

### 📊 Quick Comparisons

<p align="center">
    <b>A simple "counter" implemented in Redux vs ActiveJS.</b><br/><br/>
    <img width="680px" src="https://raw.githubusercontent.com/activejs/static/master/Redux%20vs%20ActiveJS.png"/>
    <br/><br/>
    <b>A simple "counter" implemented in NgRx vs ActiveJS.</b><br/><br/>
    <img width="680px" src="https://raw.githubusercontent.com/activejs/static/master/NgRx%20vs%20ActiveJS.png">
</p>

### 🤝 Contributing

We welcome all contributions, whether you're reporting an issue, helping us fix bugs,
improve the docs, or spread the word. We also welcome your suggestions and feedback.

### ⚖ Licence

[MIT](https://github.com/activejs/activejs/blob/master/LICENSE)

### 💻 Author

[Ankit Singh](https://twitter.com/AlionBalyan)
