import {
  getOrCreateVaultFee,
  getOrCreateYieldAggregator,
} from "./initializers";
import {
  VaultFee,
  _BuyBack,
  Vault as VaultStore,
} from "../../generated/schema";
import { PoolFeesType } from "./types";
import * as constants from "../common/constants";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 as ERC20Contract } from "../../generated/templates/Strategy/ERC20";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  const decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals.toI32() as u8).toBigDecimal();
}

export function isVaultRegistered(vaultAddress: Address): boolean {
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) return false;
  return true;
}

export function isBuyBackTransactionPresent(
  transaction: ethereum.Transaction
): boolean {
  let buyBackStore = _BuyBack.load(transaction.hash.toHexString());

  if (!buyBackStore) {
    buyBackStore = new _BuyBack(transaction.hash.toHexString());

    buyBackStore.save();

    return false;
  }
  return true;
}

export function getVaultStrategies(vaultAddress: Address): Address[] {
  const vaultContract = VaultContract.bind(vaultAddress);

  const strategyCount = readValue<BigInt>(
    vaultContract.try_strategyCount(),
    constants.BIGINT_ZERO
  ).toI32();

  const vaultStrategies = new Array<Address>();
  for (let idx = 0; idx < strategyCount; idx++) {
    const strategyAddress = readValue<Address>(
      vaultContract.try_strategies(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (strategyAddress.equals(constants.NULL.TYPE_ADDRESS)) continue;

    vaultStrategies.push(strategyAddress);
  }

  return vaultStrategies;
}

export function getUnderlyingStrategy(strategyAddress: Address): Address {
  const strategyContract = StrategyContract.bind(strategyAddress);

  const underlyingStrategyAddress = readValue<Address>(
    strategyContract.try_strategy(),
    strategyAddress
  );

  return underlyingStrategyAddress;
}

export function getStrategyDepositFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  const strategyContract = StrategyContract.bind(strategyAddress);

  const entranceFeeNumer = readValue<BigInt>(
    strategyContract.try_entranceFeeNumer(),
    constants.BIGINT_ZERO
  );
  const entranceFeeDenom = readValue<BigInt>(
    strategyContract.try_entranceFeeDenom(),
    constants.BIGINT_ONE
  );

  const depositFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.DEPOSIT_FEE)
      .concat(vaultAddress.toHexString())
      .concat("-")
      .concat(strategyAddress.toHexString()),
    constants.VaultFeeType.DEPOSIT_FEE,
    entranceFeeNumer
      .divDecimal(entranceFeeDenom.toBigDecimal())
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return depositFees;
}

export function getStrategyWithdrawalFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  const underlyingStrategyAddress = getUnderlyingStrategy(strategyAddress);
  const strategyContract = StrategyContract.bind(underlyingStrategyAddress);

  const withdrawFeeNumer = readValue<BigInt>(
    strategyContract.try_withdrawFeeNumer(),
    constants.BIGINT_ZERO
  );
  const withdrawFeeDenom = readValue<BigInt>(
    strategyContract.try_withdrawFeeDenom(),
    constants.BIGINT_ONE
  );

  const withdrawalFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE)
      .concat(vaultAddress.toHexString())
      .concat("-")
      .concat(strategyAddress.toHexString()),
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawFeeNumer
      .divDecimal(withdrawFeeDenom.toBigDecimal())
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return withdrawalFees;
}

export function getStrategyPerformaceFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  const underlyingStrategyAddress = getUnderlyingStrategy(strategyAddress);
  const strategyContract = StrategyContract.bind(underlyingStrategyAddress);

  const buyBackRate = readValue<BigInt>(
    strategyContract.try_buyBackRate(),
    constants.BIGINT_ZERO
  );
  const buyBackPoolRate = readValue<BigInt>(
    strategyContract.try_buyBackPoolRate(),
    constants.BIGINT_ZERO
  );
  const buyBackRateMax = readValue<BigInt>(
    strategyContract.try_buyBackRateMax(),
    constants.BIGINT_ONE
  );

  const performanceFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE)
      .concat(vaultAddress.toHexString())
      .concat("-")
      .concat(strategyAddress.toHexString()),
    constants.VaultFeeType.PERFORMANCE_FEE,
    buyBackRate
      .plus(buyBackPoolRate)
      .divDecimal(buyBackRateMax.toBigDecimal())
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return performanceFees;
}

export function getStrategyFees(
  vaultAddress: Address,
  strategyAddress: Address
): PoolFeesType {
  const depositFees = getStrategyDepositFees(vaultAddress, strategyAddress);
  const withdrawalFees = getStrategyWithdrawalFees(vaultAddress, strategyAddress);
  const performanceFees = getStrategyPerformaceFees(
    vaultAddress,
    strategyAddress
  );

  return new PoolFeesType(depositFees, withdrawalFees, performanceFees);
}

export function getVaultFees(vaultAddress: Address): string[] {
  const vaultStrategies = getVaultStrategies(vaultAddress);

  let vaulFees: string[] = [];

  for (let idx = 0; idx < vaultStrategies.length; idx++) {
    vaulFees = vaulFees.concat(
      getStrategyFees(vaultAddress, vaultStrategies.at(idx)).stringIds()
    );
  }

  return vaulFees;
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
