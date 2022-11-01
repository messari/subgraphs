import { Address, BigInt } from "@graphprotocol/graph-ts";
import { VaultFee } from "../../generated/schema";

export function updateVaultFee(contractAddress: Address, newValue: BigInt, feeType: string): void {
  let updatedFee = VaultFee.load(contractAddress.toHexString().concat(feeType));

  if (updatedFee == null) {
    updatedFee = new VaultFee(contractAddress.toHexString().concat(feeType));
  }

  updatedFee.feeType = "PERFORMANCE_FEE";
  updatedFee.feePercentage = newValue.toBigDecimal();
  updatedFee.save();
}