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
    this.deployments = {};
    this.scripts = new Map();
  }

  prepare() {
    this.isValidInput();
    this.checkAndStageDeploymentData();
    this.prepareScripts();
  }

  // Checks if you are wanting to deploy a single subgraph, all subgraphs for a protocol, or all subgraphs for all protocols for a fork
  checkAndStageDeploymentData() {
    let span = this.getDeploymentSpan();
    let deployments = [];

    // Grabs specific deployment information for a single deployment id.
    if (span == "single") {
      for (const [protocol, protocolData] of Object.entries(this.data)) {
        for (const [deployment, deploymentData] of Object.entries(
          protocolData["deployments"]
        )) {
          if (deployment == this.id) {
            deployments.push(deploymentData);
            this.deployments[protocolData["protocol"]] = deployments;
          }
        }
      }
      if (Object.keys(this.deployments).length == 0) {
        throw "No deployment found for: " + this.id;
      }
    }

    // Grabs all deployments for a specific protocol.
    if (span == "protocol") {
      if (!this.data[this.id]) {
        throw (
          "Please specifiy valid protocol or add this protocol in deployment.json for protocol: " +
          this.id
        );
      }

      for (const [deployment, deploymentData] of Object.entries(
        this.data[this.id]["deployments"]
      )) {
        deployments.push(deploymentData);
      }

      this.deployments[this.data[this.id]["protocol"]] = deployments;
    }

    // Grabs all deployments for a specific  base.
    if (span == "base") {
      let protocolDatas = [];

      for (const [protocol, protocolData] of Object.entries(this.data)) {
        if (protocolData["base"] == this.id) {
          protocolDatas.push(protocolData);
        }
      }

      if (protocolDatas.length == 0) {
        throw (
          "Please specifiy valid base or add this base in deployment.json for base: " +
          this.id
        );
      }

      for (const protocolData of protocolDatas) {
        for (const [deployment, deploymentData] of Object.entries(
          protocolData["deployments"]
        )) {
          deployments.push(deploymentData);
        }
        this.deployments[protocolData["protocol"]] = deployments;
        deployments = [];
      }
    }
  }

  // Checks if you are wanting to deploy a single network, all deployments for a protocol, or all protocols and networks for a fork
  prepareScripts() {
    for (const [protocol, deployments] of Object.entries(this.deployments)) {
      for (const deployment of deployments) {
        if (
          this.getDeploy() == false ||
          deployment["deployment-ids"][this.getService()]
        ) {
          this.generateScripts(protocol, deployment);
        }
      }
    }
  }

  // Generates scripts necessary for deployment.
  generateScripts(protocol, deployment) {
    let scripts = [];

    let location = this.getLocation(protocol, deployment);
    let network = this.getNetwork(deployment);
    let template = this.getTemplate(deployment);

    scripts.push("rm -rf build");
    scripts.push("rm -rf generated");
    scripts.push("rm -rf results.txt");
    scripts.push("rm -rf configurations/configure.ts");
    scripts.push("rm -rf subgraph.yaml");

    scripts.push(
      "npm run prepare:yaml --PROTOCOL=" +
        protocol +
        " --NETWORK=" +
        network +
        " --TEMPLATE=" +
        template
    );
    if (deployment["options"]["prepare:constants"] == true) {
      scripts.push(
        "npm run prepare:constants --PROTOCOL=" +
          protocol +
          " --NETWORK=" +
          network
      );
    }
    scripts.push("graph codegen");

    // We don't want to deploy if we are building or just testing.
    if (this.getDeploy() == true) {
      scripts.push(this.getDeploymentScript(location, deployment));
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
        throw "Please specify a valid span: e.g. ['single', 's', or '', 'protocol' or 'p', 'base' or 'b']";
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
        throw "Please specify a valid deploy: e.g. ['true' or 't', 'false', 'f', or '']";
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
        throw (
          "--SERVICE: Service is not valid or is missing: service=" +
          this.service
        );
    }
  }

  // Requires authorization for cronos portal deployments.
  checkAuthorization() {
    if (!this.token && this.getService() == "cronos-portal") {
      throw "please specify an authorization token";
    }
  }

  // Runs all checks for valid input data.
  isValidInput() {
    this.checkValidDeploy();
    if (!this.target && this.getDeploy() == true) {
      throw "Please specify a target location if you are deploying";
    }
    if (this.slug && this.getDeploymentSpan() != "single") {
      throw "You may only specify a slug if you are deploying a single subgraph.";
    }
    if (this.getDeploy() == true) {
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
        throw "Service is missing or not valid for: service=" + this.service;
    }
  }

  getSubgraphVersion(deployment) {
    return deployment["versions"]["subgraph"];
  }

  getNetwork(deployment) {
    return deployment["network"];
  }

  getTemplate(deployment) {
    return deployment["files"]["template"];
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
        throw "Please specify a valid deploy: e.g. ['true' or 't', 'false', 'f', '']";
    }
  }

  // Grabs the location of deployment.
  getLocation(protocol, deployment) {
    // Check if build first since you may not have a service and target prepared for build.
    if (this.getDeploy() == false) {
      return protocol + "-" + deployment["network"];
    }

    let location = "";
    if (this.slug) {
      location = this.slug;
    } else {
      location = deployment["deployment-ids"][this.getService()];
    }

    if (this.getService() == "decentralized-network") {
      return location;
    } else {
      return this.target + "/" + location;
    }
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
        throw "Please specify a valid span: e.g. ['single', 's', or '', 'protocol' or 'p', 'base' or 'b']";
    }
  }

  // Get the deployment script with the proper endpoint, version, and authorization token.
  getDeploymentScript(location, deployment) {
    let deploymentScript = "";
    switch (this.getService()) {
      case "decentralized-network":
        if (this.token) {
          deploymentScript =
            "graph deploy --auth=" +
            this.token +
            " --product subgraph-studio " +
            location +
            " --versionLabel " +
            this.getSubgraphVersion(deployment);
        } else {
          deploymentScript =
            "graph deploy --product subgraph-studio " +
            location +
            " --versionLabel " +
            this.getSubgraphVersion(deployment);
        }
        break;
      case "hosted-service":
        if (this.token) {
          deploymentScript =
            "graph deploy --auth=" +
            this.token +
            " --product hosted-service " +
            location;
        } else {
          deploymentScript =
            "graph deploy --product hosted-service " + location;
        }
        break;
      case "cronos-portal":
        deploymentScript =
          "graph deploy " +
          location +
          " --access-token=" +
          this.token +
          " --node https://portal-api.cronoslabs.com/deploy --ipfs https://api.thegraph.com/ipfs --versionLabel=" +
          this.getSubgraphVersion(deployment);
        break;
      default:
        throw "Service is missing or not valid for: service=" + this.service;
    }

    return deploymentScript;
  }
}

module.exports = { Deployment };
