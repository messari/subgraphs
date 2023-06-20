### URLs

- `hosted-service`: https://thegraph.com/hosted-service/subgraph/badger-finance/ebtc-goerli
- `decentralized-network`: https://testnet.thegraph.com/explorer/subgraphs/HgyK4pup4x75snqPrvTbbzeRsqPExHXmf2zRJPiXFjiU

### Goerli

- https://docs.chain.link/data-feeds/price-feeds/addresses#Goerli%20Testnet
- collEthCLFeed: `0xb4c4a493AB6356497713A78FFA6c60FB53517c63`
- ethBtcCLFeed: `0x779877A7B0D9E8603169DdbD7836e478b4624789`
- testMsig (account holder for decentralised subgraph studio): `0xfA87ce273f8C254F345Bc7de42F30e2d2FEe6779`

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
