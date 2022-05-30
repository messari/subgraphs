const fs = require("fs");
const writeYamlFile = require("write-yaml-file");
const ethers = require("ethers");
const vaults = require("./vaults");
const vaultAbi = require("../abis/BeefyVault.json");
require("dotenv").config();

const commentTag = "__comments";

let constants = {};
let monitoredVaults = [];

// STEP 1: Build the subgraph.yaml file
function createDataSource(contractName, contractAddress, startBlock) {
  let dataSource = {
    kind: "ethereum",
    name: contractName,
    network: "matic",
    source: {
      address: contractAddress,
      abi: "BeefyStrategy",
      startBlock: startBlock,
    },
    mapping: {
      kind: "ethereum/events",
      apiVersion: "0.0.6",
      language: "wasm/assemblyscript",
      entities: [
        "Vault",
        "Token",
        "Deposit",
        "Withdraw",
        "YieldAggregator",
        "VaultDailySnapshot",
        "VaultHourlySnapshot",
      ],
      abis: [
        {
          name: "BeefyStrategy",
          file: "./abis/BeefyStrategy.json",
        },
        {
          name: "BeefyVault",
          file: "./abis/BeefyVault.json",
        },
        {
          name: "ChainlinkOracle",
          file: "./abis/Chainlink.json",
        },
        {
          name: "ERC20",
          file: "./abis/ERC20.json",
        },
        {
          name: "CurveRegistry",
          file: "./abis/Prices/Curve/Registry.json",
        },
        {
          name: "CurvePoolRegistry",
          file: "./abis/Prices/Curve/PoolRegistry.json",
        },
        {
          name: "CalculationsCurve",
          file: "./abis/Prices/Calculations/Curve.json",
        },
        {
          name: "YearnLensContract",
          file: "./abis/Prices/YearnLens.json",
        },
        {
          name: "ChainLinkContract",
          file: "./abis/Prices/ChainLink.json",
        },
        {
          name: "UniswapRouter",
          file: "./abis/Prices/Uniswap/Router.json",
        },
        {
          name: "UniswapFactory",
          file: "./abis/Prices/Uniswap/Factory.json",
        },
        {
          name: "UniswapPair",
          file: "./abis/Prices/Uniswap/Pair.json",
        },
        {
          name: "SushiSwapRouter",
          file: "./abis/Prices/SushiSwap/Router.json",
        },
        {
          name: "SushiSwapFactory",
          file: "./abis/Prices/SushiSwap/Factory.json",
        },
        {
          name: "SushiSwapPair",
          file: "./abis/Prices/SushiSwap/Pair.json",
        },
        {
          name: "CalculationsSushiSwap",
          file: "./abis/Prices/Calculations/SushiSwap.json",
        },
      ],
      eventHandlers: [
        {
          event: "Deposit(uint256)",
          handler: "handleDeposit",
        },
        {
          event: "Withdraw(uint256)",
          handler: "handleWithdraw",
        },
      ],
      file: "./src/mappings/vault.ts",
    },
  };

  return dataSource;
}

