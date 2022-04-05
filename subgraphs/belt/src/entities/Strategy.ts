import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Vault, VaultFee, _Strategy } from "../../generated/schema";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import { Strategy } from "../../generated/templates/Strategy/Strategy";
import { BIGINT_ZERO, NULL_ADDRESS, VaultFeeType } from "../constant";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";

export function createFeeType(feeId: string, feeType: string, feePercentage: BigInt): void {
  const fees = new VaultFee(feeId);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage.toBigDecimal();

  fees.save();
}

export function createStrategy(strategyAddress: Address, vaultAddress: Address, tokenAddress: Address): void {
  if (strategyAddress.notEqual(NULL_ADDRESS)) {
    let vault = Vault.load(vaultAddress.toHex());
    const strategyContract = Strategy.bind(strategyAddress);

    let strategy = new _Strategy(strategyAddress.toHex());
    strategy.vaultAddress = vault!.id;
    strategy.inputToken = tokenAddress.toHex();
    strategy.save();

    let numer = readValue<BigInt>(strategyContract.try_withdrawFeeNumer(), BIGINT_ZERO);
    let denom = readValue<BigInt>(strategyContract.try_withdrawFeeDenom(), BIGINT_ZERO);

    if (denom.notEqual(BIGINT_ZERO)) {
      let feePercentage = numer.div(denom);
      let feeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE)
        .concat(strategyAddress.toHex())
        .concat("-")
        .concat(vaultAddress.toHex());
      createFeeType(feeId, VaultFeeType.WITHDRAWAL_FEE, feePercentage);

      vault!.fees = [feeId];
      vault!.save();
    }

    StrategyTemplate.create(strategyAddress);
  }
}
