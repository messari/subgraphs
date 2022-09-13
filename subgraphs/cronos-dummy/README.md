# Cronos Dummy

## About

Literally just a subgraph to track the head of the cronos network. That's it.

## Quickstart

### Setup

Setting up a new subgraph will require mimicing what is done currently.

- Under `./protocols` will be the fork in a new folder
- Any protocol-specific mappings will live in `./protocols/$(protocol)/src`
- Setup a config folder in `./protocols/$(protocol)/config` for the supported networks and the manifest template

### Deployment

To deploy to the [cronos portal](https://portal.cronoslabs.com/) follow these steps:

```bash
npm run prepare:yaml --PROTOCOL=cronos-dummy --NETWORK=cronos --TEMPLATE=cronos.dummy.template.yaml
```

To codegen and build:

```bash
graph codegen
graph build
```

To deploy to cronos portal:

```bash
graph deploy messari/dummy --access-token=[REDACTED] --node https://portal-api.cronoslabs.com/deploy --ipfs https://api.thegraph.com/ipfs
```
