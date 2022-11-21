import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateLiquidityPoolFee,
} from "./initializers";
import * as utils from "./utils";
import { PoolFeesType } from "./types";
import * as constants from "./constants";
import { Token, LiquidityPool } from "../../generated/schema";
import { LpToken as LPTokenContract } from "../../generated/Factory/LpToken";
import { Factory as FactoryContract } from "../../generated/Factory/Factory";
import { Registry as RegistryContract } from "../../generated/Registry/Registry";
import { Pool as PoolContract } from "../../generated/templates/PoolTemplate/Pool";
import { ERC20 as ERC20Contract } from "../../generated/templates/PoolTemplate/ERC20";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getLpTokenFromPool(
  poolAddress: Address,
  block: ethereum.Block,
  newRegistryAddress: Address = constants.ADDRESS_ZERO
): Token {
  let lpTokenAddress = constants.ADDRESS_ZERO;

  if (constants.POOL_LP_TOKEN_MAP.has(poolAddress.toHexString())) {
    return getOrCreateToken(
      constants.POOL_LP_TOKEN_MAP.get(poolAddress.toHexString()),
      block
    );
  }

  //Pool Contract
  const poolContract = PoolContract.bind(poolAddress);

  const lpTokenCall = poolContract.try_lp_token();
  if (!lpTokenCall.reverted) {
    if (
      readValue<Address>(lpTokenCall, constants.ADDRESS_ZERO).notEqual(
        constants.ADDRESS_ZERO
      )
    ) {
      return getOrCreateToken(
        readValue<Address>(lpTokenCall, constants.ADDRESS_ZERO),
        block
      );
    }
  }

  // Registry Contract

  const registryContract = RegistryContract.bind(constants.REGISTRY_ADDRESS);
  lpTokenAddress = readValue<Address>(
    registryContract.try_get_lp_token(poolAddress),
    constants.NULL.TYPE_ADDRESS
  );
  if (lpTokenAddress.notEqual(constants.NULL.TYPE_ADDRESS))
    return getOrCreateToken(lpTokenAddress, block);

  // Factory Contract

  const factoryContract = FactoryContract.bind(constants.FACTORY_ADDRESS);
  lpTokenAddress = readValue<Address>(
    factoryContract.try_get_lp_token(poolAddress),
    constants.NULL.TYPE_ADDRESS
  );

  if (lpTokenAddress.notEqual(constants.NULL.TYPE_ADDRESS))
    return getOrCreateToken(lpTokenAddress, block);

  if (!newRegistryAddress.equals(constants.ADDRESS_ZERO)) {
    const newFactoryContract = FactoryContract.bind(newRegistryAddress);
    lpTokenAddress = readValue<Address>(
      newFactoryContract.try_get_lp_token(poolAddress),
      constants.NULL.TYPE_ADDRESS
    );
    if (lpTokenAddress.notEqual(constants.NULL.TYPE_ADDRESS))
      return getOrCreateToken(lpTokenAddress, block);
  }
  if (!newRegistryAddress.equals(constants.ADDRESS_ZERO)) {
    const newFactoryContract = FactoryContract.bind(newRegistryAddress);
    lpTokenAddress = readValue<Address>(
      newFactoryContract.try_get_token(poolAddress),
      constants.NULL.TYPE_ADDRESS
    );
    if (lpTokenAddress.notEqual(constants.NULL.TYPE_ADDRESS))
      return getOrCreateToken(lpTokenAddress, block);
  }
  return getOrCreateToken(poolAddress, block);
}

export function getPoolCoins(
  poolAddress: Address,
  block: ethereum.Block
): string[] {
  const poolContract = PoolContract.bind(poolAddress);
  const inputTokens: string[] = [];
  let i = 0;
  while (i >= 0) {
    const inputToken = readValue<Address>(
      poolContract.try_coins(BigInt.fromI32(i)),
      constants.NULL.TYPE_ADDRESS
    );

    if (inputToken.equals(constants.NULL.TYPE_ADDRESS)) {
      i = -1;
      continue;
    }

    inputTokens.push(getOrCreateToken(inputToken, block).id);
    i += 1;
  }

  return inputTokens;
}

