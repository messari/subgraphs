import * as constants from "../common/constants";
import { Token, LiquidityPool } from "../../generated/schema";
import {
  getOrCreateToken,
  getOrCreateDexAmmProtocol,
  getOrCreateLiquidityPoolFee,
} from "./initializers";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { Pool as PoolContract } from "../../generated/templates/PoolTemplate/Pool";
import { ERC20 as ERC20Contract } from "../../generated/templates/PoolTemplate/ERC20";
import { Registry as RegistryContract } from "../../generated/templates/PoolTemplate/Registry";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
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

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getLpTokenFromPool(poolAddress: Address): Token {
  const registryContract = RegistryContract.bind(
    constants.Mainnet.REGISTRY_ADDRESS
  );

  let lpToken = readValue<Address>(
    registryContract.try_get_lp_token(poolAddress),
    poolAddress
  );

  return getOrCreateToken(lpToken);
}

export function getPoolCoins(poolAddress: Address): string[] {
  const curvePool = PoolContract.bind(poolAddress);

  let idx = 0;
  let inputTokens: string[] = [];

  while (idx >= 0) {
    let inputToken = readValue<Address>(
      curvePool.try_coins(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (inputToken.equals(constants.NULL.TYPE_ADDRESS)) {
      inputToken = readValue<Address>(
        curvePool.try_coins1(BigInt.fromI32(idx)),
        constants.NULL.TYPE_ADDRESS
      );

      if (inputToken.equals(constants.NULL.TYPE_ADDRESS)) {
        idx = -1;
        continue;
      }
    }

    inputTokens.push(getOrCreateToken(inputToken).id);
    idx += 1;
  }

  return inputTokens;
}

export function getPoolBalances(poolAddress: Address): BigInt[] {
  const curvePool = PoolContract.bind(poolAddress);

  let idx = 0;
  let inputTokenBalances: BigInt[] = [];

  while (idx >= 0) {
    let balance = readValue<BigInt>(
      curvePool.try_balances(BigInt.fromI32(idx)),
      constants.BIGINT_ZERO
    );

    if (balance.equals(constants.BIGINT_ZERO)) {
      balance = readValue<BigInt>(
        curvePool.try_balances1(BigInt.fromI32(idx)),
        constants.BIGINT_ZERO
      );

      if (balance.equals(constants.BIGINT_ZERO)) {
        idx = -1;
        continue;
      }
    }

    inputTokenBalances.push(balance);
    idx += 1;
  }

  return inputTokenBalances;
}

export function getPoolFees(poolAddress: Address): string[] {
  const curvePool = PoolContract.bind(poolAddress);

  let totalFees = readValue<BigInt>(
    curvePool.try_fee(),
    constants.DEFAULT_POOL_FEE
  );
  let adminFees = readValue<BigInt>(
    curvePool.try_admin_fee(),
    constants.DEFAULT_ADMIN_FEE
  );

  const tradingFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_TRADING_FEE) +
    poolAddress.toHexString();
  let tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    constants.LiquidityPoolFeeType.FIXED_TRADING_FEE,
    totalFees.divDecimal(constants.FEE_DENOMINATOR)
  );

  const protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    poolAddress.toHexString();
  let protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    totalFees.times(adminFees).divDecimal(constants.FEE_DENOMINATOR)
  );

  const lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) +
    poolAddress.toHexString();
  let lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    constants.LiquidityPoolFeeType.FIXED_LP_FEE,
    totalFees
      .minus(adminFees.times(totalFees))
      .divDecimal(constants.FEE_DENOMINATOR)
  );

  return [tradingFee.id, protocolFee.id, lpFee.id];
}

export function getOrCreateTokenFromString(tokenAddress: string): Token {
  return getOrCreateToken(Address.fromString(tokenAddress));
}

export function getPoolUnderlyingCoins(poolAddress: Address) {
  const registryContract = RegistryContract.bind(
    constants.Mainnet.REGISTRY_ADDRESS
  );

  let underlyingCoins = readValue<Address[]>(
    registryContract.try_get_underlying_coins(poolAddress),
    []
  );
  if (underlyingCoins.length != 0) {
    return underlyingCoins;
  }

  const factoryRegistryContract = RegistryContract.bind(
    constants.Mainnet.FACTORY_REGISTRY_ADDRESS
  );

  underlyingCoins = readValue<Address[]>(
    factoryRegistryContract.try_get_underlying_coins(poolAddress),
    []
  );

  return underlyingCoins;
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals.toI32()).toBigDecimal();
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

export function updateProtocolAfterNewLiquidityPool(
  poolAddress: Address
): void {
  const protocol = getOrCreateDexAmmProtocol();

  let poolIds = protocol._poolIds;
  poolIds.push(poolAddress.toHexString());
  protocol._poolIds = poolIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}
