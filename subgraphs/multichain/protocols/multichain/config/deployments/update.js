/////////////////////////////////////

// multichain supports two methods of bridging,

// [LOCK_RELEASE<>BURN_MINT]: v2 (Bridge)
// On origin chain, asset is locked in a wallet.
// On the destination chain, a smart contract mints tokens 1:1 and sends them to the user's wallet.

// [LIQUIDITY<>LIQUIDITY]: v3+ (Router)
// On the origin chain, the asset is added to the pool. The same number of anyAsset are minted.
// The SMPC node network detects this and causes anyAsset to be minted on destnation chain, burning those on origin chain.
// If enough liquidity in destination pool, then the asset are sent to the user's wallet on destination chain and the anyAsset are burned on destination chain.
// If not enough liquidity, then the user is left with their anyAsset and this represents their pool share to be redeemed later by them for asset when there is enough liquidity.

// v2 (Bridge) assets predate Router. Hence, we need to track events on v2 bridge assets in addition to v3+ routers.
// Exhaustive list of these bridges and routers are obtained from multichain API.
// This script help in converting multichain API's response to a form we use in out deployment config files (api.ts and configurations.json).

/////////////////////////////////////

// constants

const networkMap = {
  arbitrum: "42161",
  avalanche: "43114",
  bsc: "56",
  celo: "42220",
  ethereum: "1",
  fantom: "250",
  gnosis: "100",
  optimism: "10",
  polygon: "137",
};

const nonEVMids = {
  LTC: "1000005002307",
  BTC: "1000004346947",
  COLX: "1001129270360",
  BLOCK: "1284748104523",
  NEAR: "1001313161554",
  XRP: "1000005788240",
  APT: "1000004280404",
  NAS: "1000005128531",
  TERRA: "1361940275777",
  ADA: "1000004277313",
  SOL: "1000005459788",
};

const routerTypes = ["UNDERLYINGV2", "NON_EVM", "ROUTER", "NATIVE", "STABLEV3"];

// helpers

function sanitizeCrosschainID(crosschainID) {
  if (nonEVMids[crosschainID]) {
    return nonEVMids[crosschainID];
  }
  if (isNaN(crosschainID)) {
    return "0";
  }

  return crosschainID;
}

const regex = /[0-9A-Fa-fx]{42}/g;
function isValidAddress(address) {
  if (address.length != 42 || !address.match(regex)) {
    return false;
  }

  return true;
}

function sanitizeCrosschainTokenAddr(crosschainTokenAddr) {
  if (!isValidAddress(crosschainTokenAddr)) {
    return "0xffffffffffffffffffffffffffffffffffffffff";
  }

  return crosschainTokenAddr;
}

// apis

async function getMultichainData(network) {
  const networkID = networkMap[network];

  const resp = await fetch(
    "https://bridgeapi.anyswap.exchange/v4/tokenlistv4/" + networkID
  );

  return await resp.json();
}

async function getMiniscanData(network, address) {
  const resp = await fetch(
    "https://miniscan.xyz/api/contract?" +
      new URLSearchParams({
        network: network,
        address: address,
      })
  );

  return await resp.json();
}

// main

const routers = new Set();
const bridges = new Set();

let bridgeAPIResponse = {};
let routerAPIResponse = {};

let bridgeConfig = [];
let routerConfig = [];

let finalOutput = {};

async function updateDeployment(network) {
  if (!networkMap[network]) {
    console.error("unsupported network: " + network);
    process.exit(0);
  }

  const multichainData = await getMultichainData(network);

  for (const k1 in multichainData) {
    const v1 = multichainData[k1];
    for (const k2 in v1["destChains"]) {
      const crosschainID = sanitizeCrosschainID(String(k2));
      const v2 = v1["destChains"][k2];
      for (const k3 in v2) {
        const v3 = v2[k3];

        let fromAnyToken = v3["fromanytoken"]["address"].toLowerCase();
        if (!isValidAddress(fromAnyToken)) {
          fromAnyToken = v3["address"].toLowerCase();
        }

        const crosschainTokenAddr = sanitizeCrosschainTokenAddr(
          "anytoken" in v3
            ? v3["anytoken"]["address"].toLowerCase()
            : v3["address"].toLowerCase()
        );
        const swapFeeRatePerMillion =
          "SwapFeeRatePerMillion" in v3 && v3["SwapFeeRatePerMillion"] != null
            ? String(v3["SwapFeeRatePerMillion"])
            : "0";
        const minimumSwapFee =
          "MinimumSwapFee" in v3 && v3["MinimumSwapFee"] != null
            ? String(v3["MinimumSwapFee"])
            : "0";
        const maximumSwapFee =
          "MaximumSwapFee" in v3 && v3["MaximumSwapFee"] != null
            ? String(v3["MaximumSwapFee"])
            : "0";

        if (v3["type"] == "swapout") {
          bridges.add(fromAnyToken);

          bridgeAPIResponse[fromAnyToken] = [
            crosschainID,
            crosschainTokenAddr,
            swapFeeRatePerMillion + "," + minimumSwapFee + "," + maximumSwapFee,
          ];
        } else if (routerTypes.includes(v3["type"])) {
          routers.add(v3["router"]);

          routerAPIResponse[fromAnyToken + ":" + crosschainID] = [
            crosschainTokenAddr,
            swapFeeRatePerMillion + "," + minimumSwapFee + "," + maximumSwapFee,
          ];
        }
      }
    }
  }

  let count = 0;
  for (const b of bridges) {
    try {
      const miniscanData = await getMiniscanData(network, b);

      bridgeConfig.push({
        name: "BridgeV2-" + count,
        address: String(b),
        abi: "anyToken",
        startBlock: Number(miniscanData["data"]["StartBlock"]),
      });
      count++;
    } catch (err) {
      console.error("no miniscan data for bridge address: " + b);
      continue;
    }
  }

  count = 0;
  for (const r of routers) {
    try {
      const miniscanData = await getMiniscanData(network, r);

      routerConfig.push({
        name: "Router-" + count,
        address: String(r),
        abi: "Router",
        startBlock: Number(miniscanData["data"]["StartBlock"]),
      });
      count++;
    } catch (err) {
      console.error("no miniscan data for router address: " + r);
      continue;
    }
  }

  finalOutput = {
    bridgeAPIResponse: bridgeAPIResponse,
    routerAPIResponse: routerAPIResponse,
    bridgeConfig: bridgeConfig,
    routerConfig: routerConfig,
  };

  const fs = require("fs");
  fs.writeFileSync("./out.json", JSON.stringify(finalOutput), (err) => {
    if (err) {
      console.error("failed to write output to file with error: " + err);
    }
  });

  process.exit(0);
}

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter network: ", function (network) {
  updateDeployment(network);
});
