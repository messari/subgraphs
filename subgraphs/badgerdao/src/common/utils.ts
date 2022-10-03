import {
  BigInt,
  Address,
  ethereum,
  dataSource,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateVaultFee,
  getOrCreateYieldAggregator,
} from "./initializers";
import { PoolFeesType } from "./types";
import * as constants from "./constants";
import { ERC20 } from "../../generated/templates/Strategy/ERC20";
import { Vault as VaultStore, VaultFee } from "../../generated/schema";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";
import { Controller as ControllerContract } from "../../generated/templates/Strategy/Controller";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20.bind(tokenAddr);
  let decimals = readValue<i32>(token.try_decimals(), 18);

  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function getVaultStrategy(
  vaultAddress: Address,
  lpToken: Address
): Address {
  // Method 1: Vault strategy view function
  const vaultContract = VaultContract.bind(vaultAddress);
  let strategyAddress = readValue<Address>(
    vaultContract.try_strategy(),
    constants.NULL.TYPE_ADDRESS
  );

  if (strategyAddress.notEqual(constants.NULL.TYPE_ADDRESS))
    return strategyAddress;

  // Method 2: Using Controller
  const controllerAddress = readValue<Address>(
    vaultContract.try_controller(),
    constants.NULL.TYPE_ADDRESS
  );
  const controllerContract = ControllerContract.bind(controllerAddress);

  strategyAddress = readValue<Address>(
    controllerContract.try_strategies(lpToken),
    constants.NULL.TYPE_ADDRESS
  );

  return strategyAddress;
}

export function getVaultAddressFromController(
  controllerAddress: Address,
  wantToken: Address
): Address {
  const controllerContract = ControllerContract.bind(controllerAddress);

  const vaultAddress = readValue<Address>(
    controllerContract.try_vaults(wantToken),
    constants.NULL.TYPE_ADDRESS
  );

  return vaultAddress;
}

export function getBribesProcessor(strategyAddress: Address): Address {
  const strategyContract = StrategyContract.bind(strategyAddress);

  let bribesProcessor = readValue<Address>(
    strategyContract.try_BRIBES_PROCESSOR(),
    constants.NULL.TYPE_ADDRESS
  );
  if (bribesProcessor.notEqual(constants.NULL.TYPE_ADDRESS))
    return bribesProcessor;

  bribesProcessor = readValue<Address>(
    strategyContract.try_bribesProcessor(),
    constants.NULL.TYPE_ADDRESS
  );

  return bribesProcessor;
}

export function getVaultAddressFromContext(): Address {
  const context = dataSource.context();
  return Address.fromString(context.getString("vaultAddress"));
}

export function getVaultWithdrawalFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  const strategyContract = StrategyContract.bind(strategyAddress);

  let withdrawalFee = readValue<BigInt>(
    strategyContract.try_withdrawalFee(),
    constants.BIGINT_ZERO
  );

  if (withdrawalFee.equals(constants.BIGINT_ZERO)) {
    const vaultContract = VaultContract.bind(vaultAddress);

    withdrawalFee = readValue<BigInt>(
      vaultContract.try_withdrawalFee(),
      constants.BIGINT_ZERO
    );
  }

  let withdrawalFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE).concat(
      vaultAddress.toHexString()
    ),
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawalFee
      .divDecimal(constants.MAX_BPS)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return withdrawalFees;
}

export function getVaultPerformanceFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  const strategyContract = StrategyContract.bind(strategyAddress);

  let performanceFeeGovernance = readValue<BigInt>(
    strategyContract.try_performanceFeeGovernance(),
    constants.BIGINT_ZERO
  );

  if (performanceFeeGovernance.equals(constants.BIGINT_ZERO)) {
    const vaultContract = VaultContract.bind(vaultAddress);

    performanceFeeGovernance = readValue<BigInt>(
      vaultContract.try_performanceFeeGovernance(),
      constants.BIGINT_ZERO
    );
  }

  let performanceFeeStrategist = readValue<BigInt>(
    strategyContract.try_performanceFeeStrategist(),
    constants.BIGINT_ZERO
  );

  if (performanceFeeStrategist.equals(constants.BIGINT_ZERO)) {
    const vaultContract = VaultContract.bind(vaultAddress);

    performanceFeeStrategist = readValue<BigInt>(
      vaultContract.try_performanceFeeStrategist(),
      constants.BIGINT_ZERO
    );
  }

  let performanceFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE).concat(
      vaultAddress.toHexString()
    ),
    constants.VaultFeeType.PERFORMANCE_FEE,
    performanceFeeGovernance
      .plus(performanceFeeStrategist)
      .divDecimal(constants.MAX_BPS)
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return performanceFees;
}

export function getVaultFees(
  vaultAddress: Address,
  strategyAddress: Address
): PoolFeesType {
  let withdrawalFees = getVaultWithdrawalFees(vaultAddress, strategyAddress);

  let performanceFees = getVaultPerformanceFees(vaultAddress, strategyAddress);

  return new PoolFeesType(withdrawalFees, performanceFees);
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

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();

  let vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}
