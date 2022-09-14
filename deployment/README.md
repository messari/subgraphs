# Deployment Instructions:

## Deploys uniswap-v2 to ethereum in steegecs hosted service.

npm run build --ID=uniswap-v2-ethereum --TARGET=steegecs --SERVICE=h --DEPLOY=(true/t)

**For deployments to Cronos network access token required:**

npm run build --ID=vvs-finance-ethereum --TARGET=steegecs --SERVICE=c --ACCESS='access_token' --DEPLOY=(true/t)

## Builds uniswap-v2 for ethereum

npm run build --ID=uniswap-v2-ethereum

## Ommission of --NETWORK for any of these operations will deploy/check/build the protocol for all specified networks in deployment.json

npm run build --ID=uniswap-v2 --SPAN=protocol --TARGET=steegecs --SERVICE=h --DEPLOY=(true/t)
npm run build --ID=uniswap-v2 --SPAN=protocol

- --PRINTLOGS
  - T/F/null - Set PRINTLOGS to 't' or 'true' to print all logs to the console instead of just to results.txt
- --MERGE
  - T/F/null - Specifies whether this deployment is triggered by a merge. Should only be set to merge in the deployment action unless for testing.
- --ACCESS
  - Specify the access token for deploying to a particular service. If not specified, deployment with occur for the current access location.
  - This is a required parameter when deploying to CRONOS chain.
- --SLUG

  - Specify slug optionally on deployments to a single network to use an alternative deployment location than is specified in the deployment.json

- This works by taking the inputs from `npm run build` and using them to configure the subgraph.yaml, and optionally, configurations/configure.ts with a particulalar set of constants, and subsequently deploying to the specified hosted service account.

## How CI/CD deployment works:

- The CI/CD deployment scripts and actions allow you to deploy, build, or check the readyness for deployment of multiple subgraphs at a time.
- A response telling you if any information is missing or misplaced in the deployment.json, or if you specified invalid parameters or combinations in the script will be given. Errors will occur if your file structure does not conform to the standard -- See uniswap-forks as an example
- --DEPLOY=false/f/"" executes a clean build by first removing generated, build, subgraph.yaml, and configure.ts files and folders.
- --DEPLOY=true/t command excutes the same step as `build`, but it goes all the way to deployment.
