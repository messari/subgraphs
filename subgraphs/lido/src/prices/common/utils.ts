import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";

import { Configurations, CustomPriceType } from "./types";
import * as constants from "./constants";
import * as MAINNET from "../config/mainnet";

import { _ERC20 } from "../../../generated/Lido/_ERC20";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = _ERC20.bind(tokenAddr);

  const decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function getConfig(): Configurations {
  const network = dataSource.network();
  if (network == MAINNET.NETWORK_STRING) {
    return new MAINNET.config();
  }

  return new MAINNET.config();
}

function sortByPrices(prices: CustomPriceType[]): CustomPriceType[] {
  const pricesSorted = prices.sort(function (a, b) {
    const x = a.usdPrice.div(a.decimalsBaseTen);
    const y = b.usdPrice.div(b.decimalsBaseTen);

    if (x < y) return constants.INT_NEGATIVE_ONE;
    if (x > y) return constants.INT_ONE;
    return 0;
  });

  return pricesSorted;
}

function pairwiseDiffOfPrices(prices: CustomPriceType[]): BigDecimal[] {
  const diff: BigDecimal[] = [];
  for (let i = 1; i < prices.length; i++) {
    const x = prices[i].usdPrice.div(prices[i].decimalsBaseTen);
    const y = prices[i - 1].usdPrice.div(prices[i - 1].decimalsBaseTen);

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
    summationUSDPrice = summationUSDPrice.plus(
      prices[i].usdPrice.div(prices[i].decimalsBaseTen)
    );
  }

  return CustomPriceType.initialize(
    summationUSDPrice
      .div(new BigDecimal(BigInt.fromI32(prices.length as i32)))
      .times(
        constants.BIGINT_TEN.pow(
          constants.DEFAULT_USDC_DECIMALS as u8
        ).toBigDecimal()
      ),
    constants.DEFAULT_USDC_DECIMALS
  );
}
