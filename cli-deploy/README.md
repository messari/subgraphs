# CLI Tool for Deployments

A cli helper to make deploying subgraphs even easier.

## Installation


## Design flow

1. Run `deploy`
2. Asks what you want to deploy? Options:
   1. Forks
   2. Protocol
3. You will choose what forked protocols you want to deploy, all the way down to which network you want.
4. If an access token is needed it will prompt for it.
5. Before deploying it will confirm that you want to deploy all of these subgraphs.
   1. To be extra careful, when deploying to production subgraphs to `messari`'s hosted service there will be a red warning to ensure you are doing what you want to do.
6. If not it will then use @steegecs deployment scripts to deploy the subgraphs.
