import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { VaultFee, _Strategy } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function createFeeType(
  feeId: string,
  feeType: string,
  try_feePercentage: ethereum.CallResult<BigInt>,
  defaultFeePercentage: BigInt
): void {
  const fees = new VaultFee(feeId);

  let feePercentage = try_feePercentage.reverted
    ? defaultFeePercentage
    : try_feePercentage.value;

  fees.feeType = feeType;
  fees.feePercentage = feePercentage
    .toBigDecimal()
    .div(BigDecimal.fromString("100"));

  fees.save();
}

export function getOrCreateStrategy(
  vaultAddress: Address,
  _strategyAddress: Address,
  performanceFee: BigInt
): _Strategy {
  const strategy = new _Strategy(_strategyAddress.toHexString());

  strategy.vaultAddress = vaultAddress;

  const performanceFeeId = "performance-fee-" + vaultAddress.toHexString();
  utils.createFeeType(
    performanceFeeId,
    constants.VaultFeeType.PERFORMANCE_FEE,
    performanceFee
  );
  strategy.performanceFee = performanceFeeId;

  return strategy;
}
