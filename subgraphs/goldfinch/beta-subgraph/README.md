# beta-subgraph

This subdirectory contains info related to provisioning and deploying a version of our subgraph on AWS ECS, using the [Docker Compose integration with ECS](https://docs.docker.com/cloud/ecs-integration/). We call this the "beta" subgraph as it's intended to support the https://beta.app.goldfinch.finance app. This subgraph is configured to index from the Tenderly fork whose RPC url is defined in `.env.beta-subgraph`.

## ECS provisioning

### Creating an ECS cluster

From the `packages/subgraph` dir:

1. If this is your first time deploying to ECS, you'll need to create a Docker context for use with ECS. To do this, you will first need to have configured an AWS CLI profile. Then:
  ```
  docker context create ecs myecscontext
  ```
2. Once you have an ECS context, use it via:
  ```
  docker context use myecscontext
  ```
  - If you skipped step 1 because you already had an ECS context, you can see the names of the Docker contexts you already have via `docker context ls`.
3. Spin up the cluster:
  ```
  docker compose --env-file beta-subgraph/.env.beta-subgraph up
  ```
  - **NOTE:** By default, the deployed cluster will be ***open to all IP addresses*** on the internet, on ***all ports exposed*** by the Docker containers defined in `docker-compose.yml`. If you care about more security than this -- which we would if we were running this as a production service -- we'd want to use [overlays](https://docs.docker.com/cloud/ecs-integration/#tuning-the-cloudformation-template) in our `docker-compose.yml` file to configure the rules of the security groups created by AWS CloudFormation.
4. To enable the beta frontend to use `https://beta.subgraph.goldfinch.finance` for communicating with the graph-node's GraphQL endpoint, perform the following steps:
  1. Issue an SSL certificate in AWS Certificate Manager for `beta.subgraph.goldfinch.finance`.
  2. Add a Listener to the Network Load Balancer that was created as part of spinning up the cluster, with the following configuration:
    - Protocol: TLS
    - Port: 443
    - Default action: Forward to ( the Target Group corresponding to the graph-node's port 8000 )
      - To identify which Target Group corresponds to the graph-node's port 8000, see the load balancer's existing TCP:8000 listener.
  3. Add a CNAME record to `goldfinch.finance`'s DNS records, mapping host `beta.subgraph.goldfinch.finance` to the DNS name of the load balancer (e.g. `subgr-LoadB-DUDQKWD7I4P6-34481d98d3426d4c.elb.us-east-1.amazonaws.com`).

### Deploying to an ECS cluster

1. You can update an existing cluster with the same command used for creating the cluster:
  ```
  docker compose --env-file beta-subgraph/.env.beta-subgraph up
  ```

### Destroying an ECS cluster

To take down a cluster, from the `packages/subgraph` dir:

1. Use your ECS context:
  ```
  docker context use myecscontext
  ```
2. Destroy the cluster:
  ```
  docker compose --env-file beta-subgraph/.env.beta-subgraph down
  ```
3. Delete the CNAME record for `beta.subgraph.goldfinch.finance` from `goldfinch.finance`'s DNS records. (This is ideal; though I suspect AWS's load balancers do not reuse DNS names as they seem to contain some randomness/uniquely-identifyingness.)

NOTE: Taking down a cluster does NOT automatically destroy its volumes (cf. https://docs.docker.com/cloud/ecs-integration/#volumes)! To destroy the cluster's volumes, so that the next time you bring up the cluster it does not retain any of the old cluster's data, you must destroy the volumes too:

- List the volumes on ECS using `docker volume ls`, then run `docker volume rm $FILESYSTEM_ID` where `$FILESYSTEM_ID` is the id of the Elastic File System used as the Docker volume.

## Creating the subgraph on ECS

1. Ensure that `all_dev.json` in `packages/protocol/deployments` corresponds to the chain the subgraph will be indexing. For example, if the subgraph is going to index the Murmuration chain, then this `all_dev.json` file should be extracted from the Murmuration instance. The `murmuration/README.md` provides commands for doing this.
2. `cd packages/subgraph`
3. `npx ts-node ./scripts/setup-subgraph-manifest-local.ts`
4. `npx graph create --node $LOAD_BALANCER_URL:8020 goldfinch-subgraph` where `$LOAD_BALANCER_URL` is the url of the load balancer created by the ECS cluster.
5. `npx graph codegen`
6. `npx graph deploy --node $LOAD_BALANCER_URL:8020 --ipfs $LOAD_BALANCER_URL:5002 --version-label v0.0.1 goldfinch-subgraph subgraph-local.yaml`
