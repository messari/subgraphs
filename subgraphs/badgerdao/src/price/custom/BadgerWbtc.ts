import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ChainLinkSolo } from "../../../generated/bBadger/ChainLinkSolo";
import { ERC20 } from "../../../generated/bBadger/ERC20";
import { PoolContract } from "../../../generated/bBadger/PoolContract";
import {
  BADGER_TOKEN,
  BADGER_WBTC_POOL_CONTRACT,
  BIGINT_TEN,
  BIGINT_ZERO,
  CHAINLINK_BADGER_USD,
  CHAINLINK_BTC_USD,
  WBTC_TOKEN,
} from "../../constant";
import { CustomPriceType } from "../common/types";
import { getTokenDecimals, readValue } from "../common/utils";

export function getUsdPriceOfBadgerWbtcToken(tokenAddress: Address): CustomPriceType {
  let poolContract = PoolContract.bind(BADGER_WBTC_POOL_CONTRACT);
  let lpContract = ERC20.bind(tokenAddress);

  let totalLPSupply = readValue<BigInt>(lpContract.try_totalSupply(), BIGINT_ZERO);
  if (totalLPSupply.isZero()) {
    return new CustomPriceType();
  }

  let tokenA = BADGER_TOKEN;
  let tokenADecimals = BIGINT_TEN.pow(getTokenDecimals(tokenA).toI32() as u8);
  let tokenABalance = readValue<BigInt>(
    poolContract.try_balances(BigInt.fromString("0")),
    BIGINT_ZERO,
  );
  let tokenAPrice = getPriceFromChainlink(CHAINLINK_BADGER_USD);
  let totalPriceOfTokenA = tokenAPrice.times(
    tokenABalance.toBigDecimal().div(tokenADecimals.toBigDecimal()),
  );

  let tokenB = WBTC_TOKEN;
  let tokenBDecimals = BIGINT_TEN.pow(getTokenDecimals(tokenB).toI32() as u8);
  let tokenBBalance = readValue<BigInt>(
    poolContract.try_balances(BigInt.fromString("1")),
    BIGINT_ZERO,
  );
  let tokenBPrice = getPriceFromChainlink(CHAINLINK_BTC_USD);
  let totalPriceOfTokenB = tokenBPrice.times(
    tokenBBalance.toBigDecimal().div(tokenBDecimals.toBigDecimal()),
  );

  let totalValueOfPool = totalPriceOfTokenA.plus(totalPriceOfTokenB);
  let priceOfToken = totalValueOfPool.div(
    totalLPSupply.toBigDecimal().div(tokenADecimals.toBigDecimal()),
  );

  return CustomPriceType.initialize(priceOfToken, 0);
}

function getPriceFromChainlink(chainlinkAddress: Address): BigDecimal {
  let chainlinkContract = ChainLinkSolo.bind(chainlinkAddress);
  let decimals = readValue<i32>(chainlinkContract.try_decimals(), BigInt.fromString("8").toI32());
  let chainLinkDecimals = BIGINT_TEN.pow(decimals as u8);

  let price = readValue<BigInt>(chainlinkContract.try_latestAnswer(), BIGINT_ZERO);
  return price.toBigDecimal().div(chainLinkDecimals.toBigDecimal());
}
