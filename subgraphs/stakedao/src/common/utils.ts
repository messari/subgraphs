import {
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import * as constants from "./constants";
import { getOrCreateYieldAggregator } from "./initializers";
import { VaultFee, Vault as VaultStore } from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/Controller/ERC20";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function createFeeType(
  feeId: string,
  feeType: string,
  feePercentage: BigInt
): void {
  const fees = new VaultFee(feeId);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage
    .toBigDecimal()
    .div(constants.BIGDECIMAL_HUNDRED);

  fees.save();
}

export function getFeePercentage(
  vaultAddress: string,
  feeType: string
): BigDecimal {
  let feesPercentage: BigDecimal = constants.BIGDECIMAL_ZERO;
  const vault = VaultStore.load(vaultAddress);

  for (let i = 0; i < vault!.fees.length; i++) {
    const vaultFee = VaultFee.load(vault!.fees[i]);

    if (vaultFee!.feeType == feeType && vaultFee!.feePercentage) {
      feesPercentage = vaultFee!.feePercentage;
    }
  }

  return feesPercentage;
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultIds = protocol._vaultIds;

  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = VaultStore.load(vaultIds[vaultIdx]);

    totalValueLockedUSD = totalValueLockedUSD.plus(
      vault!.totalValueLockedUSD
    );
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}
