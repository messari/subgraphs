# Uniswap v2 Subgraph

> This is a reference subgraph used to demonstrate some of the common patterns  
> you should use in your subgraph. It should help you bootstrap your subgraph  
> quickly, improve the readability and maintainability of your code, and  
> provide some common functions/modules that you can leverage. Specifically,  
> here are some guidelines:
>
> - Make sure you include this README (but without this section) in the  
>   subgraph, with links to protocol-related resource and build instruction.
> - Note that after you init the subgraph with `graph init`, it would create  
>   another git repo inside of the existing one. You should remove that with  
>   `rm -rf .git` and not check it in as a submodule.
> - Make sure you run `npm run format` to format your code before committing.
> - Try to follow the same folder structure inside of `src` for your subgraph.
> - There is a set of useful functions in `src/common` that you can leverage.
>  
> Note: this subgraph is just a reference is not meant to be built and deployed  
> Note: since Uniswap v2 is a DEX (AMM), the `schema.graphql` used here is  
> derived from `schema-dex-amm.graphql` in the repo root.

## Links

- Protocol: https://uniswap.org/
- Analytics: https://v2.info.uniswap.org/
- Docs: https://docs.uniswap.org/protocol/V2/introduction
- Smart contracts: https://github.com/Uniswap/v2-core
- Deployed addresses: https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory
- Official subgraph: https://github.com/Uniswap/v2-subgraph

## Build

- Initialize subgraph (Subgraph Studio):
  ```
  graph init --product subgraph-studio
  --from-contract <CONTRACT_ADDRESS> [--network <ETHEREUM_NETWORK>] [--abi <FILE>] <SUBGRAPH_SLUG> [<DIRECTORY>]
  ```
- Initialize subgraph (Hosted Service):
  ```
  graph init --product hosted-service --from-contract <CONTRACT_ADDRESS> <GITHUB_USER>/<SUBGRAPH_NAME>[<DIRECTORY>]
  ```
- Generate code from manifest and schema: `graph codegen`
- Build subgraph: `graph build`

## Deploy

- Authenticate (just once): `graph auth --product hosted-service <ACCESS_TOKEN>`
- Deploy to Subgraph Studio: `graph deploy --studio <SUBGRAPH_NAME>`
- Deploy to Hosted Service: `graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>`
