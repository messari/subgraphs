import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BadgerController } from "../../generated/badger-wbtc/BadgerController";
import { BadgerStrategy as StrategyContract } from "../../generated/badger-wbtc/BadgerStrategy";
import { Vault, VaultFee, _Strategy } from "../../generated/schema";
import { BadgerStrategy as StrategyTemplate } from "../../generated/templates";
import {
  BIGDECIMAL_HUNDRED,
  DEFAULT_PERFORMANCE_FEE,
  DEFAULT_WITHDRAWAL_FEE,
  NULL_ADDRESS,
  VaultFeeType,
} from "../constant";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";

export function createFeeType(
  feeId: string,
  feeType: string,
  try_feePercentage: ethereum.CallResult<BigInt>,
  defaultFeePercentage: BigInt,
): void {
  const fees = new VaultFee(feeId);

  let feePercentage = readValue<BigInt>(try_feePercentage, defaultFeePercentage);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage.toBigDecimal().div(BIGDECIMAL_HUNDRED);

  fees.save();
}

export function getOrCreateStrategy(
  controllerAddress: Address,
  vaultAddress: Address,
  _inputAddress: Address,
  _strategyAddress: Address | null = null,
): Address {
  const controller = BadgerController.bind(controllerAddress);
  let strategyAddress = _strategyAddress
    ? _strategyAddress
    : readValue<Address>(controller.try_strategies(_inputAddress), NULL_ADDRESS);

  if (strategyAddress.notEqual(NULL_ADDRESS)) {
    const vault = Vault.load(vaultAddress.toHex());
    const strategyContract = StrategyContract.bind(strategyAddress);

    let strategy = new _Strategy(strategyAddress.toHex());
    strategy.vaultAddress = vault!.id;
    strategy.inputToken = _inputAddress.toHex();
    strategy.save();

    const withdrawalFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE).concat(vaultAddress.toHex());
    createFeeType(
      withdrawalFeeId,
      VaultFeeType.WITHDRAWAL_FEE,
      strategyContract.try_withdrawalFee(),
      DEFAULT_WITHDRAWAL_FEE,
    );

    const performanceFeeId = enumToPrefix(VaultFeeType.PERFORMANCE_FEE).concat(vaultAddress.toHex());
    createFeeType(
      performanceFeeId,
      VaultFeeType.PERFORMANCE_FEE,
      strategyContract.try_performanceFeeGovernance(),
      DEFAULT_PERFORMANCE_FEE,
    );

    vault!.fees = [withdrawalFeeId, performanceFeeId];
    vault!.save();

    StrategyTemplate.create(strategyAddress);
  }

  return strategyAddress;
}
