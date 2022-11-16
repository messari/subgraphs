# Cronos Dummy

## About

Literally just a subgraph to track the head of the cronos network. That's it.

## Quickstart

### Setup

Setting up a new subgraph will require mimicing what is done currently.

- Under `./protocols` will be the fork in a new folder
- Any protocol-specific mappings will live in `./protocols/$(protocol)/src`
- Setup a config folder in `./protocols/$(protocol)/config` for the supported networks and the manifest template
