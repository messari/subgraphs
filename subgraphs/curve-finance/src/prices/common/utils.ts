import * as BSC from "../config/bsc";
import * as BASE from "../config/base";
import * as MODE from "../config/mode";
import * as CELO from "../config/celo";
import * as FUSE from "../config/fuse";
import * as XDAI from "../config/gnosis";
import * as BLAST from "../config/blast";
import * as LINEA from "../config/linea";
import * as CRONOS from "../config/cronos";
import * as AURORA from "../config/aurora";
import * as FANTOM from "../config/fantom";
import * as SCROLL from "../config/scroll";
import * as POLYGON from "../config/polygon";
import * as MAINNET from "../config/mainnet";
import * as HARMONY from "../config/harmony";
import * as MOONBEAM from "../config/moonbeam";
import * as OPTIMISM from "../config/optimism";
import * as AVALANCHE from "../config/avalanche";
import * as ARBITRUM_ONE from "../config/arbitrum";
import * as ZKSYNC_ERA from "../config/zksync_era";
import * as POLYGON_ZKEVM from "../config/polygon_zkevm";

import { Configurations, CustomPriceType, OracleContract } from "./types";
import * as constants from "./constants";
import * as TEMPLATE from "../config/template";
import { _ERC20 } from "../../../generated/PoolRegistry/_ERC20";
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
  decimals: i32 = constants.DEFAULT_DECIMALS.toI32(),
): BigDecimal {
  return quantity.divDecimal(
    constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal(),
  );
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T,
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
    constants.DEFAULT_DECIMALS,
  );

  return decimals;
}

export function getTokenSupply(tokenAddr: Address): BigInt {
  const tokenContract = _ERC20.bind(tokenAddr);

  const totalSupply = readValue<BigInt>(
    tokenContract.try_totalSupply(),
    constants.BIGINT_ONE,
  );

  return totalSupply;
}

export function absBigDecimal(value: BigDecimal): BigDecimal {
  if (value.lt(constants.BIGDECIMAL_ZERO))
    return value.times(constants.BIGDECIMAL_NEG_ONE);
  return value;
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(constants.BIGDECIMAL_ZERO)) {
    return constants.BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function getContract(
  contractInfo: OracleContract | null,
  block: ethereum.Block | null = null,
): Address | null {
  if (!contractInfo || (block && contractInfo.startBlock.gt(block.number)))
    return null;

  return contractInfo.address;
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
  } else if (network == BLAST.NETWORK_STRING) {
    return new BLAST.config();
  } else if (network == BASE.NETWORK_STRING) {
    return new BASE.config();
  } else if (network == MODE.NETWORK_STRING) {
    return new MODE.config();
  } else if (network == POLYGON_ZKEVM.NETWORK_STRING) {
    return new POLYGON_ZKEVM.config();
  } else if (network == SCROLL.NETWORK_STRING) {
    return new SCROLL.config();
  } else if (network == ZKSYNC_ERA.NETWORK_STRING) {
    return new ZKSYNC_ERA.config();
  } else if (network == LINEA.NETWORK_STRING) {
    return new LINEA.config();
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
  prices: CustomPriceType[],
): CustomPriceType[] {
  // Return early with input array for edge cases
  if (prices.length <= 2 || k <= 0) {
    return prices;
  }

  // Ensure k is not larger than the array length
  if (k > prices.length) {
    k = prices.length;
  }

  // sort by USD prices
  const pricesSorted = sortByPrices(prices);

  // pairwise difference in USD prices
  const pairwiseDiff = pairwiseDiffOfPrices(pricesSorted);

  // Handle case where pairwiseDiff might be empty
  if (pairwiseDiff.length == 0) {
    return prices;
  }

  // k minimum difference values and their original indexes
  const pairwiseDiffCopy = pairwiseDiff.map<BigDecimal>((x: BigDecimal) => x);

  // Ensure we're not taking more elements than available
  const sliceLength = k < pairwiseDiffCopy.length ? k : pairwiseDiffCopy.length;
  const pairwiseDiffSortedSlice = pairwiseDiffCopy.sort().slice(0, sliceLength);

  const minDiffAtIdx: i32[] = [];
  for (let i = 0; i < pairwiseDiffSortedSlice.length; i++) {
    const idx = pairwiseDiff.indexOf(pairwiseDiffSortedSlice[i]);
    // Only add valid indices
    if (idx >= 0) {
      minDiffAtIdx.push(idx as i32);
    }
  }

  // Handle case where minDiffAtIdx might be empty
  if (minDiffAtIdx.length == 0) {
    return prices;
  }

  // k closest USD price values
  const kClosestPrices: CustomPriceType[] = [];
  for (let i = 0; i < minDiffAtIdx.length; i++) {
    const idx = minDiffAtIdx[i];
    // Ensure we're not accessing out of bounds
    if (idx < pricesSorted.length) {
      if (!kClosestPrices.includes(pricesSorted[idx])) {
        kClosestPrices.push(pricesSorted[idx]);
      }

      // Check bounds for the next element too
      if (
        idx + 1 < pricesSorted.length &&
        !kClosestPrices.includes(pricesSorted[idx + 1])
      ) {
        kClosestPrices.push(pricesSorted[idx + 1]);
      }
    }
  }

  // If we couldn't find closest prices, return the original array
  if (kClosestPrices.length == 0) {
    return prices;
  }

  return kClosestPrices;
}

export function averagePrice(prices: CustomPriceType[]): CustomPriceType {
  // Return early with default value for empty array
  if (prices.length == 0) {
    return new CustomPriceType();
  }

  // Return single price if only one exists
  if (prices.length == 1) {
    return prices[0];
  }

  let summationUSDPrice = constants.BIGDECIMAL_ZERO;
  let validPriceCount = 0;

  for (let i = 0; i < prices.length; i++) {
    // Only include valid, non-zero prices in the average
    if (
      !prices[i].reverted &&
      prices[i].usdPrice.gt(constants.BIGDECIMAL_ZERO)
    ) {
      summationUSDPrice = summationUSDPrice.plus(prices[i].usdPrice);
      validPriceCount += 1;
    }
  }

  // If no valid prices, return default
  if (validPriceCount == 0) {
    return new CustomPriceType();
  }

  // Calculate average with the number of valid prices
  return CustomPriceType.initialize(
    summationUSDPrice.div(new BigDecimal(BigInt.fromI32(validPriceCount))),
    constants.DEFAULT_USDC_DECIMALS,
  );
}
