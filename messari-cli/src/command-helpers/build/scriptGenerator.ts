import * as fs from 'fs'
import { MESSARI_REPO_PATH } from '../../../bin/env'

export interface ScriptGeneratorArgs {
  token: string
  service: string
  id: string
  base: boolean
  target: string
  slug: string
  deploy: boolean
  log: boolean
  version: string
}

interface DeploymentJsonData {
  protocol: string
  deployment: string
  base: string
  schema: string
  network: string
  status: string
  versions: Map<string, string>
  files: Map<string, string>
  options: Map<string, string>
}

export interface Deployment {
  location: string
  base: string
  scripts: string[]
}

export class ScriptGenerator {
  // Raw data from the deployment.json file
  data: Map<string, Object>

  // Access token for deployment service
  token: string

  // Service that you are deploying to
  service: string

  // deployment id the specifies a single or multiple deployments.
  id: string

  // Specifies if you are deploying a all subgraphs for a subgraph directory (directory name that can contain multiple protocols is referred to as `base`)
  base: boolean

  // The account target for the deployment (i.e. messari).
  target: string

  // Alternate slug for deployment location
  slug: string

  // (true/false) Print the logs from the deployment.
  printlogs: boolean

  // Is this subgraph being deployed
  deploy: boolean

  // Deployment Version
  version: string

  // An object the contains all deployment configurations from the deployment.json
  allDeploymentConfigurations: Map<string, Object>

  // An object that contains all deployment configurations that you are deploying with.
  stagedDeploymentConfigurations: Map<string, Object>

  // This contains a list of objects with information necessary to build and deploy a subgraph.
  deployments: Deployment[]

  constructor(
    depoymentJsonData: Map<string, Object>,
    args: ScriptGeneratorArgs
  ) {
    // Set arguments to variables
    this.data = depoymentJsonData
    this.token = args.token
    this.service = args.service
    this.id = args.id
    this.base = args.base
    this.target = args.target
    this.slug = args.slug
    this.deploy = args.deploy
    this.printlogs = args.log
    this.version = args.version
    this.allDeploymentConfigurations = new Map<string, Object[]>()
    this.stagedDeploymentConfigurations = new Map<string, Object[]>()
    this.deployments = []
  }

  prepare() {
    this.flattenDeploymentJsonData()
    this.checkAndStageDeploymentJsonData()
    this.prepareScripts()
  }

  flattenDeploymentJsonData() {
    const allDeployments = new Map<string, Object[]>()

    for (const protocol of Object.keys(this.data)) {
      const deployments: Map<string, any> = this.data[protocol].deployments
      for (const [deployment, deploymentJsonData] of Object.entries(
        deployments
      )) {
        deploymentJsonData.protocol = this.data[protocol].protocol
        deploymentJsonData.base = this.data[protocol].base
        deploymentJsonData.schema = this.data[protocol].schema
        deploymentJsonData.deployment = deployment

        allDeployments[deployment] = deploymentJsonData
      }
    }

    this.allDeploymentConfigurations = allDeployments

    // Add 10 to all deployments
  }

  // Checks if you are wanting to deploy a single subgraph, all subgraphs for a protocol, or all subgraphs for all protocols for a fork
  checkAndStageDeploymentJsonData() {
    // Grabs all deployments for a specific base if specified in the flag.
    //console.log("hi")

    if (this.base) {
      for (const [deployment, deploymentJsonData] of Object.entries(
        this.allDeploymentConfigurations
      )) {
        if (deploymentJsonData.base === this.id) {
          this.stagedDeploymentConfigurations[deployment] = deploymentJsonData
        }
      }

      if (Object.keys(this.stagedDeploymentConfigurations).length === 0) {
        throw new Error(
          `Please specifiy valid base or add this base in deployment.json for base: ${this.id}`
        )
      }
      return
    }

    // Grabs specific deployment information for a single deployment-id if it exist.
    if (this.allDeploymentConfigurations[this.id]) {
      this.stagedDeploymentConfigurations[this.id] =
        this.allDeploymentConfigurations[this.id]
      return
    }

    // Grabs all deployments for a specific protocol if it exists.
    for (const [deployment, deploymentJsonData] of Object.entries(
      this.allDeploymentConfigurations
    )) {
      if (deploymentJsonData.protocol === this.id) {
        this.stagedDeploymentConfigurations[deployment] = deploymentJsonData
      }
    }

    if (Object.keys(this.stagedDeploymentConfigurations).length == 0) {
      throw new Error(`No deployment-id or protocol found for: ${this.id}`)
    }
  }

  // Checks if you are wanting to deploy a single network, all deployments for a protocol, or all protocols and networks for a fork
  prepareScripts() {
    for (const deploymentJsonData of Object.values(
      this.stagedDeploymentConfigurations
    )) {
      if (
        this.deploy === false ||
        deploymentJsonData['services'][this.getService()]['slug']
      ) {
        this.writeDeploymentJsonContext(deploymentJsonData)
        this.generateScripts(deploymentJsonData)
      }
    }
  }

