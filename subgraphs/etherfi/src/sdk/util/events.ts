import { BigInt, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  BIGINT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  ZERO_ADDRESS,
} from "./constants";

export class CustomEventType {
  block: ethereum.Block;
  transaction: ethereum.Transaction;
  logIndex: BigInt;
  event: ethereum.Event | null;

  constructor() {
    this.block = new ethereum.Block(
      Bytes.empty(),
      Bytes.empty(),
      Bytes.empty(),
      Address.fromString(ZERO_ADDRESS),
      Bytes.empty(),
      Bytes.empty(),
      Bytes.empty(),
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      null,
      null
    );
    this.transaction = new ethereum.Transaction(
      Bytes.empty(),
      BIGINT_ZERO,
      Address.fromString(ZERO_ADDRESS),
      null,
      BIGINT_ZERO,
      BIGINT_ZERO,
      BIGINT_ZERO,
      Bytes.empty(),
      BIGINT_ZERO
    );
    this.logIndex = BIGINT_ZERO;
    this.event = null;
  }

  static initialize(
    block: ethereum.Block,
    transaction: ethereum.Transaction,
    logIndex: BigInt,
    event: ethereum.Event | null = null
  ): CustomEventType {
    const customEvent = new CustomEventType();
    customEvent.block = block;
    customEvent.transaction = transaction;
    customEvent.logIndex = logIndex;
    customEvent.event = event;

    return customEvent;
  }
}

export function getUnixDays(block: ethereum.Block): i32 {
  return block.timestamp.toI32() / SECONDS_PER_DAY;
}

export function getUnixHours(block: ethereum.Block): i32 {
  return block.timestamp.toI32() / SECONDS_PER_HOUR;
}
