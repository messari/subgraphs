import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Strategy } from "../../generated/beltBTC/Strategy";
import { Vault as VaultContract } from "../../generated/beltBTC/Vault";
import { Vault, VaultFee, _Strategy } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, VaultFeeType } from "../constant";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";

export function createFeeType(feeId: string, feeType: string, feePercentage: BigInt): void {
  const fees = new VaultFee(feeId);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage.toBigDecimal();

  fees.save();
}

export function createStrategy(strategyAddress: Address, vaultAddress: Address, tokenAddress: Address): void {
  let vault = Vault.load(vaultAddress.toHex());
  const strategyContract = Strategy.bind(strategyAddress);

  let strategy = new _Strategy(strategyAddress.toHex());
  strategy.vaultAddress = vault!.id;
  strategy.inputToken = tokenAddress.toHex();
  strategy.save();

  let numer = readValue<BigInt>(strategyContract.try_withdrawFeeNumer(), BIGINT_ZERO);
  let denom = readValue<BigInt>(strategyContract.try_withdrawFeeDenom(), BIGINT_ZERO);

  let feePercentage = denom.isZero() ? BIGINT_ZERO : numer.div(denom);
  let withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE)
    .concat(strategyAddress.toHex())
    .concat("-")
    .concat(vaultAddress.toHex());
  createFeeType(withdrawFeeId, VaultFeeType.WITHDRAWAL_FEE, feePercentage);

  let vaultContract = VaultContract.bind(vaultAddress);
  numer = readValue<BigInt>(vaultContract.try_entranceFeeNumer(), BIGINT_ZERO);
  denom = readValue<BigInt>(vaultContract.try_entranceFeeDenom(), BIGINT_ZERO);

  feePercentage = denom.isZero() ? BIGINT_ZERO : numer.div(denom);
  let depositFeeId = enumToPrefix(VaultFeeType.DEPOSIT_FEE)
    .concat(strategyAddress.toHex())
    .concat("-")
    .concat(vaultAddress.toHex());
  createFeeType(withdrawFeeId, VaultFeeType.DEPOSIT_FEE, feePercentage);

  vault!.fees = [withdrawFeeId, depositFeeId];
  vault!.save();
}

export function getFeePercentage(vault: Vault, feeType: string): BigDecimal {
  for (let i = 0; i < vault.fees.length; i++) {
    let fee = vault.fees[i];
    let vaultFee = VaultFee.load(fee);

    if (vaultFee && vaultFee.feeType === feeType) {
      return vaultFee.feePercentage;
    }
  }

  return BIGDECIMAL_ZERO;
}
