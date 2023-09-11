import * as BSC from "../config/bsc";
import * as CELO from "../config/celo";
import * as FUSE from "../config/fuse";
import * as XDAI from "../config/gnosis";
import * as CRONOS from "../config/cronos";
import * as AURORA from "../config/aurora";
import * as FANTOM from "../config/fantom";
import * as POLYGON from "../config/polygon";
import * as MAINNET from "../config/mainnet";
import * as HARMONY from "../config/harmony";
import * as MOONBEAM from "../config/moonbeam";
import * as OPTIMISM from "../config/optimism";
import * as AVALANCHE from "../config/avalanche";
import * as ARBITRUM_ONE from "../config/arbitrum";

import { Configurations, CustomPriceType } from "./types";
import * as constants from "./constants";
import * as TEMPLATE from "../config/template";
import { _ERC20 } from "../../../generated/Booster/_ERC20";
import {
  Address,
  BigInt,
  BigDecimal,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";

export function isNullAddress(tokenAddr: Address): boolean {
  return tokenAddr.equals(constants.NULL.TYPE_ADDRESS);
}

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = constants.DEFAULT_DECIMALS.toI32()
): BigDecimal {
  return quantity.divDecimal(
    constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal()
  );
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenName(tokenAddr: Address): string {
  const tokenContract = _ERC20.bind(tokenAddr);
  const name = readValue<string>(tokenContract.try_name(), "");

  return name;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const tokenContract = _ERC20.bind(tokenAddr);

  const decimals = readValue<BigInt>(
    tokenContract.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function getTokenSupply(tokenAddr: Address): BigInt {
  const tokenContract = _ERC20.bind(tokenAddr);

  const totalSupply = readValue<BigInt>(
    tokenContract.try_totalSupply(),
    constants.BIGINT_ONE
  );

  return totalSupply;
}

export function getConfig(): Configurations {
  const network = dataSource.network();

  if (network == XDAI.NETWORK_STRING) {
    return new XDAI.config();
  } else if (network == AURORA.NETWORK_STRING) {
    return new AURORA.config();
  } else if (network == BSC.NETWORK_STRING) {
    return new BSC.config();
  } else if (network == FANTOM.NETWORK_STRING) {
    return new FANTOM.config();
  } else if (network == POLYGON.NETWORK_STRING) {
    return new POLYGON.config();
  } else if (network == MAINNET.NETWORK_STRING) {
    return new MAINNET.config();
  } else if (network == HARMONY.NETWORK_STRING) {
    return new HARMONY.config();
  } else if (network == MOONBEAM.NETWORK_STRING) {
    return new MOONBEAM.config();
  } else if (network == OPTIMISM.NETWORK_STRING) {
    return new OPTIMISM.config();
  } else if (network == AVALANCHE.NETWORK_STRING) {
    return new AVALANCHE.config();
  } else if (network == ARBITRUM_ONE.NETWORK_STRING) {
    return new ARBITRUM_ONE.config();
  } else if (network == CRONOS.NETWORK_STRING) {
    return new CRONOS.config();
  } else if (network == CELO.NETWORK_STRING) {
    return new CELO.config();
  } else if (network == FUSE.NETWORK_STRING) {
    return new FUSE.config();
  }

  return new TEMPLATE.config();
}

function sortByPrices(prices: CustomPriceType[]): CustomPriceType[] {
  const pricesSorted = prices.sort(function (a, b) {
    const x = a.usdPrice;
    const y = b.usdPrice;

    if (x < y) return -1;
    if (x > y) return 1;
    return 0;
  });

  return pricesSorted;
}

function pairwiseDiffOfPrices(prices: CustomPriceType[]): BigDecimal[] {
  const diff: BigDecimal[] = [];
  for (let i = 1; i < prices.length; i++) {
    const x = prices[i].usdPrice;
    const y = prices[i - 1].usdPrice;

    diff.push(x.minus(y));
  }

  return diff;
}

export function kClosestPrices(
  k: i32,
  prices: CustomPriceType[]
): CustomPriceType[] {
  // sort by USD prices
  const pricesSorted = sortByPrices(prices);

  // pairwise difference in USD prices
  const pairwiseDiff = pairwiseDiffOfPrices(pricesSorted);

  // k minimum difference values and their original indexes
  const pairwiseDiffCopy = pairwiseDiff.map<BigDecimal>((x: BigDecimal) => x);
  const pairwiseDiffSortedSlice = pairwiseDiffCopy.sort().slice(0, k);
  const minDiffAtIdx: i32[] = [];
  for (let i = 0; i < pairwiseDiffSortedSlice.length; i++) {
    const idx = pairwiseDiff.indexOf(pairwiseDiffSortedSlice[i]);
    minDiffAtIdx.push(idx as i32);
  }

  // k closest USD price values
  const kClosestPrices: CustomPriceType[] = [];
  for (let i = 0; i < minDiffAtIdx.length; i++) {
    if (!kClosestPrices.includes(pricesSorted[minDiffAtIdx[i]])) {
      kClosestPrices.push(pricesSorted[minDiffAtIdx[i]]);
    }
    if (!kClosestPrices.includes(pricesSorted[minDiffAtIdx[i] + 1])) {
      kClosestPrices.push(pricesSorted[minDiffAtIdx[i] + 1]);
    }
  }

  return kClosestPrices;
}

export function averagePrice(prices: CustomPriceType[]): CustomPriceType {
  let summationUSDPrice = constants.BIGDECIMAL_ZERO;
  for (let i = 0; i < prices.length; i++) {
    summationUSDPrice = summationUSDPrice.plus(prices[i].usdPrice);
  }

  return CustomPriceType.initialize(
    summationUSDPrice.div(new BigDecimal(BigInt.fromI32(prices.length as i32))),
    constants.DEFAULT_USDC_DECIMALS
  );
}
