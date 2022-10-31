/* eslint-disable */
const Web3 = require("web3");
const writeYamlFile = require("write-yaml-file");
const EthDater = require("ethereum-block-by-date");
const moment = require("moment");

// public network RPCs
// must have the same network names as ./data/...
const providers = [
  {
    bsc: "https://rpc.ankr.com/bsc",
    avalanche: "https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc	",
    heco: "https://http-mainnet.hecochain.com",
    polygon: "https://matic-mainnet-full-rpc.bwarelabs.com",
    fantom: "https://rpc.ankr.com/fantom",
    harmony: "https://api.harmony.one",
    arbitrum: "https://arb1.arbitrum.io/rpc	",
    celo: "https://forno.celo.org	",
    moonriver: "https://moonriver.public.blastapi.io",
    cronos: "https://evm.cronos.org	",
    fuse: "https://rpc.fuse.io",
    metis: "https://andromeda.metis.io/?owner=1088",
    aurora: "https://mainnet.aurora.dev",
    moonbeam: "https://rpc.ankr.com/moonbeam",
    oasis: "https://emerald.oasis.dev",
    optimism: "https://rpc.ankr.com/optimism",
  },
];

async function main(network) {
  // setup web3 for given network
  if (!providers[0][network]) {
    console.log(`ERROR: No RPC for network ${network}`);
    return;
  }
  const web3 = new Web3(providers[0][network]);

  // get the list of vaults from ./data
  try {
    var networkVaultList = require(`./data/${network}.json`);
  } catch (e) {
    console.log(`ERROR: ./data/${network}.json not found`);
    return;
  }

  if (networkVaultList.length == 0) {
    console.log(`ERROR: no vaults found for network ${network}`);
    return;
  }

  // normalize network name to the graph constants
  // polygon -> matic
  // arbitrum -> arbitrum-one
  var coloquialNetworkName = network;
  if (network == "polygon") {
    network = "matic";
  }
  if (network == "arbitrum") {
    network = "arbitrum-one";
  }

  // begin the building of the manifest file
  let manifest = createManifestHeader();
  // this dataSource acts as a standard across all networks in order to provide standard build inputs
  manifest["dataSources"].push(
    createNewDataSource(
      "Standard",
      "0x0000000000000000000000000000000000000000",
      0,
      network
    )
  );

  // loop through vaults as defined in ./data/{network}.json
  // add each new strategy in the list to the manifest
  let i = 0;
  for (; i < networkVaultList.length; i++) {
    // skip BIFI staking pools
    if (networkVaultList[i].isGovVault) {
      console.log(`Skipping BIFI staking pool ${networkVaultList[i].name}`);
      continue;
    }

    const strategyAddress = await getStrategyAddress(
      web3,
      networkVaultList[i].earnContractAddress
    );
    const startBlock = await getStartBlockByTimestamp(
      web3,
      networkVaultList[i].createdAt
    );

    // add this strategy to the manifest
    manifest["dataSources"].push(
      createNewDataSource(
        networkVaultList[i].id,
        strategyAddress,
        startBlock,
        network
      )
    );

    console.log(`writing strategy ${networkVaultList[i].id} to manifest`);
    if ((i + 1) % 5 == 0) {
      console.log(`processed ${i + 1} vaults`);
    }
  }

  const templateLocation = `./protocols/beefy-finance/config/templates/beefy.${coloquialNetworkName}.template.yaml`;
  await writeYamlFile(templateLocation, manifest);
  console.log(
    `SUCCESS: wrote template to ${templateLocation} with ${i + 1} vaults`
  );
}

// get the strategy address from the vault
async function getStrategyAddress(web3, vaultAddress) {
  const vaultContract = new web3.eth.Contract(
    require(`../abis/BeefyVault.json`),
    vaultAddress
  );
  return await vaultContract.methods.strategy().call();
}

async function getStartBlockByTimestamp(web3, timestamp) {
  const dater = new EthDater(web3);
  return (await dater.getDate(moment.unix(timestamp).format(), false, false))
    .block;
}

function createManifestHeader() {
  return {
    specVersion: "0.0.5",
    schema: {
      file: "./schema.graphql",
    },
    dataSources: [],
  };
}

function createNewDataSource(
  contractName,
  contractAddress,
  startBlock,
  network
) {
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
      entities: [],
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
          name: "UniswapFeeRouter",
          file: "./abis/Prices/Uniswap/FeeRouter.json",
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
        {
          event: "StratHarvest(indexed address,uint256,uint256)",
          handler: "handleStratHarvestWithAmount",
        },
        {
          event: "StratHarvest(indexed address)",
          handler: "handleStratHarvest",
        },
        {
          event: "StratHarvest(indexed address,indexed uint256)",
          handler: "handleStratHarvest",
        },
        {
          event: "ChargedFees(uint256,uint256,uint256)",
          handler: "handleChargedFees",
        },
      ],
      file: "./src/mappings/vault.ts",
    },
  };

  return dataSource;
}

// call main (starter function) using the network as an argument
main(process.argv.slice(2)[0]);
