class Deployment {
  constructor(depoymentJsonData, args) {
    // Set arguments to variables
    this.data = depoymentJsonData;
    this.token = args.token;
    this.service = args.service.toLowerCase();
    this.id = args.id.toLowerCase();
    this.span = args.span.toLowerCase();
    this.target = args.target.toLowerCase();
    this.slug = args.slug.toLowerCase();
    this.deploy = args.deploy.toLowerCase();
    this.printlogs = args.printlogs.toLowerCase();
    this.allDeployments = {};
    this.deployments = {};
    this.scripts = new Map();
  }

  prepare() {
    this.isValidInput();
    this.flattenDeploymentData();
    this.checkAndStageDeploymentData();
    this.prepareScripts();
  }

  flattenDeploymentData() {
    const allDeployments = {};
    for (const protocol of Object.keys(this.data)) {
      for (const [deployment, deploymentData] of Object.entries(
        this.data[protocol].deployments
      )) {
        deploymentData.protocol = this.data[protocol].protocol;
        deploymentData.base = this.data[protocol].base;
        deploymentData.schema = this.data[protocol].schema;

        allDeployments[deployment] = deploymentData;
      }
    }

    this.allDeployments = allDeployments;
  }

  // Checks if you are wanting to deploy a single subgraph, all subgraphs for a protocol, or all subgraphs for all protocols for a fork
  checkAndStageDeploymentData() {
    const span = this.getDeploymentSpan();

    // Grabs specific deployment information for a single deployment id.
    if (span === "single") {
      if (this.allDeployments[this.id]) {
        this.deployments[this.id] = this.allDeployments[this.id];
      } else {
        throw new Error(`No deployment found for: ${this.id}`).message;
      }
    }

    // Grabs all deployments for a specific protocol.
    if (span === "protocol") {
      for (const [deployment, deploymentData] of Object.entries(
        this.allDeployments
      )) {
        if (deploymentData.protocol === this.id) {
          this.deployments[deployment] = deploymentData;
        }
      }

      if (Object.keys(this.deployments).length === 0) {
        throw new Error(
          `Please specifiy valid protocol or add this protocol in deployment.json for protocol: ${this.id}`
        ).message;
      }
    }

    // Grabs all deployments for a specific  base.
    if (span === "base") {
      for (const [deployment, deploymentData] of Object.entries(
        this.allDeployments
      )) {
        if (deploymentData.base === this.id) {
          this.deployments[deployment] = deploymentData;
        }
      }

      if (Object.keys(this.deployments).length === 0) {
        throw new Error(
          `Please specifiy valid base or add this base in deployment.json for base: ${this.id}`
        ).message;
      }
    }
  }

  // Checks if you are wanting to deploy a single network, all deployments for a protocol, or all protocols and networks for a fork
  prepareScripts() {
    for (const [deployment, deploymentData] of Object.entries(
      this.deployments
    )) {
      if (
        this.getDeploy() === false ||
        deploymentData["services"][this.getService()]["slug"]
      ) {
        this.generateScripts(deployment, deploymentData);
      }
    }
  }

  // Generates scripts necessary for deployment.
  generateScripts(deployment, deploymentData) {
    const scripts = [];

    const location = this.getLocation(deploymentData.protocol, deploymentData);

    if (process.platform == "win32") {
      scripts.push("IF EXIST build(rmdir /s /q build)");
      scripts.push("IF EXIST generated(rmdir /s /q generated)");
      scripts.push("IF EXIST results.txt(del results.txt)");
      scripts.push(
        "IF EXIST configurations/configure.ts(del configurations/configure.ts)"
      );
      scripts.push("IF EXIST subgraph.yaml(del subgraph.yaml)");
    } else {
      scripts.push("rm -rf build");
      scripts.push("rm -rf generated");
      scripts.push("rm -rf results.txt");
      scripts.push("rm -rf configurations/configure.ts");
      scripts.push("rm -rf subgraph.yaml");
    }

    scripts.push(
      `npm run prepare:yaml --PROTOCOL=${deploymentData.protocol} --ID=${deployment} --TEMPLATE=${deploymentData.files.template}`
    );
    if (deploymentData.options["prepare:constants"] === true) {
      scripts.push(
        `npm run prepare:constants --PROTOCOL=${deploymentData.protocol} --ID=${deployment}`
      );
    }
    scripts.push("graph codegen");

    // We don't want to deploy if we are building or just testing.
    if (this.getDeploy() === true) {
      scripts.push(this.getDeploymentScript(location, deploymentData));
    } else {
      scripts.push("graph build");
    }

    this.scripts.set(location, scripts);
  }