async function bootstrap() {
  //setup provider to get contract addresses
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ALCHEMY_POLYGON
  );
  const signer = new ethers.Wallet(
    process.env.TEST_PRIVATE_KEY || "",
    provider
  );

  let subgraphYamlDoc = {
    specVersion: "0.0.5",
    schema: {
      file: "./schema.graphql",
    },
    dataSources: [],
  };
  //loop through all the pools and get the strategy addresses
  let contract, strategyAddress, vaultName, startBlock;
  //const minStartBlock = 0;
  //const currentBlock = await provider.getBlockNumber();

  for (let i = 0; i < vaults.polygonPools.length; i++) {
    contract = new ethers.Contract(
      vaults.polygonPools[i].earnContractAddress,
      vaultAbi,
      signer
    );
    strategyAddress = await contract.strategy();
    vaultName = vaults.polygonPools[i].id;
    startBlock = 23900000; //19500000;
    console.log(
      "Adding " + vaultName + "with starting block " + startBlock + "..."
    );

    // Add the datasource
    subgraphYamlDoc["dataSources"].push(
      createDataSource(vaultName, strategyAddress, startBlock, true)
    );

    //add the strategy address to the list of monitored contracts
    monitoredVaults.push(vaultName);
  }

  writeYamlFile("subgraph.yaml", subgraphYamlDoc).then(() => {});

  // // STEP 2.1: Add the MonitoredERC20 enum in the schema.graphql
  // let schemaContent = fs.readFileSync(
  //   "./bootstrap/templates/schema.template.graphql"
  // );
  // let enumString = "";
  // for (const paymentToken of paymentTokens) {
  //   enumString = enumString.concat(paymentToken.concat("\n\t"));
  // }
  // enumString = enumString.concat("UNKNOWN");
  // schemaContent = schemaContent
  //   .toString()
  //   .replace("$PAYMENT_TOKENS$", enumString);

  // // STEP 2.2: Add the MonitoredERC721 enum in the schema.graphql
  // enumString = "";
  // for (const erc721Name of monitoredERC721) {
  //   enumString = enumString.concat(erc721Name.concat("\n\t"));
  // }
  // enumString = enumString.concat("UNKNOWN");
  // schemaContent = schemaContent
  //   .toString()
  //   .replace("$MONITORED_ERC721$", enumString);
  // fs.writeFileSync("./schema.graphql", schemaContent);

  // STEP 3: Export the constants in contract_addresses.ts
  // let constantsTemplate = fs.readFileSync(
  //   "./bootstrap/templates/contract_addresses.template.ts"
  // );
  // let constantString = "";
  // for (const constant in constants) {
  //   const constantValue = constants[constant];
  //   constantString = constantString.concat(
  //     constantsTemplate
  //       .toString()
  //       .replace("$CONST_NAME$", constant)
  //       .replace("$CONST_VALUE$", constantValue)
  //   );
  // }
  // fs.writeFileSync("./src/contract_addresses.ts", constantString);

  // STEP 4.1: Import the constants in utils.ts
  // let utilsContent = fs.readFileSync("./bootstrap/templates/utils.template.ts");
  // let importString = "";
  // for (const constant in constants) {
  //   importString = importString.concat(constant.concat(", "));
  // }
  // utilsContent = utilsContent
  //   .toString()
  //   .replace("$CONSTANTS_IMPORT$", importString);

  // STEP 4.2: Fill the addressToContractName function in utils.ts
  // let mappingTemplate = `if (contract == $1) return "$2";`;
  // let mappingString = "";
  // for (const constant in constants) {
  //   mappingString = mappingString.concat(
  //     mappingTemplate
  //       .toString()
  //       .replace("$1", constant)
  //       .replace("$2", constant)
  //       .concat("\n\t")
  //   );
  // }
  // mappingString = mappingString.concat(`return "UNKNOWN";`);
  // utilsContent = utilsContent.toString().replace("$CONTRACT_MAP$", mappingString);
  // fs.writeFileSync("./src/utils.ts", utilsContent);

  // // STEP 5: Specify the ERC721 contract in the import of the erc721_mapping.ts
  // let erc721_mapping_content = fs.readFileSync(
  //   "./bootstrap/templates/erc721_mapping.template.ts"
  // );
  // erc721_mapping_content = erc721_mapping_content
  //   .toString()
  //   .replace("$ERC721_CONTRACT$", monitoredERC721[0]);
  // fs.writeFileSync("./src/erc721_mapping.ts", erc721_mapping_content);

  // // STEP 6: Specify the ERC20 contract in the import of the erc20_mapping.ts
  // let erc20_mapping_content = fs.readFileSync(
  //   "./bootstrap/templates/erc20_mapping.template.ts"
  // );
  // erc20_contract = paymentTokens.find((e) => e.toLowerCase() !== "eth");
  // erc20_mapping_content = erc20_mapping_content
  //   .toString()
  //   .replace("$ERC20_CONTRACT$", erc20_contract);
  // fs.writeFileSync("./src/erc20_mapping.ts", erc20_mapping_content);

  // STEP 7: DONE
  console.log(
    `
    Bootstrap done !
    Your subgraph will be indexing all vaults at address:
        MONITORED_VAULTS
    You can now deploy your subgraph and start indexing :)
    Run: 
        graph deploy --studio <your_sub_graph_slug>
                    OR
        graph deploy --hosted <your_sub_graph_slug>
`.replace("MONITORED_VAULTS", monitoredVaults.join(", "))
  );
}

bootstrap();
