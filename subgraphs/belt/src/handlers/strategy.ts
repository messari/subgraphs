import { log } from "@graphprotocol/graph-ts";
import { Vault, VaultFee, _Strategy } from "../../generated/schema";
import { SetWithdrawFeeCall } from "../../generated/templates/Strategy/Strategy";
import { VaultFeeType } from "../constant";
import { enumToPrefix } from "../utils/strings";

export function handleSetWithdrawalFee(call: SetWithdrawFeeCall): void {
  const strategyAddress = call.to;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;
    const feeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE)
      .concat(strategyAddress.toHex())
      .concat("-")
      .concat(vaultAddress);

    let vaultFee = VaultFee.load(feeId);
    if (vaultFee == null) {
      vaultFee = new VaultFee(feeId);
    }

    vaultFee.feePercentage = call.inputs._withdrawFeeNumer.div(call.inputs._withdrawFeeDenom).toBigDecimal();
    vaultFee.feeType = VaultFeeType.WITHDRAWAL_FEE;
    vaultFee.save();

    let vault = Vault.load(vaultAddress);
    if (vault && vault.fees.indexOf(feeId) == -1) {
      vault.fees = [feeId];
    }

    log.warning("[BELT] withdrawal fee - vault {}, strategy {}, fee {}", [
      vaultAddress,
      strategyAddress.toHex(),
      vaultFee.feePercentage.toString(),
    ]);
  }
}
