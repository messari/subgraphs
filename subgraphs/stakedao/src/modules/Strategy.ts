import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  VaultFee,
  _Strategy,
  Vault as VaultStore,
} from "../../generated/schema";
import { BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import { Strategy as StrategyContract } from "../../generated/controller/Strategy";
import { EthereumController as ControllerContract } from "../../generated/Controller/EthereumController";

export function createFeeType(
  feeId: string,
  feeType: string,
  feePercentage: BigInt
): void {
  const fees = new VaultFee(feeId);

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
    strategyAddress = utils
      .readValue<Address>(
        controller.try_strategies(_inputAddress),
        constants.ZERO_ADDRESS
      )
      .toHexString();
  } else {
    strategyAddress = _strategyAddress.toHexString();
  }

  if (strategyAddress != constants.ZERO_ADDRESS_STRING) {
    const strategy = new _Strategy(strategyAddress);
    const vault = VaultStore.load(vaultAddress.toHexString());
    const strategyContract = StrategyContract.bind(
      Address.fromString(strategyAddress)
    );

    strategy.vaultAddress = vaultAddress;
    strategy.inputToken = _inputAddress;
    strategy.save();

    const withdrawalFeeId = "withdrawal-fee-" + vaultAddress.toHexString();
    
    let withdrawalFee = utils.readValue<BigInt>(
      strategyContract.try_withdrawalFee(),
      constants.DEFAULT_WITHDRAWAL_FEE
    );
    createFeeType(
      withdrawalFeeId,
      constants.VaultFeeType.WITHDRAWAL_FEE,
      withdrawalFee,
    );

    const performanceFeeId = "performance-fee-" + vaultAddress.toHexString();
    
    let performanceFee = utils.readValue<BigInt>(
      strategyContract.try_performanceFee(),
      constants.DEFAULT_PERFORMANCE_FEE
    );
    createFeeType(
      performanceFeeId,
      constants.VaultFeeType.PERFORMANCE_FEE,
      performanceFee,
    );

    vault!.fees = [withdrawalFeeId, performanceFeeId];
    vault!.save();

    StrategyTemplate.create(Address.fromString(strategyAddress));
  }

  return strategyAddress;
}
