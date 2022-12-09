import {
  log,
  BigInt,
  Address,
  ethereum,
  dataSource,
  BigDecimal,
  DataSourceContext,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateVaultFee,
  getOrCreateWantToken,
  getOrCreateYieldAggregator,
} from "./initializers";
import {
  Controller as ControllerTemplate,
  BribesProcessor as BribesProcessorTemplate,
} from "../../generated/templates";
import { PoolFeesType } from "./types";
import * as constants from "./constants";
import { updateRewardTokenInfo } from "../modules/Rewards";
import { ERC20 } from "../../generated/templates/Strategy/ERC20";
import { Token, Vault as VaultStore, VaultFee } from "../../generated/schema";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";
import { Controller as ControllerContract } from "../../generated/templates/Strategy/Controller";
import { RewardsLogger as RewardsLoggerContract } from "../../generated/templates/Strategy/RewardsLogger";

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
  const decimals = readValue<i32>(token.try_decimals(), 18);

  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function getStrategyWantToken(
  strategyAddress: Address,
  block: ethereum.Block
): Token {
  const strategyContract = StrategyContract.bind(strategyAddress);
  const wantTokenAddress = readValue<Address>(
    strategyContract.try_want(),
    constants.NULL.TYPE_ADDRESS
  );

  return getOrCreateToken(wantTokenAddress, block);
}

export function getStrategyFarmToken(
  strategyAddress: Address,
  block: ethereum.Block
): Token {
  const strategyContract = StrategyContract.bind(strategyAddress);
  const farmTokenAddress = readValue<Address>(
    strategyContract.try_farm(),
    constants.NULL.TYPE_ADDRESS
  );

  return getOrCreateToken(farmTokenAddress, block);
}

export function getStrategyXSushiToken(
  strategyAddress: Address,
  block: ethereum.Block
): Token {
  const strategyContract = StrategyContract.bind(strategyAddress);
  const farmTokenAddress = readValue<Address>(
    strategyContract.try_xsushi(),
    constants.NULL.TYPE_ADDRESS
  );

  return getOrCreateToken(farmTokenAddress, block);
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

  let vaultAddress = readValue<Address>(
    controllerContract.try_vaults(wantToken),
    constants.NULL.TYPE_ADDRESS
  );

  if (vaultAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return vaultAddress;

  if (
    controllerAddress.equals(constants.CONTROLLER_ADDRESS) &&
    wantToken.equals(constants.CVX_TOKEN_ADDRESS)
  )
    return constants.BVECVX_VAULT_ADDRESS;

  const wantTokenStore = getOrCreateWantToken(wantToken, null);
  vaultAddress = Address.fromString(wantTokenStore.vaultAddress);

  return vaultAddress;
}

export function getBribesProcessor(
  vaultAddress: Address,
  strategyAddress: Address
): Address {
  const strategyContract = StrategyContract.bind(strategyAddress);

  let bribesProcessor = readValue<Address>(
    strategyContract.try_BRIBES_PROCESSOR(),
    constants.NULL.TYPE_ADDRESS
  );

  if (bribesProcessor.equals(constants.NULL.TYPE_ADDRESS)) {
    bribesProcessor = readValue<Address>(
      strategyContract.try_bribesProcessor(),
      constants.NULL.TYPE_ADDRESS
    );
  }

  if (bribesProcessor.notEqual(constants.NULL.TYPE_ADDRESS)) {
    const context = new DataSourceContext();
    context.setString("vaultAddress", vaultAddress.toHexString());
    BribesProcessorTemplate.createWithContext(bribesProcessor, context);

    log.warning(
      "[SetBribesProcessor] Vault: {}, Strategy: {}, bribesProcessor: {}",
      [
        vaultAddress.toHexString(),
        strategyAddress.toHexString(),
        bribesProcessor.toHexString(),
      ]
    );
  }

  return bribesProcessor;
}

export function getControllerAddress(vaultAddress: Address): Address {
  const vaultContract = VaultContract.bind(vaultAddress);

  const controllerAddress = readValue<Address>(
    vaultContract.try_controller(),
    constants.NULL.TYPE_ADDRESS
  );

  if (controllerAddress.notEqual(constants.NULL.TYPE_ADDRESS))
    ControllerTemplate.create(controllerAddress);

  return controllerAddress;
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

  const withdrawalFees = getOrCreateVaultFee(
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

  const performanceFees = getOrCreateVaultFee(
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
  const withdrawalFees = getVaultWithdrawalFees(vaultAddress, strategyAddress);

  const performanceFees = getVaultPerformanceFees(
    vaultAddress,
    strategyAddress
  );

  return new PoolFeesType(withdrawalFees, performanceFees);
}

export function deactivateFinishedRewards(
  vault: VaultStore,
  block: ethereum.Block
): void {
  const rewardsLoggerContract = RewardsLoggerContract.bind(
    constants.REWARDS_LOGGER_ADDRESS
  );

  const unlockSchedulesArray =
    rewardsLoggerContract.try_getAllUnlockSchedulesFor(
      Address.fromString(vault.id)
    );
  if (unlockSchedulesArray.reverted) return;

  for (let i = 0; i < unlockSchedulesArray.value.length; i++) {
    const unlockSchedule = unlockSchedulesArray.value[i];

    if (unlockSchedule.end.lt(block.timestamp)) {
      updateRewardTokenInfo(
        vault,
        getOrCreateToken(unlockSchedule.token, block),
        constants.BIGINT_ZERO,
        block
      );
    }
  }
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

  const vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}
