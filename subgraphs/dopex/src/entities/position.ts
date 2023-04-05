import { ethereum, Bytes, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Account, LiquidityPool, Position } from "../../generated/schema";
import { updateAccountOpenPositionCount } from "./account";
import { updatePoolOpenPositionCount } from "./pool";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  PRICE_PRECISION,
} from "../utils/constants";
import {
  bigDecimalToBigInt,
  convertTokenToDecimal,
  exponentToBigDecimal,
} from "../utils/numbers";
import { getOption } from "./option";
import { Ssov } from "../../generated/BasicWeeklyCalls/Ssov";

export function getUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  epoch: i32,
  strike: BigInt,
  optionType: string
): Position | null {
  const positionId = getPositionID(account, pool, epoch, strike, optionType);
  return Position.load(positionId);
}

export function createUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  epoch: BigInt,
  optionAmount: BigInt,
  strike: BigInt,
  purchasePremiumUSD: BigDecimal,
  optionType: string
): Position {
  const positionId = getPositionID(account, pool, epoch, strike, optionType);
  const position = new Position(positionId);
  position.pool = pool.id;
  position.account = account.id;
  position.asset = pool._underlyingAsset;
  position.option = getOption(event, pool, epoch, strike, optionType)!.id;
  position.takenHash = event.transaction.hash;
  position.takenBlockNumber = event.block.number;
  position.takenTimestamp = event.block.timestamp;

  let takenPrice = BIGDECIMAL_ZERO;
  const ssoveContract = Ssov.bind(event.address);
  const tryGetUnderlyingPrice = ssoveContract.try_getUnderlyingPrice();
  if (!tryGetUnderlyingPrice.reverted) {
    takenPrice = tryGetUnderlyingPrice.value.divDecimal(PRICE_PRECISION);
  }
  position.takenPrice = takenPrice;
  position.premiumUSD = purchasePremiumUSD;
  if (takenPrice > BIGDECIMAL_ZERO) {
    position.premium = bigDecimalToBigInt(
      purchasePremiumUSD
        .times(exponentToBigDecimal(DEFAULT_DECIMALS))
        .div(takenPrice)
    );
  }

  position.amount = optionAmount;
  position.amountUSD = convertTokenToDecimal(optionAmount).times(
    position.takenPrice
  );

  position.save();

  updateAccountOpenPositionCount(account, true);
  updatePoolOpenPositionCount(event, pool, true);

  return position;
}

export function closeUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  epoch: BigInt,
  strike: BigInt,
  optionType: string
): void {
  const positionId = getPositionID(account, pool, epoch, strike, optionType);
  const position = Position.load(positionId);
  if (!position) {
    return;
  }

  position.exercisedBlockNumber = event.block.number;
  position.exercisedTimestamp = event.block.timestamp;

  position.closedBlockNumber = event.block.number;
  position.closedTimestamp = event.block.timestamp;
  position.closePremiumUSD = BIGDECIMAL_ZERO;

  position.save();

  updateAccountOpenPositionCount(account, false);
  updatePoolOpenPositionCount(event, pool, false);
}

function getPositionID(
  account: Account,
  pool: LiquidityPool,
  epoch: BigInt,
  strike: BigInt,
  optionType: string
): Bytes {
  return account.id
    .concat(pool.id)
    .concat(Bytes.fromUTF8(optionType))
    .concat(Bytes.fromUTF8(epoch.toString()))
    .concat(Bytes.fromUTF8(strike.toString()));
}
