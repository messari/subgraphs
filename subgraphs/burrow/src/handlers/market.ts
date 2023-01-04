import { BigInt, log, JSONValueKind } from "@graphprotocol/graph-ts";
import { getOrCreateMarket } from "../helpers/market";
import { getOrCreateToken } from "../helpers/token";
import {
  assets,
  BIGDECIMAL_100,
  BIGDECIMAL_TWO,
  NANOSEC_TO_SEC,
  NANOS_TO_MS,
} from "../utils/const";
import { getOrCreateProtocol } from "../helpers/protocol";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { EventData } from "../utils/type";

export function handleNewAsset(event: EventData): void {
  const data = event.data;
  const receipt = event.receipt;
  const token_id = data.get("token_id");
  if (!token_id) {
    log.info("NEW_ASSET::Token ID not found", []);
    return;
  }
  const token = getOrCreateToken(token_id.toString());
  const market = getOrCreateMarket(token_id.toString());

  const assetConfigObj = data.get("asset_config");
  if (!assetConfigObj) {
    log.info("NEW_ASSET::Data not found", []);
    return;
  }
  if (assetConfigObj.kind != JSONValueKind.OBJECT) {
    log.info("NEW_ASSET::Incorrect type assetConfigObj {}", [
      assetConfigObj.kind.toString(),
    ]);
    return;
  }
  const assetConfig = assetConfigObj.toObject();

  market.name = token.name;

  market.createdBlockNumber = BigInt.fromU64(receipt.block.header.height);
  market.createdTimestamp = BigInt.fromU64(
    NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
  );

  market._lastUpdateTimestamp = BigInt.fromU64(
    NANOS_TO_MS(receipt.block.header.timestampNanosec)
  );

  /* -------------------------------------------------------------------------- */
  /*                                reserve_ratio                               */
  /* -------------------------------------------------------------------------- */
  const reserve_ratio = assetConfig.get("reserve_ratio");
  if (!reserve_ratio) {
    log.info("NEW_ASSET::Reserve ratio not found", []);
    return;
  }
  market._reserveRatio = BigInt.fromI64(reserve_ratio.toI64());

  /* -------------------------------------------------------------------------- */
  /*                             target_utilization                             */
  /* -------------------------------------------------------------------------- */
  const target_utilization = assetConfig.get("target_utilization");
  if (!target_utilization) {
    log.info("NEW_ASSET::Target utilization not found", []);
    return;
  }
  market._targetUtilization = BigInt.fromI64(target_utilization.toI64());

  /* -------------------------------------------------------------------------- */
  /*                          _targetUtilization_rate                          */
  /* -------------------------------------------------------------------------- */
  const target_utilization_rate = assetConfig.get("target_utilization_rate");
  if (!target_utilization_rate) {
    log.info("NEW_ASSET::Target utilization rate not found", []);
    return;
  }
  market._targetUtilizationRate = BigInt.fromString(
    target_utilization_rate.toString()
  );

  /* -------------------------------------------------------------------------- */
  /*                            max_utilization_ratȩ                           */
  /* -------------------------------------------------------------------------- */
  const max_utilization_rate = assetConfig.get("max_utilization_rate");
  if (!max_utilization_rate) {
    log.info("NEW_ASSET::Max utilization rate not found", []);
    return;
  }
  market._maxUtilizationRate = BigInt.fromString(
    max_utilization_rate.toString()
  );

  /* -------------------------------------------------------------------------- */
  /*                              volatility_ratio                              */
  /* -------------------------------------------------------------------------- */
  const volatility_ratio = assetConfig.get("volatility_ratio");
  if (!volatility_ratio) {
    log.info("NEW_ASSET::Volatility ratio not found", []);
    return;
  }
  market.maximumLTV = BigDecimal.fromString(
    volatility_ratio.toI64().toString()
  ).div(BIGDECIMAL_100);
  market.liquidationThreshold = BigDecimal.fromString(
    volatility_ratio.toI64().toString()
  ).div(BIGDECIMAL_100);
  market.liquidationPenalty = BIGDECIMAL_100.minus(
    market.liquidationThreshold
  ).div(BIGDECIMAL_TWO);

  /* -------------------------------------------------------------------------- */
  /*                              extra_decimals                                */
  /* -------------------------------------------------------------------------- */
  market.inputToken = token.id;
  const extra_decimals = assetConfig.get("extra_decimals");
  if (!extra_decimals) {
    log.info("NEW_ASSET::extra_decimals ratio not found", []);
    return;
  }
  token.extraDecimals = extra_decimals.toI64() as i32;
  const asset = assets.get(token_id.toString());
  if (asset) {
    token.extraDecimals = asset.extraDecimals as i32;
  }

  /* -------------------------------------------------------------------------- */
  /*                          can_use_as_collateral                             */
  /* -------------------------------------------------------------------------- */
  const can_use_as_collateral = assetConfig.get("can_use_as_collateral");
  if (!can_use_as_collateral) {
    log.info("NEW_ASSET::can_use_as_collateral not found {}", []);
    return;
  }
  market.canUseAsCollateral = can_use_as_collateral.toBool();

  /* -------------------------------------------------------------------------- */
  /*                                 can_borrow                                 */
  /* -------------------------------------------------------------------------- */
  const can_borrow = assetConfig.get("can_borrow");
  if (!can_borrow) {
    log.info("NEW_ASSET::can_borrow not found {}", []);
    return;
  }
  market.canBorrowFrom = can_borrow.toBool();

  /* -------------------------------------------------------------------------- */
  /*                       can_deposit && can_withdraw                          */
  /* -------------------------------------------------------------------------- */
  const can_deposit = assetConfig.get("can_deposit");
  if (!can_deposit) {
    log.info("NEW_ASSET::can_deposit not found {}", []);
    return;
  }
  const can_withdraw = assetConfig.get("can_withdraw");
  if (!can_withdraw) {
    log.info("NEW_ASSET::can_withdraw not found {}", []);
    return;
  }
  market.isActive = can_deposit.toBool() && can_withdraw.toBool();

  // Save
  token.save();
  market.save();

  // save to protocol data
  const protocol = getOrCreateProtocol();
  const tempMarkets = protocol._marketIds;
  tempMarkets.push(market.id);
  protocol._marketIds = tempMarkets;

  protocol.totalPoolCount += 1;
  protocol.save();
}