  // Makes sure the input arguments for the deployments you want are sensible.
  checkValidSpan() {
    switch (this.span) {
      case "single":
      case "s":
      case "":
      case "protocol":
      case "p":
      case "base":
      case "b":
        return true;
      default:
        throw new Error(
          "Please specify a valid span: e.g. ['single', 's', or '', 'protocol' or 'p', 'base' or 'b']"
        ).message;
    }
  }

  // Makes sure the input arguments are either true or false.
  checkValidDeploy() {
    switch (this.deploy) {
      case "true":
      case "t":
      case "false":
      case "f":
      case "":
        return true;
      default:
        throw new Error(
          "Please specify a valid deploy: e.g. ['true' or 't', 'false', 'f', or '']"
        ).message;
    }
  }

  // Checks if the input arguments are valid for the deployment location.
  checkValidService() {
    switch (this.service) {
      case "subgraph-studio":
      case "studio":
      case "s":
      case "decentralized-network":
      case "d":
      case "hosted-service":
      case "hosted":
      case "h":
      case "cronos-portal":
      case "cronos":
      case "c":
        return true;
      default:
        throw new Error(
          `--SERVICE: Service is not valid or is missing: service=${this.service}`
        ).message;
    }
  }

  // Requires authorization for cronos portal deployments.
  checkAuthorization() {
    if (!this.token && this.getService() === "cronos-portal") {
      throw new Error("please specify an authorization token").message;
    }
  }

  // Runs all checks for valid input data.
  isValidInput() {
    this.checkValidDeploy();
    if (!this.target && this.getDeploy() === true) {
      throw new Error("Please specify a target location if you are deploying")
        .message;
    }
    if (this.slug && this.getDeploymentSpan() !== "single") {
      throw new Error(
        "You may only specify a slug if you are deploying a single subgraph."
      ).message;
    }
    if (this.getDeploy() === true) {
      this.checkAuthorization();
      this.checkValidService();
    }
    this.checkValidSpan();
  }

  getService() {
    switch (this.service) {
      case "subgraph-studio":
      case "studio":
      case "s":
      case "decentralized-network":
      case "d":
        return "decentralized-network";
      case "hosted-service":
      case "hosted":
      case "h":
        return "hosted-service";
      case "cronos-portal":
      case "cronos":
      case "c":
        return "cronos-portal";
      default:
        throw new Error(
          `Service is missing or not valid for: service=${this.service}`
        ).message;
    }
  }

  getDeploy() {
    switch (this.deploy) {
      case "true":
      case "t":
        return true;
      case "false":
      case "f":
      case "":
        return false;
      default:
        throw new Error(
          "Please specify a valid deploy: e.g. ['true' or 't', 'false', 'f', '']"
        ).message;
    }
  }

  // Grabs the location of deployment.
  getLocation(protocol, deploymentData) {
    // Check if build first since you may not have a service and target prepared for build.
    if (this.getDeploy() === false) {
      return `${protocol}-${deploymentData.network}`;
    }

    let location = "";
    if (this.slug) {
      location = this.slug;
    } else {
      location = deploymentData["services"][this.getService()]["slug"];
    }

    if (this.getService() === "decentralized-network") {
      return location;
    }
    return `${this.target}/${location}`;
  }

  getDeploymentSpan() {
    switch (this.span) {
      case "single":
      case "s":
      case "":
        return "single";
      case "protocol":
      case "p":
        return "protocol";
      case "base":
      case "b":
        return "base";
      default:
        throw new Error(
          "Please specify a valid span: e.g. ['single', 's', or '', 'protocol' or 'p', 'base' or 'b']"
        ).message;
    }
  }

  // Get the deployment script with the proper endpoint, version, and authorization token.
  getDeploymentScript(location, deploymentData) {
    let deploymentScript = "";
    switch (this.getService()) {
      case "decentralized-network":
        if (this.token) {
          deploymentScript = `graph deploy --auth=${this.token} --product subgraph-studio ${location} --versionLabel ${deploymentData.versions.subgraph}`;
        } else {
          deploymentScript = `graph deploy --product subgraph-studio ${location} --versionLabel ${deploymentData.versions.subgraph}`;
        }
        break;
      case "hosted-service":
        if (this.token) {
          deploymentScript = `graph deploy --auth=${this.token} --product hosted-service ${location}`;
        } else {
          deploymentScript = `graph deploy --product hosted-service ${location}`;
        }
        break;
      case "cronos-portal":
        deploymentScript = `graph deploy ${location} --access-token=${this.token} --node https://portal-api.cronoslabs.com/deploy --ipfs https://api.thegraph.com/ipfs --versionLabel=${deploymentData.versions.subgraph}`;
        break;
      default:
        throw new Error(
          `Service is missing or not valid for: service=${this.service}`
        ).message;
    }

    return deploymentScript;
  }
}

module.exports = { Deployment };
