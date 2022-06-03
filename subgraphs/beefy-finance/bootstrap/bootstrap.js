const fs = require("fs");
const writeYamlFile = require("write-yaml-file");
const ethers = require("ethers");
const { vaults } = require("./vaults");
const { providers } = require("./publicRpcs");
const vaultAbi = require("../abis/BeefyVault.json");
const { assert } = require("console");
require("dotenv").config();

const commentTag = "__comments";

let constants = {};
let monitoredVaults = [];

const chains = [
  "bsc",
  "avalanche",
  "heco", //not supported yet by theGraph
  "polygon",
  "fantom",
  "one", //not supported yet by theGraph
  "arbitrum-one",
  "celo",
  "moonriver",
  "cronos", //not supported yet by theGraph
  "fuse",
  "metis", //not supported yet by theGraph
  "aurora",
  "moonbeam", //not supported yet by theGraph
  "oasis", //not supported yet by theGraph
];

// STEP 1: Build the subgraph.yaml file
function createDataSource(contractName, contractAddress, network, startBlock) {
  let dataSource = {
    kind: "ethereum/contract",
    name: contractName,
    network: network,
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
        "VaultFee",
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

async function bootstrap(network) {
  //setup provider to get contract addresses
  let subgraphYamlDoc = {
    specVersion: "0.0.5",
    schema: {
      file: "./schema.graphql",
    },
    dataSources: [],
  };
  //loop through all the pools and get the strategy addresses
  let provider, signer, contract, strategyAddress, vaultName, startBlock;
  for (let i = 0; i < vaults.length; i++) {
    vaultNetwork = vaults[i].chain;
    if (vaultNetwork === network) {
      provider = new ethers.providers.JsonRpcProvider(providers[0][network]);
      signer = new ethers.Wallet(process.env.TEST_PRIVATE_KEY || "", provider);

      contract = new ethers.Contract(
        vaults[i].earnContractAddress,
        vaultAbi,
        signer
      );
      strategyAddress = vaults[i].strategyAddress;
      vaultName = vaults[i].id;

      if (contract.deployTransaction) {
        startBlock = contract.deployTransaction.blockNumber;
        if (!startBlock) {
          startBlock = 1;
        }
      } else {
        startBlock = 1;
      }

      console.log(
        "Adding " +
          vaultName +
          " on " +
          network +
          " with starting block " +
          startBlock +
          "..."
      );

      // Add the datasource
      subgraphYamlDoc["dataSources"].push(
        createDataSource(vaultName, strategyAddress, network, startBlock)
      );

      //add the strategy address to the list of monitored contracts
      monitoredVaults.push(vaultName);
    }
  }

  writeYamlFile("subgraph.yaml", subgraphYamlDoc).then(() => {});

  console.log(
    `
    Bootstrap done !
    Your subgraph will be indexing all vaults at address:
        MONITORED_VAULTS
    You can now deploy your subgraph and start indexing :)
    Run: 
        yarn deploy RiccardoGalbusera/beefy-finance-network
`
      .replace("MONITORED_VAULTS", monitoredVaults.join(", "))
      .replace("network", network)
  );
}

bootstrap(process.argv.slice(2)[0]);
