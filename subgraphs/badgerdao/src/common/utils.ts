import {
  BigInt,
  Address,
  ethereum,
  dataSource,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import * as constants from "./constants";
import {
  getOrCreateVault,
  createWithdrawalFee,
  createPerformanceFee,
  getOrCreateYieldAggregator,
} from "./initializers";
import { ERC20 } from "../../generated/templates/Strategy/ERC20";
import { VaultFee, Vault as VaultStore } from "../../generated/schema";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import { Controller as ControllerTemplate } from "../../generated/templates";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";
import { Controller as ControllerContract } from "../../generated/templates/Strategy/Controller";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function createFeeType(
  feeId: string,
  feeType: string,
  feePercentage: BigInt
): void {
  const fees = new VaultFee(feeId);

  fees.feeType = feeType;
  fees.feePercentage = feePercentage
    .toBigDecimal()
    .div(constants.BIGDECIMAL_HUNDRED);

  fees.save();
}

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20.bind(tokenAddr);
  let decimals = readValue<i32>(token.try_decimals(), 18);

  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
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

export function getVaultAddressFromContext(): Address {
  const context = dataSource.context();
  return Address.fromString(context.getString("vaultAddress"));
}

export function getVaultAddressFromStrategy(strategyAddress: Address): Address {
  const strategyContract = StrategyContract.bind(strategyAddress);

  const wantTokenAddress = readValue<Address>(
    strategyContract.try_want(),
    constants.NULL.TYPE_ADDRESS
  );
  const controllerAddress = readValue<Address>(
    strategyContract.try_controller(),
    constants.NULL.TYPE_ADDRESS
  );
  const controllerContract = ControllerContract.bind(controllerAddress);

  const vaultAddress = readValue<Address>(
    controllerContract.try_vaults(wantTokenAddress),
    constants.NULL.TYPE_ADDRESS
  );

  return vaultAddress;
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

export function getStrategyAddressFromController(
  controllerAddress: Address,
  wantToken: Address
): Address {
  const controllerContract = ControllerContract.bind(controllerAddress);

  const strategyAddress = readValue<Address>(
    controllerContract.try_strategies(wantToken),
    constants.NULL.TYPE_ADDRESS
  );

  return strategyAddress;
}

export function getStrategyAddressFromVault(vaultAddress: Address): Address {
  const vaultContract = VaultContract.bind(vaultAddress);

  const wantTokenAddress = readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );
  const controllerAddress = readValue<Address>(
    vaultContract.try_controller(),
    constants.NULL.TYPE_ADDRESS
  );
  if (controllerAddress.toHexString() != constants.NULL.TYPE_STRING) {
    ControllerTemplate.create(controllerAddress);
  }

  const controllerContract = ControllerContract.bind(controllerAddress);

  const strategyAddress = readValue<Address>(
    controllerContract.try_strategies(wantTokenAddress),
    constants.NULL.TYPE_ADDRESS
  );
  if (strategyAddress.toHexString() != constants.NULL.TYPE_STRING) {
    StrategyTemplate.create(strategyAddress);
  }

  return strategyAddress;
}

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();

  let vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}

export function checkStrategyAdded(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);

  const strategyAddress = getStrategyAddressFromVault(vaultAddress);
  const strategyContract = StrategyContract.bind(strategyAddress);

  const withdrawalFeeId = createWithdrawalFee(vaultAddress, strategyContract);
  const performanceFeeId = createPerformanceFee(vaultAddress, strategyContract);

  vault.fees = [withdrawalFeeId, performanceFeeId];

  vault._strategy = strategyAddress.toHexString();
  vault.save();

  if (strategyAddress.toHexString() != constants.NULL.TYPE_STRING) {
    StrategyTemplate.create(strategyAddress);
  }
}
