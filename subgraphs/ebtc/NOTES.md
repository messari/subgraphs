### Goerli

- https://docs.chain.link/data-feeds/price-feeds/addresses#Goerli%20Testnet
- collEthCLFeed: `0xb4c4a493AB6356497713A78FFA6c60FB53517c63`
- ethBtcCLFeed: `0x779877A7B0D9E8603169DdbD7836e478b4624789`

### CLI Commands

```
graph auth --product subgraph-studio ***
messari b -l -s subgraph-studio ebtc -r ebtc-goerli -v 0.0.0 -d
```

```
graph auth --product hosted-service ***
messari b -l -s hosted-service ebtc -r badger-finance -d
```

**NOTE: Omit the `-d` for a dry run without deployment**

### Test GQL Queries

`PriceFeed`:

```
{
  tokens(first: 5) {
    id
    name
    symbol
    decimals
    lastPriceUSD
    lastPriceBlockNumber
  }
}
```