  generateContext() {}

  // Generates scripts necessary for deployment.
  generateScripts(deploymentJsonData) {
    const location = this.getLocation(
      deploymentJsonData.protocol,
      deploymentJsonData
    )

    const deployment: Deployment = {
      location: location,
      base: deploymentJsonData.base,
      scripts: [],
    }

    if (process.platform == 'win32') {
      deployment.scripts.push('IF EXIST build(rmdir /s /q build)')
      deployment.scripts.push('IF EXIST generated(rmdir /s /q generated)')
      deployment.scripts.push('IF EXIST results.txt(del results.txt)')
      deployment.scripts.push(
        'IF EXIST configurations/configure.ts(del configurations/configure.ts)'
      )
      deployment.scripts.push('IF EXIST subgraph.yaml(del subgraph.yaml)')
    } else {
      deployment.scripts.push('rm -rf build')
      deployment.scripts.push('rm -rf generated')
      deployment.scripts.push('rm -rf results.txt')
      deployment.scripts.push('rm -rf configurations/configure.ts')
      deployment.scripts.push('rm -rf subgraph.yaml')
    }

    deployment.scripts.push(
      `mustache protocols/${deploymentJsonData.protocol}/config/deployments/${deploymentJsonData.deployment}/configurations.json protocols/${deploymentJsonData.protocol}/config/templates/${deploymentJsonData.files.template} > subgraph.yaml`
    )
    deployment.scripts.push(
      `mustache protocols/${deploymentJsonData.protocol}/config/deployments/${deploymentJsonData.deployment}/deploymentJsonContext.json ../../deployment/context/versions.template.mustache > src/versions.ts`
    )

    if (deploymentJsonData.options['prepare:constants'] === true) {
      deployment.scripts.push(
        `npm run prepare:constants --PROTOCOL=${deploymentJsonData.protocol} --id=${deploymentJsonData.deployment}`
      )
    }
    deployment.scripts.push('graph codegen')

    // We don't want to deploy if we are building or just testing.
    if (this.deploy === true) {
      deployment.scripts.push(
        this.getDeploymentScript(location, deploymentJsonData)
      )
    } else {
      deployment.scripts.push('graph build')
    }

    this.deployments.push(deployment)
  }

  writeDeploymentJsonContext(deploymentJsonData: DeploymentJsonData) {
    fs.writeFileSync(
      `${MESSARI_REPO_PATH}/subgraphs/${deploymentJsonData.base}/protocols/${deploymentJsonData.protocol}/config/deployments/${deploymentJsonData.deployment}/deploymentJsonContext.json`,
      JSON.stringify(deploymentJsonData, null, 2)
    )
  }

  // Grabs the location of deployment.
  getLocation(protocol, deploymentJsonData) {
    // Check if build first since you may not have a service and target prepared for build.
    if (this.deploy === false) {
      return `${protocol}-${deploymentJsonData.network}`
    }

    let location = ''
    if (this.slug) {
      location = this.slug
    } else {
      location = deploymentJsonData['services'][this.getService()]['slug']
    }

    if (this.service === 'subgraph-studio') {
      return location
    }
    return `${this.target}/${location}`
  }

  getService() {
    switch (this.service) {
      case 'subgraph-studio':
        return 'decentralized-network'
      default:
        return this.service
    }
  }

  // Get the deployment script with the proper endpoint, version, and authorization token.
  getDeploymentScript(location, deploymentJsonData) {
    let deploymentScript = ''

    // Set variables for deployment
    let version = this.version
    if (!version) {
      version = `${deploymentJsonData.versions.schema}_${deploymentJsonData.versions.subgraph}`
    }

    console.log(version)

    switch (this.service) {
      case 'subgraph-studio':
        if (this.token) {
          deploymentScript = `graph deploy --auth=${this.token} --product subgraph-studio ${location} --versionLabel ${version}`
        } else {
          deploymentScript = `graph deploy --product subgraph-studio ${location} --versionLabel ${version}`
        }
        break
      case 'hosted-service':
        if (this.token) {
          deploymentScript = `graph deploy --auth=${this.token} --product hosted-service ${location}`
        } else {
          deploymentScript = `graph deploy --product hosted-service ${location}`
        }
        break
      case 'cronos-portal':
        deploymentScript = `graph deploy ${location} --access-token=${this.token} --node https://portal-api.cronoslabs.com/deploy --ipfs https://api.thegraph.com/ipfs --versionLabel=${version}`
        break
      default:
        throw new Error(
          `Service is missing or not valid for: service=${this.getService()}`
        )
    }

    return deploymentScript
  }
}
