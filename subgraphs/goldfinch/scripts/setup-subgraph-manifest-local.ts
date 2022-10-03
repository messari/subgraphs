/* eslint-disable no-console */
import fs from "fs"
import path from "path"

import yaml from "js-yaml"

import devDeployments from "../../protocol/deployments/all_dev.json"
type ContractName = keyof typeof devDeployments["31337"]["localhost"]["contracts"]

console.log("Updating subgraph-local.yaml")

const localhostContracts = devDeployments["31337"].localhost.contracts

const subgraphManifest: any = yaml.load(fs.readFileSync(path.resolve(".", "subgraph.yaml")).toString())

for (let dataSource of subgraphManifest.dataSources) {
  dataSource.network = "localhost"
  delete dataSource.source.startBlock
  dataSource.source.address = localhostContracts[dataSource.name as ContractName].address
}

for (let dataSource of subgraphManifest.templates) {
  dataSource.network = "localhost"
}

fs.writeFileSync(path.resolve(__dirname, "../subgraph-local.yaml"), yaml.dump(subgraphManifest, {lineWidth: -1}))

console.log("Finished updating subgraph-local.yaml")
