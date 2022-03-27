import * as constants from "../common/constants";
import {
  _Strategy,
  Vault as VaultStore,
  VaultFee,
} from "../../generated/schema";
import { ethereum, BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import { Strategy as StrategyContract } from "../../generated/controller/Strategy";
import { EthereumController as ControllerContract } from "../../generated/Controller/EthereumController";

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
  controllerAddress: Address,
  vaultAddress: Address,
  _inputAddress: Address,
  _strategyAddress: Address | null = null
): string {
  let strategyAddress: string;
  const controller = ControllerContract.bind(controllerAddress);

  if (!_strategyAddress) {
    let try_getStrategy = controller.try_strategies(_inputAddress);

    strategyAddress = try_getStrategy.reverted
      ? constants.ZERO_ADDRESS
      : try_getStrategy.value.toHex();
  } else {
    strategyAddress = _strategyAddress.toHexString();
  }

  if (strategyAddress != constants.ZERO_ADDRESS) {
    const strategy = new _Strategy(strategyAddress);
    const vault = VaultStore.load(vaultAddress.toHexString());
    const strategyContract = StrategyContract.bind(
      Address.fromString(strategyAddress)
    );

    strategy.vaultAddress = vaultAddress;
    strategy.inputToken = _inputAddress;
    strategy.save();

    const withdrawalFeeId = "withdrawal-fee-" + vaultAddress.toHexString();
    let withdrawalFee = strategyContract.try_withdrawalFee();
    createFeeType(
      withdrawalFeeId,
      constants.VaultFeeType.WITHDRAWAL_FEE,
      withdrawalFee,
      constants.DEFAULT_WITHDRAWAL_FEE
    );

    const performanceFeeId = "performance-fee-" + vaultAddress.toHexString();
    let performanceFee = strategyContract.try_performanceFee();
    createFeeType(
      performanceFeeId,
      constants.VaultFeeType.PERFORMANCE_FEE,
      performanceFee,
      constants.DEFAULT_PERFORMANCE_FEE
    );

    vault!.fees = [withdrawalFeeId, performanceFeeId];
    vault!.save();

    StrategyTemplate.create(Address.fromString(strategyAddress));
  }

  return strategyAddress;
}