export function getPoolBalances(
  poolAddress: Address,
  inputTokens: string[]
): BigInt[] {
  const poolContract = PoolContract.bind(poolAddress);

  const inputTokenBalances: BigInt[] = [];
  for (let i = 0; i < inputTokens.length; i++) {
    const balance = readValue<BigInt>(
      poolContract.try_balances(BigInt.fromI32(i)),
      constants.BIGINT_ZERO
    );

    inputTokenBalances.push(balance);
  }

  return inputTokenBalances;
}

export function getPoolFees(poolAddress: Address): PoolFeesType {
  const poolContract = PoolContract.bind(poolAddress);

  const totalFees = readValue<BigInt>(
    poolContract.try_fee(),
    constants.DEFAULT_POOL_FEE
  ).divDecimal(constants.FEE_DENOMINATOR);

  const adminFees = readValue<BigInt>(
    poolContract.try_admin_fee(),
    constants.DEFAULT_ADMIN_FEE
  ).divDecimal(constants.FEE_DENOMINATOR);

  const lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) +
    poolAddress.toHexString();
  const tradingFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_TRADING_FEE) +
    poolAddress.toHexString();
  const protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    poolAddress.toHexString();

  const tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    constants.LiquidityPoolFeeType.FIXED_TRADING_FEE,
    totalFees.times(constants.BIGDECIMAL_HUNDRED)
  );

  const protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    totalFees.times(adminFees).times(constants.BIGDECIMAL_HUNDRED)
  );

  const lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    constants.LiquidityPoolFeeType.FIXED_LP_FEE,
    totalFees
      .minus(totalFees.times(adminFees))
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return new PoolFeesType(tradingFee, protocolFee, lpFee);
}
export function getPoolTokenWeights(
  inputTokens: string[],
  inputTokenBalances: BigInt[],
  totalValueLockedUSD: BigDecimal,
  block: ethereum.Block
): BigDecimal[] {
  const inputTokenWeights: BigDecimal[] = [];

  for (let i = 0; i < inputTokens.length; i++) {
    if (totalValueLockedUSD == constants.BIGDECIMAL_ZERO) {
      inputTokenWeights.push(constants.BIGDECIMAL_ZERO);
      continue;
    }

    const balance = inputTokenBalances[i];
    const inputToken = getOrCreateToken(
      Address.fromString(inputTokens[i]),
      block
    );

    const balanceUSD = balance
      .divDecimal(
        constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
      )
      .times(inputToken.lastPriceUSD!);
    const weight = balanceUSD
      .div(totalValueLockedUSD)
      .times(constants.BIGDECIMAL_HUNDRED);

    inputTokenWeights.push(weight);
  }

  return inputTokenWeights;
}

export function updateProtocolAfterNewLiquidityPool(
  poolAddress: Address
): void {
  const protocol = getOrCreateDexAmmProtocol();

  const poolIds = protocol._poolIds;
  poolIds.push(poolAddress.toHexString());
  protocol._poolIds = poolIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}
