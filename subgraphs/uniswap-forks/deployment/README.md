## Version 1.0

## Deployment Instructions:
- Add/update configuraptions to the deployment/deploymentConfigurations.json file in order to add or update deployments.
    - Need to include template location for the protocol/network deployment and the deployment locations in the Hosted Service

```
# Deploys uniswap-v2 to mainnet in my hosted service.
npm run deploy uniswap-v2 mainnet steegecs

# Deploys uniswap-v2 to all networks in my hosted service.
npm run deploy uniswap-v2 steegecs

# Deploys protocols and networks in my hosted service.
npm run deploy steege
```