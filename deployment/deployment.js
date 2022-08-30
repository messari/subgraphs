const {
  getDeploymentNetwork,
  runCommands,
  scripts,
} = require("./execution.js");
const protocolNetworkData = require("./deployment.json");
const args = require("minimist")(process.argv.slice(2));

const protocolNetworkMap = JSON.parse(JSON.stringify(protocolNetworkData))[
  "subgraphs"
];

let allScripts = new Map();
let results = "RESULTS:\n";

if (
  args.subgraph === undefined ||
  args.protocol === undefined ||
  args.network === undefined ||
  args.location === undefined ||
  args.printlogs === undefined ||
  args.merge === undefined ||
  args.type === undefined
) {
  console.log(
    "Usage: node deployment.js --subgraph=" +
      args.subgraph +
      " --protocol=" +
      args.protocol +
      " --network=" +
      args.network +
      " --location=" +
      args.location +
      " --printlogs=" +
      args.printlogs +
      " --merge=" +
      args.merge +
      " --type=" +
      args.type
  );
  console.log(
    "Please check subgraph:deploy script in package.json. Make sure it matches example script in the deployments folder. "
  );
} else if (!args.subgraph || !args.location) {
  console.log("Please provide at least --SUBGRAPH and --LOCATION");
} else if (!["build", "deploy", ""].includes(args.type.toLowerCase())) {
  console.log("Please provide --TYPE=build or --TYPE=deploy");
} else if (args.subgraph && args.protocol && args.network && args.location) {
  if (args.subgraph in protocolNetworkMap == false) {
    console.log(
      "Error: please specify a a valid subgraph directory or add to configurations (e.g. uniswap-forks, compound-forks, qidao, etc"
    );
  } else if (args.protocol in protocolNetworkMap[args.subgraph] == false) {
    console.log(
      "Error: please specify a valid protocol as 1st argument or add to configurations  (i.e. uniswap-v2, sushiswap, etc.)"
    );
    console.log(
      "To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)"
    );
  } else if (
    args.network in protocolNetworkMap[args.subgraph][args.protocol] ==
    false
  ) {
    console.log(
      "Error: please specify a valid network as 2nd argument or add to configurations  (i.e. mainnet, ropsten, etc.)"
    );
    console.log(
      "To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)"
    );
  } else {
    let protocol = args.protocol;
    let network = args.network;
    let template =
      protocolNetworkMap[args.subgraph][protocol][network]["template"];
    let location = "";
    let prepareConstants =
      protocolNetworkMap[args.subgraph][protocol][network]["prepare:constants"];

    // Get location for configurations or derive using standard naming convention
    if (args.location in protocolNetworkMap[args.subgraph][protocol][network]) {
      location =
        protocolNetworkMap[args.subgraph][protocol][network][args.location];
    } else {
      location =
        args.location + "/" + protocol + "-" + getDeploymentNetwork(network);
    }

    // Don't execute the script if the location is messari, you have specified not to deploy on merge, and this script is excuted by Github Action upon merge
    if (
      args.location == "messari" &&
      [false, undefined].includes(
        protocolNetworkMap[args.subgraph][protocol][network]["deploy-on-merge"]
      ) &&
      ["true", "t"].includes(args.merge.toLowerCase())
    ) {
      results += "Ignored in Deployment Configurations: " + location + "\n";
    } else {
      allScripts.set(
        location,
        scripts(
          protocol,
          network,
          template,
          location,
          prepareConstants,
          args.type
        )
      );
    }
    runCommands(allScripts, results, args, function (results) {});
  }
} else if (args.subgraph && args.protocol && args.location) {
  if (args.subgraph in protocolNetworkMap == false) {
    console.log(
      "Error: please specify a a valid subgraph directory or add to configurations  (e.g. uniswap-forks, compound-forks, qidao, etc"
    );
  } else if (args.protocol in protocolNetworkMap[args.subgraph] == false) {
    console.log(
      "Error: please specify a valid protocol as 1st argument or add to configurations  (i.e. uniswap-v2, sushiswap, etc.)"
    );
    console.log(
      "To deploy all networks of a specified protocol, pass 2 arguements (protocol/location)"
    );
  } else {
    let protocol = args.protocol;

    for (const network in protocolNetworkMap[args.subgraph][protocol]) {
      let template =
        protocolNetworkMap[args.subgraph][protocol][network]["template"];
      let location = "";
      let prepareConstants =
        protocolNetworkMap[args.subgraph][protocol][network][
          "prepare:constants"
        ];

      // Get location for configurations or derive using standard naming convention
      if (
        args.location in protocolNetworkMap[args.subgraph][protocol][network]
      ) {
        location =
          protocolNetworkMap[args.subgraph][protocol][network][args.location];
      } else {
        location =
          args.location + "/" + protocol + "-" + getDeploymentNetwork(network);
      }

      // Don't execute the script if the location is messari, you have specified not to deploy on merge, and this script is excuted by Github Action upon merge
      if (
        args.location == "messari" &&
        [false, undefined].includes(
          protocolNetworkMap[args.subgraph][protocol][network][
            "deploy-on-merge"
          ]
        ) &&
        ["true", "t"].includes(args.merge.toLowerCase()) &&
        args.deploy != "build"
      ) {
        results += "Ignored in Deployment Configurations: " + location + "\n";
      } else {
        allScripts.set(
          location,
          scripts(
            protocol,
            network,
            template,
            location,
            prepareConstants,
            args.type
          )
        );
      }
    }

    runCommands(allScripts, results, args, function (results) {});
  }
} else if (args.subgraph && args.location) {
  if (args.subgraph in protocolNetworkMap == false) {
    console.log(
      "Error: please specify a a valid subgraph directory or add to configurations  (e.g. uniswap-forks, compound-forks, qidao, etc"
    );
  } else {
    for (const protocol in protocolNetworkMap[args.subgraph]) {
      for (const network in protocolNetworkMap[args.subgraph][protocol]) {
        let template =
          protocolNetworkMap[args.subgraph][protocol][network]["template"];
        let location = "";
        let prepareConstants =
          protocolNetworkMap[args.subgraph][protocol][network][
            "prepare:constants"
          ];

        // Get location for configurations or derive using standard naming convention
        if (
          args.location in protocolNetworkMap[args.subgraph][protocol][network]
        ) {
          location =
            protocolNetworkMap[args.subgraph][protocol][network][args.location];
        } else {
          location =
            args.location +
            "/" +
            protocol +
            "-" +
            getDeploymentNetwork(network);
        }

        // Don't execute the script if the location is messari, you have specified not to deploy on merge, and this script is excuted by Github Action upon merge
        if (
          args.location == "messari" &&
          [false, undefined].includes(
            protocolNetworkMap[args.subgraph][protocol][network][
              "deploy-on-merge"
            ]
          ) &&
          ["true", "t"].includes(args.merge.toLowerCase())
        ) {
          results += "Ignored in Deployment Configurations: " + location + "\n";
        } else {
          allScripts.set(
            location,
            scripts(
              protocol,
              network,
              template,
              location,
              prepareConstants,
              args.type
            )
          );
        }
      }
    }

    runCommands(allScripts, results, args, function (results) {});
  }
} else {
  console.log("UNKOWN - Please post issue on github.");
}
