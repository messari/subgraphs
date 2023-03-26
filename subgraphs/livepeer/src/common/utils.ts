import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { RoundsManager } from "../../generated/RoundsManager/RoundsManager";
import { UniswapV3Pool } from "../../generated/BondingManager/UniswapV3Pool";
import { Minter } from "../../generated/BondingManager/Minter";

import * as constants from "./constants";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { ERC20 } from "../../generated/BondingManager/ERC20";
import { TokenPricer } from "../sdk/protocols/config";
import { Token } from "../../generated/schema";
import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig } from "../sdk/protocols/config";
import * as utils from "../common/utils";
import { Versions } from "../versions";
import { CustomEventType } from "../sdk/util/events";

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

// Make a number the specified number of digits
export function leftPad(str: string, size: i32): string {
  while (str.length < size) {
    str = "0" + str;
  }
  return str;
}

// Make a derived pool ID from a transcoder address
export function makePoolId(transcoderAddress: string, roundId: string): string {
  return leftPad(roundId, 10) + "-" + transcoderAddress;
}

// Make a derived share ID from a delegator address
export function makeShareId(delegatorAddress: string, roundId: string): string {
  return leftPad(roundId, 10) + "-" + delegatorAddress;
}

// Make a vote id
export function makeVoteId(
  delegatorAddress: string,
  pollAddress: string
): string {
  return delegatorAddress + "-" + pollAddress;
}

export function getBlockNum(): BigInt {
  const roundsManager = RoundsManager.bind(constants.ROUND_MANAGER_ADDRESS);
  return roundsManager.blockNum();
}

export function getCurrentRound(): BigInt {
  const roundsManager = RoundsManager.bind(constants.ROUND_MANAGER_ADDRESS);
  const round = readValue(
    roundsManager.try_currentRound(),
    constants.BIGINT_ZERO
  );
  return round;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function bigIntToBigDecimal(
  bigInt: BigInt,
  decimals: number
): BigDecimal {
  return bigInt.divDecimal(
    constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal()
  );
}

export class TokenInitialize implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const tokenContract = ERC20.bind(address);
    const name = readValue(tokenContract.try_name(), "");
    const symbol = readValue(tokenContract.try_symbol(), "");
    const decimals = readValue(
      tokenContract.try_decimals(),
      constants.BIGINT_ZERO
    ).toI32();
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export class TokenPrice implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    if (tokenAddress.equals(constants.LPT_ADDRESS)) {
      const lptPriceEth = getLptPriceEth();
      const ethPriceUSD = getEthPriceUsd();
      log.warning("[getTokenPrice] LPT {} token {}", [
        lptPriceEth.toString(),
        tokenAddress.toHexString(),
      ]);
      return lptPriceEth.times(ethPriceUSD);
    }
    if (tokenAddress.equals(constants.WETH_ADDRESS)) {
      const ethPriceUSD = getEthPriceUsd();
      log.warning("[getTokenPrice] WETH {} token {}", [
        ethPriceUSD.toString(),
        tokenAddress.toHexString(),
      ]);
      return ethPriceUSD;
    }
    log.warning("[getTokenPrice] NOT", []);
    const tokenPrice = constants.BIGDECIMAL_HUNDRED;

    return tokenPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    if (tokenAddress.equals(constants.LPT_ADDRESS)) {
      const lptPriceEth = getLptPriceEth();
      const ethPriceUSD = getEthPriceUsd();
      const amountDecimal = bigIntToBigDecimal(amount, token.decimals as u8);
      log.warning("[getTokenPrice] LPT {} token {}", [
        lptPriceEth.toString(),
        tokenAddress.toHexString(),
      ]);
      return amountDecimal.times(ethPriceUSD).times(lptPriceEth);
    }
    if (tokenAddress.equals(constants.WETH_ADDRESS)) {
      const ethPriceUSD = getEthPriceUsd();
      const amountDecimal = bigIntToBigDecimal(amount, token.decimals as u8);
      log.warning("[getTokenPrice] WETH {} token {}", [
        ethPriceUSD.toString(),
        tokenAddress.toHexString(),
      ]);
      return amountDecimal.times(ethPriceUSD);
    }
    const amountValueUSD = constants.BIGDECIMAL_HUNDRED;

    return amountValueUSD;
  }
}

