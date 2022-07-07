import {
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { PoolInfoType } from "./types";
import * as constants from "../common/constants";
import { VaultFee } from "../../generated/schema";
import { ERC20 } from "../../generated/Booster/ERC20";
import { getOrCreateYieldAggregator } from "./initializer";
import { Vault as VaultStore } from "../../generated/schema";
import { Booster as BoosterContract } from "../../generated/Booster/Booster";
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

export function getTokenDecimals(tokenAddr: Address): i32 {
  const token = ERC20.bind(tokenAddr);

  let decimals = readValue<i32>(token.try_decimals(), 18);

  return decimals;
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
    constants.ZERO_ADDRESS
  );

  return poolAddress;
}

export function getPool(lpToken: Address): Address {
  // Registry: CURVE_REGISTRY.v1
  let poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_REGISTRY.v1);
  if (poolAddress.toHex() != constants.ZERO_ADDRESS_STRING) return poolAddress;

  // Registry: CURVE_REGISTRY.v2
  poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_REGISTRY.v2);
  if (poolAddress.toHex() != constants.ZERO_ADDRESS_STRING) return poolAddress;

  // Registry: CURVE_POOL_REGISTRY.v1
  poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_POOL_REGISTRY.v1);
  if (poolAddress.toHex() != constants.ZERO_ADDRESS_STRING) return poolAddress;

  // Registry: CURVE_POOL_REGISTRY.v2
  poolAddress = getPoolFromLpToken(lpToken, constants.CURVE_POOL_REGISTRY.v2);
  if (poolAddress.toHex() != constants.ZERO_ADDRESS_STRING) return poolAddress;

  if (constants.POOL_ADDRESS_V2.has(lpToken.toHexString()))
    return constants.POOL_ADDRESS_V2.get(lpToken.toHexString());

  return constants.ZERO_ADDRESS;
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
  const poolCount = protocol._poolCount.toI32();

  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  for (
    let poolIdx = 0;
    BigInt.fromI32(poolIdx).toI32() <= poolCount; // Handling as u8 error
    poolIdx++
  ) {
    const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
      .concat("-")
      .concat(poolIdx.toString());

    const vault = VaultStore.load(vaultId);
    if (!vault) continue;

    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}
