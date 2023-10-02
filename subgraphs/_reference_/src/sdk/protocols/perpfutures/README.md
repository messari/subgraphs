# Perpetual SDK `1.1.7`

The perpetual SDK follows the `1.3.3` Derivatives Perpetual Futures schema.

## Setup

- Copy over the whole SDK folder into your subgraph `src`. You won't need any of the other protocols, so you can safely delete those.
- Run `graph codegen` to make sure every import resolves if you want your intelisense and import navigation to work.

That's it. To simplify setup we've tried to not make it depend on any contract calls. If it needed to make any, you would need to add the ABI of the given contract to your manifest and change the import paths wherever it is used in the library.

## How to use

You should probably forget about GraphQL entities altoghether if using this. Only exception being auxiliary entities, or a very specific usecase that the library doesn't support or gets in the way.

The library is initialized via a single constructor and a single import:

```typescript
import { SDK } from "./sdk/protocols/perpfutures";

const sdk = SDK.initialize(conf, pricer, tokenInit, event);

// ALSO accepts ethereum.Call
// const sdk = SDK.initialize(conf, pricer, tokenInit, call);
```

Where:

- `event`/`call` is the event/function being handled by the handler making use of the SDK.
- `conf` should be an implementation of `ProtocolConfigurer`. For convenience you can find an implementation that you can import directly at `./sdk/protocols/config`.
- `pricer` should be an implementation of `TokenPricer`, found at `./sdk/protocols/config`. It allows the library to automatically calculate prices internally. Implementing it yourself allows you to use any pricing source you'd need.
- `tokenInit` should be an implementation of `./sdk/protocols/perpfutures/tokens:TokenInitializer`. It is used to populate the `Token` entity for the first time, and was decided to require it to be implemented to avoid the library depending on ABIs and to give some flexibility in case we need to deal with non-compliant ERC20 tokens.

The SDK class exposes 5 classes for you to use:

- `sdk.Protocol`
- `sdk.Accounts`
- `sdk.Pools`
- `sdk.Position`
- `sdk.Tokens`
- `sdk.Pricer`

We'll see them in a second. But you should know that for this all to work properly you need to **always use these classes methods and never other constructors directly**.
