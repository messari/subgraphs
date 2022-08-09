class Deployment {
    constructor(depoymentJsonData, args) {
        this.data = depoymentJsonData;
        this.access = args.access;
        this.service = args.service;
        this.fork = args.fork;
        this.protocol = args.protocol;
        this.network = args.network;
        this.target = args.target;
        this.printlogs = args.printlogs;
        this.merge = args.merge;
        this.scripts = new Map();
    }

    prepare() {
        this.preprocessing();
        this.prepareScripts();
    }

    // Internal functions
    preprocessing() {
        this.flattenFirstJsonLevel();
        this.isValidInput();
        this.isValidDeploymentData();
    }

    prepareScripts() {
        let type = this.getDeploymentType();
        if (type == "network") {
            this.generateScripts(this.protocol, this.network, this.getTemplate(this.protocol, this.network));
        } else if (type == "protocol") {
            for (const network in this.data[this.protocol]['networks']) {
                this.generateScripts(this.protocol, network, this.getTemplate(this.protocol, network));
            }
        } else if (type == "fork") {
            let forkProtocols = this.getAllForks();
            for (const protocol in forkProtocols) {
                for (const network in this.data[protocol]['networks']) {
                    this.generateScripts(protocol, network, this.getTemplate(protocol, network));
                } 
            }
        }
    }

    generateScripts(protocol, network, template) {
        let scripts = [];    
        let location = this.getLocation(protocol, network, this.getServiceByAlias())

        scripts.push("rm -rf results.txt");
        scripts.push("rm -rf configurations/configure.ts");
        scripts.push("rm -rf subgraph.yaml");
        scripts.push("npm run prepare:yaml --PROTOCOL=" + protocol + " --NETWORK=" + network + " --TEMPLATE=" + template);
        if (this.data[protocol]['networks'][network]['options']['prepare:constants'] == true) {
            scripts.push("npm run prepare:constants --PROTOCOL=" + protocol + " --NETWORK=" + network);
        }
        scripts.push("graph codegen");

        switch(this.getServiceByAlias()) {
            case "decentralized-network":
                let version = this.getVersion(protocol, network, this.getServiceByAlias());
                if (this.access) {
                    scripts.push("graph deploy --auth=" + this.access + " --product subgraph-studio " + location + " --versionLabel " + version);
                } else {
                    scripts.push("graph deploy --product subgraph-studio " + location + " --versionLabel " + version);
                } break;
            case "hosted-service":
                if (this.access) {
                    scripts.push("graph deploy --auth=" + this.access + " --product hosted-service " + location);
                } else {
                    scripts.push("graph deploy --product hosted-service " + location);
                } break;
            case "cronos-portal":
                scripts.push("graph deploy " + location + " --access-token=" + this.access + " --node https://portal-api.cronoslabs.com/deploy --ipfs https://api.thegraph.com/ipfs");  
                break;
            default:
                throw new Error("service is not valid") 
        }

        this.scripts.set(location, scripts);
    }
    flattenFirstJsonLevel() {
        let result = {};
        Object.keys(this.data)
            .forEach(key1 => Object.keys(this.data[key1])
            .forEach(key2 => result[key2] = this.data[key1][key2]));
        this.data = result;
    }

    checkValidDeploymentType() {
        if (!this.protocol && !this.fork) {
            throw new Error("please specify a protocol, protocol and network, or fork")
        } else if (this.fork && (this.protocol || this.network)) {
            throw new Error("If you specify a fork, you must not specify a protocol or network")
        } 
    }

    checkValidService() {
        switch(this.service.toLowerCase()) {
            case "subgraph-studio":
            case "studio": 
            case "s":
            case "decentralized-network":
            case "d":
                return true
            case "hosted-service":
            case "hosted":
            case "h":
                return true
            case "cronos-portal":
            case "cronos":
            case "c":
                return true
            case undefined:
                throw new Error("service is not defined")
            default:
                throw new Error("service is not valid")  
        }
    }

    checkValidVersion(version) {
        this.checkVersionLengthIsTwo(version)
        this.checkVersionIsNumber(version)
    }

    checkVersionLengthIsTwo(version) {
        if (version.split(".").length - 1 != 2) {
            throw new Error("(1) version is not valid - must be in format x.x.x (e.g. 1.3.1)")
        }
    }

    checkVersionIsNumber(version) {
        let array = version.split(".");
        if (!array.every(element => { return !isNaN(element); })) {
            throw new Error("(2) version is not valid - must be in format x.x.x (e.g. 1.3.1)")
        } 
    }

    checkNetworkLevelData(protocol, network) {
        if (!this.data[protocol]['networks'][network]) {
            throw new Error("network is not defined")
        } else if (!this.data[protocol]['networks'][network][this.getServiceByAlias()]) {
            throw new Error("service is not defined for " + protocol + " " + network)
        } else if (!this.data[protocol]['networks'][network][this.getServiceByAlias()]['subgraph-slug']) {
            throw new Error("subgraph-slug is not defined for " + protocol + " " + network)
        } else if (!this.data[protocol]['networks'][network][this.getServiceByAlias()]['version']) {
            throw new Error("version is not defined for " + protocol + " " + network)
        } else if (!this.data[protocol]['networks'][network]['files']['template']) {
            throw new Error("template is not defined for " + protocol + " " + network)
        }
        this.checkValidVersion(this.data[protocol]['networks'][network][this.getServiceByAlias()]['version'])
    }

    checkProtocolLevelData(protocol) {
        if (!this.data[protocol]) {
            throw new Error("protocol is not defined")
        } else if (Object.keys(this.data[protocol]) == []) {
            throw new Error("no networks are defined for " + protocol)
        }
    }

    checkAuthorization() {
        if (!this.access && this.getServiceByAlias() == "cronos-portal") {
            throw new Error("please specify an authorization token")
        }
    }

    isValidInput() {
        if (!this.target) {
            throw new Error("target is not defined");
        }
        this.checkAuthorization();
        this.checkValidService();
        this.checkValidDeploymentType();

    }

    isValidDeploymentData() {
        let type = this.getDeploymentType();
        if (type == "network") {
            this.checkProtocolLevelData(this.protocol);
            this.checkNetworkLevelData(this.protocol, this.network);
        } else if (type == "protocol") {
            this.checkProtocolLevelData(this.protocol);
            for (const network in this.data[this.protocol]['networks']) {
                this.checkNetworkLevelData(this.protocol, network);
            }
        } else if (type == "fork") {
            let forkProtocols = this.getAllForks();
            if (forkProtocols == []) {
                return [false, "ERROR: fork is not defined"]
            }
            for (const protocol in forkProtocols) {
                this.checkProtocolLevelData(protocol);
                for (const network in this.data[protocol]['networks']) {
                    this.checkNetworkLevelData(protocol, network);
                } 
            }
        }
    }

    getServiceByAlias() {
        switch(this.service.toLowerCase()) {
            case "subgraph-studio":
            case "studio": 
            case "s":
            case "decentralized-network":
            case "d":
                return "decentralized-network"
            case "hosted-service":
            case "hosted":
            case "h":
                return "hosted-service"
            case "cronos-portal":
            case "cronos":
            case "c":
                return "cronos-portal"
            default:
                throw new Error("service is not valid")
        }
    }

    getAllForks() {
        returnObj = []
        for (const protocol in this.data) {
            if (this.data[protocol]['fork'].toLowerCase() == this.fork.toLowerCase())
                returnObj.push(protocol);
        }
        return returnObj;
    }

    getVersion(protocol, network, service) {
        return this.data[protocol]['networks'][network][service]['version'];
    }

    getTemplate(protocol, network) {
        return this.data[protocol]['networks'][network]['files']['template'];
    }

    getLocation(protocol, network, service) {
        if (!this.data[protocol]['networks'][network][service][this.target]) {
            if (this.getServiceByAlias() == "hosted-service") {
                return this.target + '/' + this.data[protocol]['networks'][network][service]['subgraph-slug'];
            } else {
                return this.data[protocol]['networks'][network][service]['subgraph-slug'];
            }
        } else {
            return this.data[protocol]['networks'][network][service][this.target];
        }
    }

    getDeploymentType() {
        if (this.protocol && this.network) {
            return "network"
        } else if (this.protocol) {
            return "protocol"
        } else if (this.fork) {
            return "fork"
        }
    }
}

module.exports = { Deployment };