export function checkIfPoolExists(poolAddress: Address): boolean {
  const pool = LiquidityPool.load(poolAddress.toHexString());
  if (!pool) {
    return false;
  }
  return true;
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateDexAmmProtocol();

  const poolIds = protocol._poolIds;
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let poolIdx = 0; poolIdx < poolIds.length; poolIdx++) {
    const pool = LiquidityPool.load(poolIds[poolIdx]);

    if (!pool) continue;
    totalValueLockedUSD = totalValueLockedUSD.plus(pool.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function getPoolTVL(
  inputTokens: string[],
  inputTokenBalances: BigInt[],
  block: ethereum.Block
): BigDecimal {
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let i = 0; i < inputTokens.length; i++) {
    const inputToken = utils.getOrCreateTokenFromString(inputTokens[i], block);
    totalValueLockedUSD = totalValueLockedUSD.plus(
      inputTokenBalances[i]
        .divDecimal(
          constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
        )
        .times(inputToken.lastPriceUSD!)
    );
  }

  return totalValueLockedUSD;
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  const decimals = readValue<number>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function getOrCreateTokenFromString(
  tokenAddress: string,
  block: ethereum.Block
): Token {
  return getOrCreateToken(Address.fromString(tokenAddress), block);
}

export function getOutputTokenPriceUSD(
  poolAddress: Address,
  block: ethereum.Block
): BigDecimal {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  if (pool.outputTokenSupply!.equals(constants.BIGINT_ZERO))
    return constants.BIGDECIMAL_ZERO;

  const lpToken = getLpTokenFromPool(poolAddress, block);

  const outputTokenSupply = pool.outputTokenSupply!.divDecimal(
    constants.BIGINT_TEN.pow(lpToken.decimals as u8).toBigDecimal()
  );
  const outputTokenPriceUSD = pool.totalValueLockedUSD.div(outputTokenSupply);

  return outputTokenPriceUSD;
}
export function getPoolUnderlyingCoins(
  poolAddress: Address,
  newRegistryAddress: Address = constants.ADDRESS_ZERO
): string[] {
  const coins: string[] = [];
  const registryContract = RegistryContract.bind(constants.REGISTRY_ADDRESS);

  let underlyingCoins = readValue<Address[]>(
    registryContract.try_get_underlying_coins(poolAddress),
    []
  );
  if(poolAddress.equals(Address.fromString("0x19ec9e3f7b21dd27598e7ad5aae7dc0db00a806d")))
  log.warning("[getUnderlyingcoins] coins from registry length {}", [
    underlyingCoins.length.toString(),
  ]);

  if (underlyingCoins.length != 0) {
    for (let i = 0; i < underlyingCoins.length; i++) {
      if (!underlyingCoins[i].equals(constants.ADDRESS_ZERO)) {
        coins.push(underlyingCoins[i].toHexString());
      }
    }
    return coins;
  }
  const factoryContract = FactoryContract.bind(constants.FACTORY_ADDRESS);

  underlyingCoins = readValue<Address[]>(
    factoryContract.try_get_underlying_coins(poolAddress),
    []
  );
  if(poolAddress.equals(Address.fromString("0x19ec9e3f7b21dd27598e7ad5aae7dc0db00a806d")))
  log.warning("[getUnderlyingcoins] coins from factory length {}", [
    underlyingCoins.length.toString(),
  ]);

  if (underlyingCoins.length != 0) {
    for (let i = 0; i < underlyingCoins.length; i++) {
      if (!underlyingCoins[i].equals(constants.ADDRESS_ZERO)) {
        coins.push(underlyingCoins[i].toHexString());
      }
    }
    return coins;
  }
  if (newRegistryAddress.notEqual(constants.ADDRESS_ZERO)) {
    const factoryContract = FactoryContract.bind(newRegistryAddress);

    underlyingCoins = readValue<Address[]>(
      factoryContract.try_get_underlying_coins(poolAddress),
      []
    );
    if(poolAddress.equals(Address.fromString("0x19ec9e3f7b21dd27598e7ad5aae7dc0db00a806d")))
    log.warning("[getUnderlyingcoins] coins from new registry length {}", [
      underlyingCoins.length.toString(),
    ]);

    if (underlyingCoins.length != 0) {
      for (let i = 0; i < underlyingCoins.length; i++) {
        if (!underlyingCoins[i].equals(constants.ADDRESS_ZERO)) {
          coins.push(underlyingCoins[i].toHexString());
        }
      }
      return coins;
    }
  }
  if (newRegistryAddress.notEqual(constants.ADDRESS_ZERO)) {
    const registryContract = FactoryContract.bind(newRegistryAddress);

    underlyingCoins = readValue<Address[]>(
      registryContract.try_get_underlying_coins(poolAddress),
      []
    );
    if(poolAddress.equals(Address.fromString("0x19ec9e3f7b21dd27598e7ad5aae7dc0db00a806d")))
    log.warning("[getUnderlyingcoins] coins from new factory length {}", [
      underlyingCoins.length.toString(),
    ]);

    if (underlyingCoins.length != 0) {
      for (let i = 0; i < underlyingCoins.length; i++) {
        if (!underlyingCoins[i].equals(constants.ADDRESS_ZERO)) {
          coins.push(underlyingCoins[i].toHexString());
        }
      }
      return coins;
    }
  }
 


  return coins;
}

export function calculateAverage(prices: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.fromString("0");
  for (let i = 0; i < prices.length; i++) {
    sum = sum.plus(prices[i]);
  }

  return sum.div(
    BigDecimal.fromString(BigInt.fromI32(prices.length).toString())
  );
}
export function getPoolFromLpToken(lpTokenAddress: Address): Address {
  const factoryContract = FactoryContract.bind(constants.FACTORY_ADDRESS);
  const registryContract = RegistryContract.bind(constants.REGISTRY_ADDRESS);
  let poolAddress = readValue<Address>(
    registryContract.try_get_pool_from_lp_token(lpTokenAddress),
    constants.NULL.TYPE_ADDRESS
  );
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    poolAddress = readValue<Address>(
      factoryContract.try_get_pool_from_lp_token(lpTokenAddress),
      constants.NULL.TYPE_ADDRESS
    );
  }

  return poolAddress;
}

export function getVirtualPriceFromPool(poolAddress: Address): BigDecimal {
  const poolContract = PoolContract.bind(poolAddress);
  const virtualPrice = readValue<BigInt>(
    poolContract.try_get_virtual_price(),
    constants.BIGINT_ONE
  ).divDecimal(
    constants.BIGINT_TEN.pow(constants.DEFAULT_DECIMALS as u8).toBigDecimal()
  );
  return virtualPrice;
}
export function getOutputTokenPriceUSD2(
  poolAddress: Address,
  block: ethereum.Block
): BigDecimal {
  const virtualPrice = getVirtualPriceFromPool(poolAddress);
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  const coins = pool.inputTokens;
  let bestTokenPriceUSD = constants.BIGDECIMAL_ZERO;

  const underlyingCoins = pool._underlyingTokens;
  for (let i = 0; i < coins.length; i++) {
    const token = getOrCreateToken(Address.fromString(coins[i]), block);
    if (token.lastPriceUSD!.gt(constants.BIGDECIMAL_ZERO)) {
      bestTokenPriceUSD = token.lastPriceUSD!;

      break;
    }
  }
  if (bestTokenPriceUSD.le(constants.BIGDECIMAL_ZERO)) {
    if (underlyingCoins!.length > 0) {
      for (let i = 0; i < underlyingCoins!.length; i++) {
        const token = getOrCreateToken(
          Address.fromString(underlyingCoins![i]),
          block
        );
        if (token.lastPriceUSD!.gt(constants.BIGDECIMAL_ZERO)) {
          bestTokenPriceUSD = token.lastPriceUSD!;

          break;
        }
      }
    }
  }

  const outputToken = getOrCreateTokenFromString(pool.outputToken!, block);

  outputToken.lastPriceUSD = bestTokenPriceUSD.times(virtualPrice);
  outputToken.save();

  return bestTokenPriceUSD.times(virtualPrice);
}
export function getMinterFromLpToken(lpTokenAddress: Address): Address {
  const lpTokenContract = LPTokenContract.bind(lpTokenAddress);
  const minter = readValue<Address>(
    lpTokenContract.try_minter(),
    constants.ADDRESS_ZERO
  );

  return minter;
}