export function initializeSDK(event: ethereum.Event): SDK {
  log.warning("[initialize sdk] start", []);
  const protocolConfig = new ProtocolConfig(
    constants.PROTOCOL_ID,
    constants.PROTOCOL_NAME,
    constants.PROTOCOL_SLUG,
    Versions
  );
  const tokenPricer = new utils.TokenPrice();
  const tokenInitializer = new utils.TokenInitialize();
  const customEvent = CustomEventType.initialize(
    event.block,
    event.transaction,
    event.logIndex,
    event
  );
  const sdk = new SDK(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    customEvent
  );
  log.warning("[initialize sdk] end", []);

  return sdk;
}

export function getTotalRewardTokens(): BigDecimal {
  const minterContract = Minter.bind(constants.MINTER_ADDRESS);
  const totalSupply = bigIntToBigDecimal(
    readValue<BigInt>(
      minterContract.try_getGlobalTotalSupply(),
      constants.BIGINT_ZERO
    ),
    18
  );
  const inflationRate = bigIntToBigDecimal(
    readValue<BigInt>(minterContract.try_inflation(), constants.BIGINT_ZERO),
    7
  );
  const rewardTokens = totalSupply.times(inflationRate);
  log.warning("[getRewardTokens] rewardTokens {}", [rewardTokens.toString()]);
  return rewardTokens;
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(constants.BIGDECIMAL_ZERO)) {
    return constants.BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}

export function getEthPriceUsd(): BigDecimal {
  return getPriceForPair(getUniswapV3DaiEthPoolAddress());
}

export function getLptPriceEth(): BigDecimal {
  return getPriceForPair(getUniswapV3LptEthPoolAddress());
}

export function getPriceForPair(address: Address): BigDecimal {
  let pricePair = constants.BIGDECIMAL_ZERO;

  if (
    dataSource.network() == "arbitrum-one" ||
    dataSource.network() == "arbitrum-rinkeby"
  ) {
    const uniswapPool = UniswapV3Pool.bind(address);
    const slot0 = uniswapPool.try_slot0();
    if (!slot0.reverted) {
      const sqrtPriceX96 = slot0.value.value0;
      const prices = sqrtPriceX96ToTokenPrices(
        sqrtPriceX96,
        BigInt.fromI32(18),
        BigInt.fromI32(18)
      );
      pricePair = prices[1];
    }
  }

  return pricePair;
}

function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: BigInt,
  token0Decimals: BigInt,
  token1Decimals: BigInt
): BigDecimal[] {
  const Q192 = "6277101735386680763835789423207666416102355444464034512896"; // 2 ** 192
  const num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  const denom = BigDecimal.fromString(Q192);
  const price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0Decimals))
    .div(exponentToBigDecimal(token1Decimals));

  const price0 = safeDiv(BigDecimal.fromString("1"), price1);
  return [price0, price1];
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (
    let i = constants.BIGINT_ZERO;
    i.lt(decimals);
    i = i.plus(constants.BIGINT_ONE)
  ) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function getUniswapV3LptEthPoolAddress(): Address {
  const network = dataSource.network();

  if (network == "arbitrum-one") {
    return Address.fromString("4fd47e5102dfbf95541f64ed6fe13d4ed26d2546");
  } else if (network == "arbitrum-rinkeby") {
    return Address.fromString("01ab0834e140f1d33c99b6380a77a6b75b283b3f");
  } else {
    return Address.fromString("0xffa7ee1c08416565d054b2cf3e336dcfe21591e5");
  }
}

export function getUniswapV3DaiEthPoolAddress(): Address {
  const network = dataSource.network();

  if (network == "arbitrum-one") {
    return Address.fromString("a961f0473da4864c5ed28e00fcc53a3aab056c1b");
  } else if (network == "arbitrum-rinkeby") {
    return Address.fromString("01ab0834e140f1d33c99b6380a77a6b75b283b3f");
  } else {
    return Address.fromString("0xffa7ee1c08416565d054b2cf3e336dcfe21591e5");
  }
}
