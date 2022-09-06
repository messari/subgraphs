import * as constants from "../common/constants";
import { VaultFee } from "../../generated/schema";
import { getOrCreateYieldAggregator } from "./initializers";
import { Vault as VaultStore } from "../../generated/schema";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 as ERC20Contract } from "../../generated/Registry_v1/ERC20";

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

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals.toI32() as u8).toBigDecimal();
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

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();

  let vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;

  protocol.totalPoolCount += 1;

  protocol.save();
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
