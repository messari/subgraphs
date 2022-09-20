import inquirer from "inquirer";

// global variables
let deploymentMap = new Map();
let scripts = [];

// invoke the main function
main();

// Driving the cli prompts of the script
function main() {
  // 1- Ask user if they want to deploy to multiple forks or an individual protocol
  const deploymentTypes = ["Individual Protocol", "Forks"];
  inquirer
    .prompt([
      {
        name: "deployment_type",
        type: "list",
        message: "What do you want to deploy?",
        choices: deploymentTypes,
      },
    ])
    .then((answer) => {
      if (answer.deployment_type == deploymentTypes[0]) {
        getProtocolData()
      } else {
        // TODO: handle forks
      }
    });
}

function getProtocolData() {

  // have user enter protocol name
  

  let isValidProtocol = false;
  let potentialDeployments = new Map();

  while (!isValidProtocol) {
    for (const [deployment, deploymentData] of Object.entries(
      this.allDeployments
    )) {
      if (deploymentData.protocol === this.id) {
        this.deployments[deployment] = deploymentData;
      }
    }
  
    if (Object.keys(potentialDeployments).length > 0) {
      isValidProtocol = true;
    } else {

    }
  }

}
