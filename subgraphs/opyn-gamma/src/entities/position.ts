import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  Option,
  Position,
  _PositionCounter,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_EIGHT,
  INT_ONE,
  INT_ZERO,
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { getUnderlyingPrice } from "../price";
import {
  decrementAccountPositionCount,
  incrementAccountExercisedCount,
  incrementAccountPositionCount,
} from "./account";

export function updatePosition(
  event: ethereum.Event,
  account: Account,
  option: Option,
  netChange: BigInt
): void {
  let balance = netChange;
  // Check for existing open position and close it if it exists
  const position = closePosition(event, account, option);
  if (position) {
    balance = balance.plus(position.amount);
  }
  if (balance.gt(BIGINT_ZERO)) {
    openNewPosition(event, account, option, balance);
  }
}

export function exercisePosition(
  event: ethereum.Event,
  account: Account,
  option: Option
): void {
  const position = closePosition(event, account, option);
  if (position) {
    position.exercisedBlockNumber = event.block.number;
    position.exercisedTimestamp = event.block.timestamp;
    position.closedPriceUSD = option.expirationPriceUSD;
    position.save();
  }
  incrementAccountExercisedCount(event, account, option);
}

function openNewPosition(
  event: ethereum.Event,
  account: Account,
  option: Option,
  amount: BigInt
): void {
  const id = getPositionId(account, option);
  const position = new Position(id);
  position.option = option.id;
  position.pool = option.pool;
  position.account = account.id;
  position.asset = option.underlyingAsset;
  position.takenHash = event.transaction.hash;
  position.takenBlockNumber = event.block.number;
  position.takenTimestamp = event.block.timestamp;
  position.takenPrice = getUnderlyingPrice(event, option);
  position.premium = BIGINT_ZERO;
  position.premiumUSD = BIGDECIMAL_ZERO;
  position.amount = amount;
  position.amountUSD = bigIntToBigDecimal(amount, INT_EIGHT).times(
    position.takenPrice
  );
  position.save();
  incrementAccountPositionCount(event, account, option);
}

function closePosition(
  event: ethereum.Event,
  account: Account,
  option: Option
): Position | null {
  const position = Position.load(getPositionId(account, option));
  if (!position) {
    return null;
  }
  position.closedTimestamp = event.block.timestamp;
  position.closedBlockNumber = event.block.number;
  position.closedPriceUSD = getUnderlyingPrice(event, option);
  position.save();
  decrementAccountPositionCount(event, account, option);
  incrementPositionCounter(account, option);
  return position;
}

function loadPositionCounter(
  account: Account,
  option: Option
): _PositionCounter {
  const id = account.id.concat(option.id);
  let positionCounter = _PositionCounter.load(id);
  if (!positionCounter) {
    positionCounter = new _PositionCounter(id);
    positionCounter.nextCount = INT_ZERO;
    positionCounter.save();
  }
  return positionCounter;
}

function incrementPositionCounter(account: Account, option: Option): void {
  const counter = loadPositionCounter(account, option);
  counter.nextCount += INT_ONE;
  counter.save();
}

function getPositionId(account: Account, option: Option): Bytes {
  return account.id
    .concat(option.id)
    .concatI32(loadPositionCounter(account, option).nextCount);
}
