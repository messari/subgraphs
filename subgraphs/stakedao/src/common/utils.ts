import {
  getOrCreateLpToken,
  getOrCreateVaultFee,
  getOrCreateYieldAggregator,
} from "./initializers";
import { PoolFeesType } from "./types";
import * as constants from "./constants";
import { Vault as VaultStore } from "../../generated/schema";
import { ERC20 as ERC20Contract } from "../../generated/Controller/ERC20";
import { Vault as VaultContract } from "../../generated/templates/Vault/Vault";
import { Gauge as GaugeContract } from "../../generated/templates/Gauge/Gauge";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { Strategy as StrategyContract } from "../../generated/controller/Strategy";
import { EthereumController as ControllerContract } from "../../generated/Controller/EthereumController";
import { LiquidityLockerStrategy } from "../../generated/curveStrategy/LiquidityLockerStrategy";

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

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20Contract.bind(tokenAddr);

  const decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function getGaugeFromVault(vaultAddress: Address): Address {
  const vaultContract = VaultContract.bind(vaultAddress);

  const gaugeAddress = readValue<Address>(
    vaultContract.try_liquidityGauge(),
    constants.NULL.TYPE_ADDRESS
  );

  return gaugeAddress;
}

export function getVaultFromGauge(gaugeAddress: Address): Address {
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  let vaultAddress = readValue<Address>(
    gaugeContract.try_vault(),
    constants.NULL.TYPE_ADDRESS
  );

  if (vaultAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return vaultAddress;

  const lpTokenAddress = readValue<Address>(
    gaugeContract.try_stakingToken(),
    constants.NULL.TYPE_ADDRESS
  );

  const lpTokenStore = getOrCreateLpToken(lpTokenAddress);
  vaultAddress = Address.fromString(lpTokenStore.vaultAddress);

  return vaultAddress;
}

export function getVaultBalance(vaultAddress: Address): BigInt {
  const vaultContract = VaultContract.bind(vaultAddress);

  const balance = readValue(vaultContract.try_balance(), constants.BIGINT_ZERO);
  if (balance.notEqual(constants.BIGINT_ZERO)) return balance;

  const gaugeAddress = getGaugeFromVault(vaultAddress);
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  const totalSupply = readValue<BigInt>(
    gaugeContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  return totalSupply;
}

export function getMultiGaugeFromLiquidityLocker(
  gaugeAddress: Address,
  liquidityLockerStrategyAddress: Address
): Address {
  const liquidityLockerContract = LiquidityLockerStrategy.bind(
    liquidityLockerStrategyAddress
  );

  const multiGaugeAddress = readValue<Address>(
    liquidityLockerContract.try_multiGauges(gaugeAddress),
    constants.NULL.TYPE_ADDRESS
  );

  return multiGaugeAddress;
}

export function getPricePerFullShare(vaultAddress: Address): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const pricePerShare = readValue<BigInt>(
    vaultContract.try_getPricePerFullShare(),
    constants.BIGINT_ZERO
  ).toBigDecimal();

  return pricePerShare;
}

export function getInputTokenFromVault(vaultAddress: Address): Address {
  const vaultContract = VaultContract.bind(vaultAddress);

  const inputTokenAddress = readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  const lpTokenStore = getOrCreateLpToken(inputTokenAddress);
  lpTokenStore.vaultAddress = vaultAddress.toHexString();
  lpTokenStore.save();

  return inputTokenAddress;
}

export function getVaultFromController(
  controllerAddress: Address,
  inputTokenAddress: Address
): Address {
  const controller = ControllerContract.bind(controllerAddress);

  const vaultAddress = readValue<Address>(
    controller.try_vaults(inputTokenAddress),
    constants.NULL.TYPE_ADDRESS
  );

  return vaultAddress;
}

export function getStrategyFromController(
  controllerAddress: Address,
  inputTokenAddress: Address
): Address {
  const controller = ControllerContract.bind(controllerAddress);

  const strategyAddress = readValue<Address>(
    controller.try_strategies(inputTokenAddress),
    constants.NULL.TYPE_ADDRESS
  );

  return strategyAddress;
}

export function getVaultFees(
  vaultAddress: Address,
  strategyAddress: Address
): PoolFeesType {
  const strategyContract = StrategyContract.bind(strategyAddress);

  const withdrawalFee = readValue<BigInt>(
    strategyContract.try_withdrawalFee(),
    constants.DEFAULT_WITHDRAWAL_FEE
  );

  const withdrawalFeeId =
    enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
    vaultAddress.toHexString();
  const withdrawalFeeStore = getOrCreateVaultFee(
    withdrawalFeeId,
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawalFee.divDecimal(constants.BIGDECIMAL_HUNDRED)
  );

  const performanceFee = readValue<BigInt>(
    strategyContract.try_performanceFee(),
    constants.DEFAULT_PERFORMANCE_FEE
  );
  const performanceFeeId =
    enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) +
    vaultAddress.toHexString();
  const performanceFeeStore = getOrCreateVaultFee(
    performanceFeeId,
    constants.VaultFeeType.PERFORMANCE_FEE,
    performanceFee.divDecimal(constants.BIGDECIMAL_HUNDRED)
  );

  return new PoolFeesType(withdrawalFeeStore, performanceFeeStore);
}

