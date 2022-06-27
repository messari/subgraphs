# Aave V2 Forks

## Quickstart

### Deployment

Once everything is setup properly deploying is very easy.

```bash
# This example will deploy rari-fuse on all networks to the hosted service under "dmelotik" in deploymentConfigurations.json
npm run deploy --SUBGRAPH=aave-v2-forks --PROTOCOL=aave-v2 --LOCATION=dmelotik

# This will do the same, but only deploying the mainnet subgraph
npm run deploy --SUBGRAPH=aave-v2-forks --PROTOCOL=aave-v2 --NETWORK=mainnet --LOCATION=dmelotik
```

> Setting `deploy-on-merge` to `true` in [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json) will run the above commands on subgraphs that have changed to messari's hosted service.

### Development Commands

During development you probably won't want to fully deploy the subgraph every time. Follow this guide to do each step incrementally.

To setup the subgraph manifest from the template:

```bash
# Use rari fuse as an example
npm run prepare:yaml --PROTOCOL=aave-v2 --NETWORK=mainnet --TEMPLATE=aave.v2.template.yaml
```

To codegen and build:

```bash
graph codegen
graph build
```

> If you are working on multiple subgraphs you may want to delete `./generated/**` before `codegen` so no old files are left behind.

To deploy follow the steps above. You may put your hosted service endpoint in [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json) just how messari's is set to take advantage of the commands.

### Resources

- Aave V2 Contract Addresses: https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts
- Aave V2 Permissioned Contract Addresses: https://aave-arc.gitbook.io/docs/deployed-contracts/arc
- Gesit Contract Addresses: https://docs.geist.finance/useful-info/deployments-addresses