export function handleUpdateAsset(event: EventData): void {
  const data = event.data;
  const receipt = event.receipt;

  const token_id = data.get("token_id");
  if (!token_id) {
    log.info("NEW_ASSET::Token ID not found {}", []);
    return;
  }
  const token = getOrCreateToken(token_id.toString());
  const market = getOrCreateMarket(token_id.toString());

  const assetConfigObj = data.get("asset_config");
  if (!assetConfigObj) {
    log.info("NEW_ASSET::Data not found {}", []);
    return;
  }
  if (assetConfigObj.kind != JSONValueKind.OBJECT) {
    log.info("NEW_ASSET::Incorrect type assetConfigObj {}", [
      assetConfigObj.kind.toString(),
    ]);
    return;
  }
  const assetConfig = assetConfigObj.toObject();

  market._lastUpdateTimestamp = BigInt.fromU64(
    NANOS_TO_MS(receipt.block.header.timestampNanosec)
  );

  /* -------------------------------------------------------------------------- */
  /*                                reserve_ratio                               */
  /* -------------------------------------------------------------------------- */
  const reserve_ratio = assetConfig.get("reserve_ratio");
  if (!reserve_ratio) {
    log.info("NEW_ASSET::Reserve ratio not found {}", []);
    return;
  }
  market._reserveRatio = BigInt.fromI64(reserve_ratio.toI64());

  /* -------------------------------------------------------------------------- */
  /*                             target_utilization                             */
  /* -------------------------------------------------------------------------- */
  const target_utilization = assetConfig.get("target_utilization");
  if (!target_utilization) {
    log.info("NEW_ASSET::Target utilization not found {}", []);
    return;
  }
  market._targetUtilization = BigInt.fromI64(target_utilization.toI64());

  /* -------------------------------------------------------------------------- */
  /*                          _targetUtilization_rate                          */
  /* -------------------------------------------------------------------------- */
  const target_utilization_rate = assetConfig.get("target_utilization_rate");
  if (!target_utilization_rate) {
    log.info("NEW_ASSET::Target utilization rate not found {}", []);
    return;
  }
  market._targetUtilizationRate = BigInt.fromString(
    target_utilization_rate.toString()
  );

  /* -------------------------------------------------------------------------- */
  /*                            max_utilization_ratȩ                           */
  /* -------------------------------------------------------------------------- */
  const max_utilization_rate = assetConfig.get("max_utilization_rate");
  if (!max_utilization_rate) {
    log.info("NEW_ASSET::Max utilization rate not found {}", []);
    return;
  }
  market._maxUtilizationRate = BigInt.fromString(
    max_utilization_rate.toString()
  );

  /* -------------------------------------------------------------------------- */
  /*                              volatility_ratio                              */
  /* -------------------------------------------------------------------------- */
  const volatility_ratio = assetConfig.get("volatility_ratio");
  if (!volatility_ratio) {
    log.info("NEW_ASSET::Volatility ratio not found {}", []);
    return;
  }
  market._volatilityRatio = BigInt.fromI64(volatility_ratio.toI64());

  /* -------------------------------------------------------------------------- */
  /*                              extra_decimals                                */
  /* -------------------------------------------------------------------------- */
  market.inputToken = token.id;
  const extra_decimals = assetConfig.get("extra_decimals");
  if (!extra_decimals) {
    log.info("NEW_ASSET::extra_decimals ratio not found {}", []);
    return;
  }
  token.extraDecimals = extra_decimals.toI64() as i32;
  const asset = assets.get(token_id.toString());
  if (asset) {
    token.extraDecimals = asset.extraDecimals as i32;
  }

  /* -------------------------------------------------------------------------- */
  /*                          can_use_as_collateral                             */
  /* -------------------------------------------------------------------------- */
  const can_use_as_collateral = assetConfig.get("can_use_as_collateral");
  if (!can_use_as_collateral) {
    log.info("NEW_ASSET::can_use_as_collateral not found {}", []);
    return;
  }
  market.canUseAsCollateral = can_use_as_collateral.toBool();

  /* -------------------------------------------------------------------------- */
  /*                                 can_borrow                                 */
  /* -------------------------------------------------------------------------- */
  const can_borrow = assetConfig.get("can_borrow");
  if (!can_borrow) {
    log.info("NEW_ASSET::can_borrow not found {}", []);
    return;
  }
  market.canBorrowFrom = can_borrow.toBool();

  /* -------------------------------------------------------------------------- */
  /*                       can_deposit && can_withdraw                          */
  /* -------------------------------------------------------------------------- */
  const can_deposit = assetConfig.get("can_deposit");
  if (!can_deposit) {
    log.info("NEW_ASSET::can_deposit not found {}", []);
    return;
  }
  const can_withdraw = assetConfig.get("can_withdraw");
  if (!can_withdraw) {
    log.info("NEW_ASSET::can_withdraw not found {}", []);
    return;
  }
  market.isActive = can_deposit.toBool();

  // Save
  token.save();
  market.save();
}
