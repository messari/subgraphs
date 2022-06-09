import { ethereum } from "@graphprotocol/graph-ts";
import { Block, Blockchain, Miner } from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BLOCKCHAIN_NAME,
  INT_ZERO,
  MAX_SUPPLY,
  METHODOLOGY_VERSION,
  NATIVE_TOKEN,
  NATIVE_TOKEN_DECIMALS,
  SCHEMA_VERSION,
  SUBGRAPH_VERSION,
} from "./constants";

export function handleBlock(block: ethereum.Block): void {
  let blockEntity = new Block(block.hash.toHexString());

  blockEntity.blockNumber = block.number;
  blockEntity.timestamp = block.timestamp;
  blockEntity.size = block.size;
  blockEntity.baseFeePerGas = block.baseFeePerGas;
  blockEntity.difficulty = block.difficulty;
  blockEntity.totalDifficulty = block.totalDifficulty;
  blockEntity.gasLimit = block.gasLimit;
  blockEntity.gasUsed = block.gasUsed;
  blockEntity.parentHash = block.parentHash.toHexString();

  // get or create miner entity
  let miner = getOrCreateMiner(block.author.toHexString());
  miner.blocksMined++;
  miner.totalDifficulty = miner.totalDifficulty.plus(block.difficulty);
  miner.save();

  blockEntity.author = miner.id;
  blockEntity.save();

  // update blockchain entity
  let blockchain = getOrCreateBlockchain(NATIVE_TOKEN);
  blockchain.totalBlocksMined++;
  blockchain.totalDifficulty = block.totalDifficulty;
  // TODO: update blocksperday
  blockchain.save();
}

/////////////////
//// Getters ////
/////////////////

function getOrCreateBlockchain(id: string): Blockchain {
  let blockchain = Blockchain.load(id);
  if (!blockchain) {
    blockchain = new Blockchain(id);
    blockchain.schemaVersion = SCHEMA_VERSION;
    blockchain.subgraphVersion = SUBGRAPH_VERSION;
    blockchain.methodologyVersion = METHODOLOGY_VERSION;
    blockchain.decimals = NATIVE_TOKEN_DECIMALS;
    blockchain.name = BLOCKCHAIN_NAME;
    blockchain.maxSupply = MAX_SUPPLY;
    blockchain.currentSupply = BIGINT_ZERO;
    blockchain.totalBlocksMined = INT_ZERO;
    blockchain.totalDifficulty = BIGINT_ZERO;
    blockchain.blocksPerDay = BIGDECIMAL_ZERO;

    if (MAX_SUPPLY != BIGINT_ZERO) {
      blockchain.maxSupply = MAX_SUPPLY;
    }

    blockchain.save();
  }
  return blockchain;
}

// grab a miner entity or create a new one if it does not exist
function getOrCreateMiner(address: string): Miner {
  let miner = Miner.load(address);
  if (!miner) {
    miner = new Miner(address);
    miner.blocksMined = INT_ZERO;
    miner.totalDifficulty = BIGINT_ZERO;
    miner.totalRewards = BIGINT_ZERO;
    miner.save();
  }
  return miner;
}
