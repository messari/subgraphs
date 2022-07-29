import { PoolInfoType } from "./types";
import * as constants from "../common/constants";
import { VaultFee } from "../../generated/schema";
import { getOrCreateYieldAggregator } from "./initializers";
import { Vault as VaultStore } from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/Booster/ERC20";
import { Booster as BoosterContract } from "../../generated/Booster/Booster";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { CurveRegistry as CurveRegistryContract } from "../../generated/Booster/CurveRegistry";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<i32>(token.try_decimals(), 18);

  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function createFeeType(
  feeId: string,
  feeType: string,
  feePercentage: BigDecimal
): void {
  let fees = VaultFee.load(feeId);

  if (!fees) {
    fees = new VaultFee(feeId);
    fees.feeType = feeType;
    fees.feePercentage = feePercentage;

    fees.save();
  }
}

export function getPoolFromLpToken(
  lpToken: Address,
  registryAddress: Address
): Address {
  const curveRegistryContract = CurveRegistryContract.bind(registryAddress);

  let poolAddress = readValue<Address>(
    curveRegistryContract.try_get_pool_from_lp_token(lpToken),
    constants.NULL.TYPE_ADDRESS
  );

  return poolAddress;
}

export function getPool(lpToken: Address): Address {
  if (constants.MISSING_POOLS_MAP.get(lpToken)) {
    return constants.MISSING_POOLS_MAP.get(lpToken)!;
  }

  // Registry: CURVE_REGISTRY.v1
  let poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_REGISTRY.v1);
  if (poolAddress.toHex() != constants.NULL.TYPE_STRING) return poolAddress;

  // Registry: CURVE_REGISTRY.v2
  poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_REGISTRY.v2);
  if (poolAddress.toHex() != constants.NULL.TYPE_STRING) return poolAddress;

  // Registry: CURVE_POOL_REGISTRY.v1
  poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_POOL_REGISTRY.v1);
  if (poolAddress.toHex() != constants.NULL.TYPE_STRING) return poolAddress;

  // Registry: CURVE_POOL_REGISTRY.v2
  poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_POOL_REGISTRY.v2);
  if (poolAddress.toHex() != constants.NULL.TYPE_STRING) return poolAddress;

  if (constants.POOL_ADDRESS_V2.has(lpToken.toHexString()))
    return constants.POOL_ADDRESS_V2.get(lpToken.toHexString());

  return constants.NULL.TYPE_ADDRESS;
}

export function getPoolInfoFromPoolId(poolId: BigInt): PoolInfoType | null {
  const boosterContract = BoosterContract.bind(
    constants.CONVEX_BOOSTER_ADDRESS
  );
  const poolInfo = boosterContract.try_poolInfo(poolId);
  if (poolInfo.reverted) return null;

  return new PoolInfoType(poolInfo.value);
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultIds = protocol._vaultIds;

  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = VaultStore.load(vaultIds[vaultIdx]);

    if (!vault) continue;
    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function updateProtocolAfterNewVault(vaultAddress: string): void {
  const protocol = getOrCreateYieldAggregator();

  let vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress);
  protocol._vaultIds = vaultIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}

export function getConvexTokenMintAmount(crvRewardAmount: BigInt): BigDecimal {
  const convexTokenContract = ERC20Contract.bind(
    constants.CONVEX_TOKEN_ADDRESS
  );
  let cvxTokenDecimals = getTokenDecimals(constants.CONVEX_TOKEN_ADDRESS);
  let cvxTokenSupply = readValue<BigInt>(
    convexTokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  ).toBigDecimal();

  let currentCliff = cvxTokenSupply.div(constants.CVX_CLIFF_SIZE);

  let cvxRewardAmount: BigDecimal = constants.BIGDECIMAL_ZERO;
  if (currentCliff.lt(constants.CVX_CLIFF_COUNT.times(cvxTokenDecimals))) {
    let remaining = constants.CVX_CLIFF_COUNT.times(cvxTokenDecimals).minus(
      currentCliff
    );

    cvxRewardAmount = crvRewardAmount
      .toBigDecimal()
      .times(remaining)
      .div(constants.CVX_CLIFF_COUNT.times(cvxTokenDecimals));

    let amountTillMax = constants.CVX_MAX_SUPPLY.times(cvxTokenDecimals).minus(
      cvxTokenSupply
    );
    if (cvxRewardAmount.gt(amountTillMax)) {
      cvxRewardAmount = amountTillMax;
    }
  }

  return cvxRewardAmount;
}
