import * as fs from 'fs'

export interface ScriptGeneratorArgs {
  token: string
  service: string
  id: string
  scope: string
  target: string
  slug: string
  deploy: boolean
  log: boolean
  version: string
}

interface DeploymentData {
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

export class ScriptGenerator {
  // Raw data from the deployment.json file
  data: Map<string, Object>

  // Access token for deployment service
  token: string

  // Service that you are deploying to
  service: string

  // deployment id the specifies a single or multiple deployments.
  id: string

  // Specifies if you are deploying a single subgraph, all subgraphs for a protocol, or all subgraphs for all protocols for a fork
  scope: string

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
  allDeployments: Map<string, Object>

  // An object that contains all deployment configurations that you are deploying with.
  deployments: Map<string, Object>

  // Contains all scripts for deployment all subgraphs specified in the command line.
  scripts: Map<string, string[]>

  constructor(
    depoymentJsonData: Map<string, Object>,
    args: ScriptGeneratorArgs
  ) {
    // Set arguments to variables
    this.data = depoymentJsonData
    this.token = args.token
    this.service = args.service
    this.id = args.id
    this.scope = args.scope
    this.target = args.target
    this.slug = args.slug
    this.deploy = args.deploy
    this.printlogs = args.log
    this.version = args.version
    this.allDeployments = new Map<string, Object[]>()
    this.deployments = new Map<string, Object[]>()
    this.scripts = new Map<string, string[]>()
  }

  prepare() {
    this.flattenDeploymentData()
    this.checkAndStageDeploymentData()
    this.prepareScripts()
  }

  flattenDeploymentData() {
    const allDeployments = new Map<string, Object[]>()

    for (const protocol of Object.keys(this.data)) {
      const deployments: Map<string, any> = this.data[protocol].deployments
      for (const [deployment, deploymentData] of Object.entries(deployments)) {
        deploymentData.protocol = this.data[protocol].protocol
        deploymentData.base = this.data[protocol].base
        deploymentData.schema = this.data[protocol].schema
        deploymentData.deployment = deployment

        allDeployments[deployment] = deploymentData
      }
    }

    this.allDeployments = allDeployments

    // Add 10 to all deployments
  }

  // Checks if you are wanting to deploy a single subgraph, all subgraphs for a protocol, or all subgraphs for all protocols for a fork
  checkAndStageDeploymentData() {
    // Grabs specific deployment information for a single deployment id.
    if (this.scope === 'single') {
      if (this.allDeployments[this.id]) {
        this.deployments[this.id] = this.allDeployments[this.id]
      } else {
        throw new Error(`No deployment found for: ${this.id}`)
      }
    }

    // Grabs all deployments for a specific protocol.
    if (this.scope === 'protocol') {
      for (const [deployment, deploymentData] of Object.entries(
        this.allDeployments
      )) {
        if (deploymentData.protocol === this.id) {
          this.deployments[deployment] = deploymentData
        }
      }

      if (Object.keys(this.deployments).length === 0) {
        throw new Error(
          `Please specifiy valid protocol or add this protocol in deployment.json for protocol: ${this.id}`
        )
      }
    }

    // Grabs all deployments for a specific  base.
    if (this.scope === 'base') {
      for (const [deployment, deploymentData] of Object.values(
        this.allDeployments
      )) {
        if (deploymentData.base === this.id) {
          this.deployments[deployment] = deploymentData
        }
      }

      if (Object.keys(this.deployments).length === 0) {
        throw new Error(
          `Please specifiy valid base or add this base in deployment.json for base: ${this.id}`
        )
      }
    }
  }

  // Checks if you are wanting to deploy a single network, all deployments for a protocol, or all protocols and networks for a fork
  prepareScripts() {
    for (const deploymentData of Object.values(this.deployments)) {
      if (
        this.deploy === false ||
        deploymentData['services'][this.getService()]['slug']
      ) {
        this.writeDeploymentJsonContext(deploymentData)
        this.generateScripts(deploymentData)
      }
    }
  }

  generateContext() {}

  // Generates scripts necessary for deployment.
  generateScripts(deploymentData) {
    const scripts: string[] = []

    const location = this.getLocation(deploymentData.protocol, deploymentData)

    if (process.platform == 'win32') {
      scripts.push('IF EXIST build(rmdir /s /q build)')
      scripts.push('IF EXIST generated(rmdir /s /q generated)')
      scripts.push('IF EXIST results.txt(del results.txt)')
      scripts.push(
        'IF EXIST configurations/configure.ts(del configurations/configure.ts)'
      )
      scripts.push('IF EXIST subgraph.yaml(del subgraph.yaml)')
    } else {
      scripts.push('rm -rf build')
      scripts.push('rm -rf generated')
      scripts.push('rm -rf results.txt')
      scripts.push('rm -rf configurations/configure.ts')
      scripts.push('rm -rf subgraph.yaml')
    }

    scripts.push(
      `mustache protocols/${deploymentData.protocol}/config/deployments/${deploymentData.deployment}/configurations.json protocols/${deploymentData.protocol}/config/templates/${deploymentData.files.template} > subgraph.yaml`
    )
    scripts.push(
      `mustache protocols/${deploymentData.protocol}/config/deployments/${deploymentData.deployment}/deploymentJsonContext.json ../../deployment/context/template.mustache > src/deploymentJsonContext.ts`
    )

    if (deploymentData.options['prepare:constants'] === true) {
      scripts.push(
        `npm run prepare:constants --PROTOCOL=${deploymentData.protocol} --id=${deploymentData.deployment}`
      )
    }
    scripts.push('graph codegen')

    // We don't want to deploy if we are building or just testing.
    if (this.deploy === true) {
      scripts.push(this.getDeploymentScript(location, deploymentData))
    } else {
      scripts.push('graph build')
    }

    this.scripts.set(location, scripts)
  }

  writeDeploymentJsonContext(deploymentData: DeploymentData) {
    fs.writeFileSync(
      `./protocols/${deploymentData.protocol}/config/deployments/${deploymentData.deployment}/deploymentJsonContext.json`,
      JSON.stringify(deploymentData, null, 2)
    )
  }

  // Grabs the location of deployment.
  getLocation(protocol, deploymentData) {
    // Check if build first since you may not have a service and target prepared for build.
    if (this.deploy === false) {
      return `${protocol}-${deploymentData.network}`
    }

    let location = ''
    if (this.slug) {
      location = this.slug
    } else {
      location = deploymentData['services'][this.getService()]['slug']
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
  getDeploymentScript(location, deploymentData) {
    let deploymentScript = ''

    // Set variables for deployment
    let version = this.version
    if (!version) {
      version = deploymentData.versions.subgraph
    }

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
