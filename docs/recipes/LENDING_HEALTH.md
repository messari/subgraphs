# Recipe: a wallet's health factor across lending subgraphs

The lending schema is the same across Aave, Compound, Spark and the other
lending protocols in this repository, so one query and one reduction give a
wallet's health on every deployment. This recipe walks through that, and
through the two places consumers most often get it wrong.

## The query

Nothing in it names a protocol. Send it to each deployment's endpoint with
the account id lowercased.

```graphql
query WalletPositions($account: ID!, $first: Int!) {
  account(id: $account) {
    positions(where: { balance_gt: "0" }, first: $first) {
      side
      balance
      market {
        id
        name
        liquidationThreshold
        maximumLTV
        inputTokenPriceUSD
        inputToken { id symbol decimals }
        rates(where: { side_in: [LENDER, BORROWER] }) { side type rate }
      }
    }
  }
  _meta { block { number } }
}
```

`side` is `LENDER` or `COLLATERAL` for a supplied balance (older deployments
use `LENDER`, newer ones `COLLATERAL`), and `BORROWER` for a borrowed one.
Treat the first two the same.

## Two traps

**Percentages, not ratios.** By the [naming conventions](../SCHEMA.md#naming-conventions),
`liquidationThreshold`, `maximumLTV`, `liquidationPenalty` and every `rate`
are percentages: a threshold of `82.5` means 0.825, a rate of `5.8` means
5.8% a year. Dividing by 100 is the single most common way to get a
liquidation price wrong by a factor of a hundred, in either direction. A
guard that survives both kinds of deployment:

```ts
// A value above 1 is a percentage; a value at or below 1 is already a ratio.
const ratio = (v: string) => { const n = parseFloat(v); return n > 1 ? n / 100 : n; };
```

**Balances are base units.** `balance` is a `BigInt` string in the token's
own decimals. Divide by `10 ** inputToken.decimals` before multiplying by
`inputTokenPriceUSD`, which is already in USD.

## The reduction

Fold a wallet's positions on one deployment into four numbers, splitting
each side by whether the token is the one whose price you are studying (call
it the charted asset, ETH below) or something else held constant:

| Symbol | Meaning | From |
|---|---|---|
| `a` | charted collateral × its threshold, in units of the asset | supplied legs in ETH: `balance / 10^dec × ratio(liquidationThreshold)` |
| `c` | other collateral × threshold, in USD | supplied legs not in ETH: `balance / 10^dec × inputTokenPriceUSD × ratio(liquidationThreshold)` |
| `u` | charted debt, in units of the asset | borrowed legs in ETH: `balance / 10^dec` |
| `v` | other debt, in USD | borrowed legs not in ETH: `balance / 10^dec × inputTokenPriceUSD` |

Then the health factor at any price `P` of the charted asset is

```
HF(P) = (a·P + c) / (u·P + v)
```

and the liquidation price on the crash side, where `HF = 1`, is
`(v − c) / (a − u)` for a wallet that is net long the asset (`a > u`). Health
today is `HF(spot)`; the wallet's health across deployments is the minimum
over them, and the deployment that attains the minimum is the one that
liquidates first.

A staking receipt (wstETH, weETH, rsETH and the like) tracks the charted
asset; counting it as "other collateral" turns a leveraged staking loop into
a phantom short. Count it as the charted asset at its own price relative to
spot: `balance / 10^dec × inputTokenPriceUSD / spot`.

## A check worth keeping

A position that is open on-chain but has `HF < 1` at spot by these
thresholds is being held up by something the schema does not carry, most
often a protocol's efficiency mode (e-mode) with its own higher threshold.
Do not draw it as liquidated; set it aside and say why.

Worked example, seven deployments, one address, in the open-source
survey map [Scree](https://github.com/Mithran-MV/scree): the reducer is
`src/graph/reduce.ts`, the normaliser with the percentage guard is
`src/graph/normalize.ts`.
