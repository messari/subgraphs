## Wat dis?

This folder contains a library which abstracts the developer from most of the _schema related_ functionality. Ideally, building a subgraph should only consist on understading a protocol and translating certain events into actions and metrics. But the particularities of how this metrics are stored and how they relate to each other inside the schema can and should be abstracted away. Things like taking snapshots of entities every X amount of time, updating TVL every time there is a deposit/withdrawal, updating fees at _swap & pool & protocol & snapshot levels_, etc ... This library aims to do that.

When using this library, entities should not be updated directly, but always through the library unless absolutely needed. An exception to this is if you create your own auxiliary entity to aid on the handling of some events.

## How It's Organized

Pretty straightforward, `/protocols` and `/util`.

Because we are currently experimenting different approaches, each protocol type has a different schema, and AssemblyScript has some limitations when dealing with interfaces, so far, each protocol type has its own implementation. They all live in their respective folders under `/protocols`, and have very little shared code.

`/util` contains all these common functions and constants we use over and over.

## Setting it up

It would be ideal to have the library to get setup automatically with the messari-cli, in a similar way as we do to generate versions. We might eventually get there, but so far it consists on a manual copy process.

Refer to each protocol type readme, since requirements might vary:

- [Bridges](./protocols/bridge/README.md)
- [Lending](./protocols/lending/README.md)
- DEX
- Yield
