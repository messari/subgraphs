import { ethereum, arweave, cosmos, near, log } from "@graphprotocol/graph-ts";
import { Author } from "../generated/schema";
import { BIGINT_ZERO, INT_ZERO, NETWORK_NAME } from "./constants";
import {
  createBlock,
  getOrCreateNetwork,
  updateMetrics,
  updateNetwork,
} from "./helper";

/////////////////
//// Classes ////
/////////////////

// TODO add classes for passing into helper functions

////////////////////////
//// Block Handlers ////
////////////////////////

export function handleArweaveBlock(block: arweave.Block): void {
  log.warning("handleArweaveBlock", []);
}

export function handleCosmosBlock(block: cosmos.Block): void {}

export function handleEvmBlock(block: ethereum.Block): void {
  createBlock(block);

  // update network entity
  let network = updateNetwork(block);

  // update author entity
  let authorId = block.author.toHexString();
  let author = Author.load(authorId);
  if (!author) {
    author = new Author(authorId);
    author.cumulativeBlocksCreated = INT_ZERO;
    author.cumulativeDifficulty = BIGINT_ZERO;
    author.cumulativeRewards = BIGINT_ZERO;
    author.save();

    // update unique authors
    network.cumulativeUniqueAuthors++;
    network.save();
  }
  author.cumulativeBlocksCreated++;
  author.cumulativeDifficulty = author.cumulativeDifficulty.plus(
    block.difficulty
  );
  author.save();

  // create/update daily/hourly metrics
  updateMetrics(block, network);
}

export function handleNearBlock(block: cosmos.Block): void {
  log.warning("handleNearBlock {}", [block.header.height.toString()]);
  getOrCreateNetwork(NETWORK_NAME);
}
