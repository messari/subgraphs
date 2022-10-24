/* eslint-disable */
const oracles = require("../ChainLinkAddresses");
const ethers = require("ethers");
const chainLinkAbi = require("../../../../abis/Chainlink.json");
const fs = require("fs");
require("dotenv").config();

async function findAssets() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ALCHEMY_POLYGON
  );
  const signer = new ethers.Wallet(
    process.env.TEST_PRIVATE_KEY || "",
    provider
  );

  let contract, asset, denominator;
  let oraclesJson = { polygon: [] };

  for (let i = 0; i < oracles.constants.polygonChainLinkOracles.length; i++) {
    contract = new ethers.Contract(
      oracles.constants.polygonChainLinkOracles[i],
      chainLinkAbi,
      signer
    );
    [asset, , denominator] = (await contract.description()).split(" ");
    if (denominator === "USD") {
      oraclesJson.polygon.push(
        oracleTemplate(
          oracles.constants.polygonChainLinkOracles[i].toString(),
          asset
        )
      );
      console.log("saving data for " + asset + " oracle");
    }
  }
  fs.writeFileSync(
    "./src/prices/oracles/oracles.json",
    JSON.stringify(oraclesJson)
  );
}

function oracleTemplate(address, asset) {
  template = [asset, address];
  return template;
}

findAssets();
