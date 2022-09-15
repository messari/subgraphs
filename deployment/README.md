# Deployment Instructions:

## Usage:

**Build a single deployment ID:**

`npm run build --ID=uniswap-v2-ethereum`
`npm run build --ID=uniswap-v2-ethereum --SPAN=single`

**Build all deployments for a protocol:**

`npm run build --ID=uniswap-v2 --SPAN=protocol`

**Build all deployments within a directory:**

`npm run build --ID=uniswap-v2 --SPAN=base`

**Deploy a single deployment ID to Hosted Service:**

`npm run build --ID=uniswap-v2-ethereum --SERVICE=h --TARGET=steegecs --DEPLOY=t`

**Deploy a single deployment ID to Subgraph Studio:**

`npm run build --ID=compound-v2-ethereum --SERVICE=s --TARGET=steegecs --DEPLOY=t`

**Deploy a single deployment ID to Cronos Portal:**

`npm run build --ID=vvs-finance --SERVICE=c --TARGET=steegecs --TOKEN={token} --DEPLOY=t`

**Deploy a single deployment ID to Hosted Service using a different slug than specified in JSON:**

`npm run build --ID=uniswap-v2-ethereum --SLUG=uniswap-v2-ethereum-other --SERVICE=h --TARGET=steegecs --DEPLOY=t`

**Deploy all deployments for a protocol:**

`npm run build --ID=apeswap --SPAN=protocol --SERVICE=h --TARGET=steegecs --DEPLOY=t`

**Deploy all deployments within a directory:**

`npm run build --ID=uniswap-fork --SPAN=base --SERVICE=h --TARGET=steegecs --DEPLOY=t`



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

# How CI/CD deployment works:

- The CI/CD deployment scripts and actions allow you to build and deploy a single or multiple subgraphs at a time.
- You will get errors if the directory you try to deploy from does not comform to the standard directory structure (i.e. uniswap-forks).
- Before each build or deploy, the script will validate the deployment.json, so incorrect or missing information will cause the script to fail, and a response will be given.
- You must include the deployment you are trying to make within the deployment.json file. Go ahead and follow the current structure and include all fields in the other examples - further instructions on the deployment.json schema will soon be available.
- Upon creation of a pull request to the `master` branch, or any changes thereof, will trigger a github action will run the `npm run build` command, which will build all protocols that have had changes to their code base.
