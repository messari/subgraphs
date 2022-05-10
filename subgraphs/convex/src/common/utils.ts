import { PoolInfoType } from "./types";
import * as constants from "../common/constants";
import { VaultFee } from "../../generated/schema";
import { ERC20 } from "../../generated/Booster/ERC20";
import { BigInt, Address, ethereum, log, BigDecimal } from "@graphprotocol/graph-ts";
import { Booster as BoosterContract } from "../../generated/Booster/Booster";
import { CurveRegistry as CurveRegistryContract } from "../../generated/Booster/CurveRegistry";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
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
    fees.feePercentage = feePercentage

    fees.save();
  }
}

export function getPoolFromLpToken(lpToken: Address): Address {
  const curveRegistryV1Contract = CurveRegistryContract.bind(
    constants.CURVE_REGISTRY.v1
  );

  let poolAddress = readValue<Address>(
    curveRegistryV1Contract.try_get_pool_from_lp_token(lpToken),
    constants.ZERO_ADDRESS
  );

  if (poolAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
    const curveRegistryV2Contract = CurveRegistryContract.bind(
      constants.CURVE_REGISTRY.v2
    );

    poolAddress = readValue<Address>(
      curveRegistryV2Contract.try_get_pool_from_lp_token(lpToken),
      constants.ZERO_ADDRESS
    );

    if (poolAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
      const curvePoolRegistryV1Contract = CurveRegistryContract.bind(
        constants.CURVE_POOL_REGISTRY.v1
      );

      poolAddress = readValue<Address>(
        curvePoolRegistryV1Contract.try_get_pool_from_lp_token(lpToken),
        constants.ZERO_ADDRESS
      );

      if (poolAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
        const curvePoolRegistryV2Contract = CurveRegistryContract.bind(
          constants.CURVE_POOL_REGISTRY.v2
        );

        poolAddress = readValue<Address>(
          curvePoolRegistryV2Contract.try_get_pool_from_lp_token(lpToken),
          constants.ZERO_ADDRESS
        );

        if (poolAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
          log.warning("Could not find pool for lp token {}", [
            lpToken.toHexString(),
          ]);

          return constants.ZERO_ADDRESS;
        }
      }
    }
  }

  return poolAddress;
}

export function getPoolInfoFromPoolId(poolId: BigInt): PoolInfoType | null {
  const boosterContract = BoosterContract.bind(
    constants.CONVEX_BOOSTER_ADDRESS
  );
  const poolInfo = boosterContract.try_poolInfo(poolId);
  if (poolInfo.reverted) return null;

  return new PoolInfoType(poolInfo.value);
}
