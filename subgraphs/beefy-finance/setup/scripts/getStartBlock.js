const fs = require("fs");
const ethers = require("ethers");
const { vaults } = require("../vaults");
const { providers } = require("./publicRpcs");
const EthDater = require("ethereum-block-by-date");
const moment = require("moment");
require("dotenv").config();

async function getStartBlock(timestamp, network) {
  const provider = new ethers.providers.JsonRpcProvider(providers[0][network]);
  const dater = new EthDater(provider);
  return (await dater.getDate(moment.unix(timestamp).format(), false, false))
    .block;
}

async function writeStartBlock() {
  let startBlock;
  let string = "const vaults = [";
  for (let i = 0; i < vaults.length; i++) {
    if (vaults[i].startBlock > 1) {
      startBlock = vaults[i].startBlock;
    } else {
      console.log(
        "Getting start block for vault " +
          vaults[i].id +
          " on network " +
          vaults[i].chain
      );
      try {
        startBlock = await getStartBlock(vaults[i].createdAt, vaults[i].chain);
      } catch (error) {
        try {
          startBlock = await getStartBlock(
            vaults[i].createdAt,
            vaults[i].chain
          );
        } catch (error) {
          console.log(error);
          startBlock = 1;
        }
      }
      console.log(
        "Start block found " +
          startBlock +
          " current progress: " +
          (i + 1) +
          "/" +
          vaults.length
      );
    }
    vaults[i].startBlock = startBlock;
    string = string.concat(JSON.stringify(vaults[i]) + ",");
  }
  console.log("Writing start blocks to file...");
  fs.writeFileSync(
    `./setup/vaults.js`,
    string + "]\nmodule.exports = {vaults}"
  );
}

writeStartBlock();
