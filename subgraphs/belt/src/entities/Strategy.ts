import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Strategy } from "../../generated/beltBTC/Strategy";
import { Vault as VaultContract } from "../../generated/beltBTC/Vault";
import { Vault, VaultFee, _Strategy } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ZERO, BIGINT_ZERO, VaultFeeType } from "../constant";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";

export function createFeeType(feeId: string, feeType: string, feePercentage: BigDecimal): void {
  const fees = new VaultFee(feeId);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage;

  fees.save();
}

export function createStrategy(vault: Vault, strategyAddress: Address, tokenAddress: Address): void {
  const strategyContract = Strategy.bind(strategyAddress);

  let strategy = new _Strategy(strategyAddress.toHex());
  strategy.vaultAddress = vault!.id;
  strategy.inputToken = tokenAddress.toHex();
  strategy.save();

  let numer = readValue<BigInt>(strategyContract.try_withdrawFeeNumer(), BIGINT_ZERO);
  let denom = readValue<BigInt>(strategyContract.try_withdrawFeeDenom(), BIGINT_ZERO);

  let feePercentage = denom.isZero()
    ? BIGDECIMAL_ZERO
    : numer
        .toBigDecimal()
        .times(BIGDECIMAL_HUNDRED)
        .div(denom.toBigDecimal());
  let withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE)
    .concat(strategyAddress.toHex())
    .concat("-")
    .concat(vault.id);
  createFeeType(withdrawFeeId, VaultFeeType.WITHDRAWAL_FEE, feePercentage);

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  numer = readValue<BigInt>(vaultContract.try_entranceFeeNumer(), BIGINT_ZERO);
  denom = readValue<BigInt>(vaultContract.try_entranceFeeDenom(), BIGINT_ZERO);

  feePercentage = denom.isZero()
    ? BIGDECIMAL_ZERO
    : numer
        .toBigDecimal()
        .times(BIGDECIMAL_HUNDRED)
        .div(denom.toBigDecimal());
  let depositFeeId = enumToPrefix(VaultFeeType.DEPOSIT_FEE)
    .concat(strategyAddress.toHex())
    .concat("-")
    .concat(vault.id);
  createFeeType(depositFeeId, VaultFeeType.DEPOSIT_FEE, feePercentage);

  vault.fees = [withdrawFeeId, depositFeeId];
  vault.save();
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
