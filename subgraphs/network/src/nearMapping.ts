import {
    ethereum,
    BigInt,
    BigDecimal,
    arweave,
    cosmos,
    near,
    log
  } from "@graphprotocol/graph-ts";
  import {
    ActiveAuthor,
    Author,
    Block,
    Network,
    DailySnapshot,
    HourlySnapshot,
  } from "../generated/schema";
  import {
    BIGDECIMAL_ZERO,
    BIGINT_ZERO,
    IntervalType,
    INT_TWO,
    INT_ZERO,
    METHODOLOGY_VERSION,
    NETWORK_NAME,
    SCHEMA_VERSION,
    SECONDS_PER_DAY,
    SECONDS_PER_HOUR,
    SUBGRAPH_VERSION,
  } from "./constants";
import { getOrCreateNetwork } from "./mapping";
  import { exponentToBigDecimal, getBlocksPerDay } from "./utils";

///////////////////////
//// Block Handler ////
///////////////////////

export function handleNearBlock(block: near.Block): void {
    log.warning("handleNearBlock {}", [block.header.height.toString()]);
    getOrCreateNetwork(NETWORK_NAME);
  }