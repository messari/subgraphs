import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Token,
  Vault as VaultStore,
  Deposit as DepositTransaction,
} from "../../generated/schema";
import {
  getOrCreateVault,
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initalizers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/ETHCallV2/RibbonThetaVaultWithSwap";


export function createDepositTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  const transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vault.id;
    depositTransaction.protocol = constants.PROTOCOL_ID;

    depositTransaction.to = vault.id;
    depositTransaction.from = transaction.from.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    depositTransaction.logIndex = transaction.index.toI32();

    depositTransaction.asset = vault.inputToken;
    depositTransaction.amount = amount;
    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = block.timestamp;
    depositTransaction.blockNumber = block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

export function UpdateMetricsAfterDeposit(block: ethereum.Block): void {
  const protocol = getOrCreateYieldAggregator();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function Deposit(
  vaultAddress: Address,
  depositAmount: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  log.warning("[Deposit] vaultAddress {} transactionHash {}", [vaultAddress.toHexString(), transaction.hash.toHexString()])
  
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);

  const inputToken = Token.load(vault.inputToken);
  const inputTokenAddress = Address.fromString(vault.inputToken);
  const inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  const inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  );

  const depositAmountUSD = depositAmount
    .toBigDecimal()
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenDecimals.toBigDecimal());
  
  vault.outputTokenSupply = utils.getOutputTokenSupply(vaultAddress, block);

  const totalValue = utils.readValue<BigInt>(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = totalValue;
  
  if (totalValue.notEqual(constants.BIGINT_ZERO)) {
    vault.totalValueLockedUSD = vault.inputTokenBalance
      .toBigDecimal()
      .times(inputTokenPrice.usdPrice)
      .div(inputTokenDecimals.toBigDecimal());
  }

 
  
  const pricePerShare = utils.getVaultPricePerShare(vaultAddress);
  log.warning("[PricePerShare] pricePershare {}", [pricePerShare.toString()]);
  vault.pricePerShare = pricePerShare;
  vault.outputTokenPriceUSD = utils.getOptionTokenPriceUSD(vaultAddress,block);

  vault.save();

  createDepositTransaction(
    vault,
    depositAmount,
    depositAmountUSD,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);
  
  log.info(
    "[Deposit] vault: {}, depositAmount: {}, depositAmountUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      depositAmount.toString(),
      depositAmountUSD.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