export function getLiquidityLockersVaultFees(
  liquidityLockerStrategyAddress: Address,
  vaultAddress: Address
): PoolFeesType {
  const vaultContract = VaultContract.bind(vaultAddress);

  const withdrawalFee = readValue<BigInt>(
    vaultContract.try_withdrawalFee(),
    constants.DEFAULT_WITHDRAWAL_FEE
  );

  const withdrawalFeeId =
    enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
    vaultAddress.toHexString();
  const withdrawalFeeStore = getOrCreateVaultFee(
    withdrawalFeeId,
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawalFee.divDecimal(constants.BIGDECIMAL_HUNDRED)
  );

  const liquidityLockerContract = LiquidityLockerStrategy.bind(
    liquidityLockerStrategyAddress
  );

  const lpTokenAddress = readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  const gaugeAddress = readValue<Address>(
    liquidityLockerContract.try_gauges(lpTokenAddress),
    constants.NULL.TYPE_ADDRESS
  );

  const accumulatorFee = readValue<BigInt>(
    liquidityLockerContract.try_accumulatorFee(gaugeAddress),
    constants.DEFAULT_ACCUMULATOR_FEE
  );

  const claimerRewardFee = readValue<BigInt>(
    liquidityLockerContract.try_claimerRewardFee(gaugeAddress),
    constants.DEFAULT_CLAIMER_REWARD_FEE
  );

  const veSDTFee = readValue<BigInt>(
    liquidityLockerContract.try_veSDTFee(gaugeAddress),
    constants.DEFAULT_VE_SDT_FEE
  );

  const performanceFee = readValue<BigInt>(
    liquidityLockerContract.try_perfFee(gaugeAddress),
    constants.DEFAULT_PERFORMANCE_FEE
  );

  const performanceFeeId =
    enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) +
    vaultAddress.toHexString();
  const performanceFeeStore = getOrCreateVaultFee(
    performanceFeeId,
    constants.VaultFeeType.PERFORMANCE_FEE,
    accumulatorFee
      .plus(performanceFee)
      .plus(claimerRewardFee)
      .plus(veSDTFee)
      .divDecimal(constants.BIGDECIMAL_HUNDRED)
  );

  return new PoolFeesType(withdrawalFeeStore, performanceFeeStore);
}

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();

  const vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString());

  protocol._vaultIds = vaultIds;
  protocol.totalPoolCount += 1;

  protocol.save();
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultIds = protocol._vaultIds;

  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = VaultStore.load(vaultIds[vaultIdx]);

    totalValueLockedUSD = totalValueLockedUSD.plus(vault!.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}
