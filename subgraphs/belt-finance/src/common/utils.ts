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

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals.toI32() as u8).toBigDecimal();
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

  let strategyCount = readValue<BigInt>(
    vaultContract.try_strategyCount(),
    constants.BIGINT_ZERO
  ).toI32();

  let vaultStrategies = new Array<Address>();
  for (let idx = 0; idx < strategyCount; idx++) {
    let strategyAddress = readValue<Address>(
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

  let underlyingStrategyAddress = readValue<Address>(
    strategyContract.try_strategy(),
    constants.NULL.TYPE_ADDRESS
  );

  return underlyingStrategyAddress;
}

export function getStrategyDepositFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  const strategyContract = StrategyContract.bind(strategyAddress);

  let entranceFeeNumer = readValue<BigInt>(
    strategyContract.try_entranceFeeNumer(),
    constants.BIGINT_ZERO
  );
  let entranceFeeDenom = readValue<BigInt>(
    strategyContract.try_entranceFeeDenom(),
    constants.BIGINT_ONE
  );

  let depositFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.DEPOSIT_FEE)
      .concat(vaultAddress.toHexString())
      .concat(strategyAddress.toHexString()),
    constants.VaultFeeType.DEPOSIT_FEE,
    entranceFeeNumer
      .div(entranceFeeDenom)
      .toBigDecimal()
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return depositFees;
}

export function getStrategyWithdrawalFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  let underlyingStrategyAddress = getUnderlyingStrategy(strategyAddress);
  const strategyContract = StrategyContract.bind(underlyingStrategyAddress);

  let withdrawFeeNumer = readValue<BigInt>(
    strategyContract.try_withdrawFeeNumer(),
    constants.BIGINT_ZERO
  );
  let withdrawFeeDenom = readValue<BigInt>(
    strategyContract.try_withdrawFeeDenom(),
    constants.BIGINT_ONE
  );

  let withdrawalFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE)
      .concat(vaultAddress.toHexString())
      .concat(underlyingStrategyAddress.toHexString()),
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawFeeNumer
      .div(withdrawFeeDenom)
      .toBigDecimal()
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return withdrawalFees;
}

export function getStrategyPerformaceFees(
  vaultAddress: Address,
  strategyAddress: Address
): VaultFee {
  let underlyingStrategyAddress = getUnderlyingStrategy(strategyAddress);
  const strategyContract = StrategyContract.bind(underlyingStrategyAddress);

  let buyBackRate = readValue<BigInt>(
    strategyContract.try_buyBackRate(),
    constants.BIGINT_ZERO
  );
  let buyBackPoolRate = readValue<BigInt>(
    strategyContract.try_buyBackPoolRate(),
    constants.BIGINT_ZERO
  );
  let buyBackRateMax = readValue<BigInt>(
    strategyContract.try_buyBackRateMax(),
    constants.BIGINT_ONE
  );

  let performanceFees = getOrCreateVaultFee(
    enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE)
      .concat(vaultAddress.toHexString())
      .concat(underlyingStrategyAddress.toHexString()),
    constants.VaultFeeType.PERFORMANCE_FEE,
    buyBackRate
      .plus(buyBackPoolRate)
      .div(buyBackRateMax)
      .toBigDecimal()
      .times(constants.BIGDECIMAL_HUNDRED)
  );

  return performanceFees;
}

export function getStrategyFees(
  vaultAddress: Address,
  strategyAddress: Address
): PoolFeesType {
  let depositFees = getStrategyDepositFees(vaultAddress, strategyAddress);
  let withdrawalFees = getStrategyWithdrawalFees(vaultAddress, strategyAddress);
  let performanceFees = getStrategyPerformaceFees(
    vaultAddress,
    strategyAddress
  );

  return new PoolFeesType(depositFees, withdrawalFees, performanceFees);
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
