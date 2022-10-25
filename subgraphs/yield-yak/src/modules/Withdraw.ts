import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { getOrCreateYieldAggregator } from "../common/initializers";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { DEFUALT_AMOUNT, BIGINT_TEN, ZERO_BIGINT, MAX_UINT256_STR } from "../helpers/constants";
import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import { calculateOutputTokenPriceInUSD } from "../calculators/outputTokenPriceInUSDCalculator";
import { Withdraw } from "../../generated/schema";

export function _Withdraw(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
  withdrawAmount: BigInt,
  sharesBurnt: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const strategyContract = YakStrategyV2.bind(contractAddress);
  const protocol = getOrCreateYieldAggregator();

  if (sharesBurnt.toString() == "-1" || sharesBurnt.toString() == MAX_UINT256_STR) {
    sharesBurnt = calculateSharesBurnt(vaultAddress, withdrawAmount);
  }

  if (withdrawAmount.toString() == "-1" || withdrawAmount.toString() == MAX_UINT256_STR) {
    withdrawAmount = calculateAmountWithdrawn(vaultAddress, sharesBurnt);
  }

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPriceUSD = calculatePriceInUSD(inputTokenAddress, withdrawAmount);
  let inputTokenDecimals = BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();


  let totalSupply = utils.readValue<BigInt>(
    strategyContract.try_totalSupply(),
    ZERO_BIGINT
  );
  vault.outputTokenSupply = totalSupply;

  let totalAssets = utils.readValue<BigInt>(
    strategyContract.try_totalDeposits(),
    ZERO_BIGINT
  );
  vault.inputTokenBalance = totalAssets;

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPriceUSD);

  vault.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  vault.pricePerShare = utils
    .readValue<BigInt>(strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT), ZERO_BIGINT)
    .toBigDecimal();

  let withdrawAmountUSD = withdrawAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPriceUSD)
    .div(inputTokenPriceUSD);

  createWithdrawTransaction(
    contractAddress,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );
}

export function calculateSharesBurnt(
  vaultAddress: Address,
  withdrawAmount: BigInt
): BigInt {
  let vaultContract = YakStrategyV2.bind(vaultAddress);
  let totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalDeposits(),
    ZERO_BIGINT
  );
  let totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    ZERO_BIGINT
  );
  let sharesBurnt = totalAssets.equals(ZERO_BIGINT)
    ? withdrawAmount
    : withdrawAmount.times(totalSupply).div(totalAssets);

  return sharesBurnt;
}

export function calculateAmountWithdrawn(
  vaultAddress: Address,
  sharesBurnt: BigInt
): BigInt {
  let vaultContract = YakStrategyV2.bind(vaultAddress);
  let totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalDeposits(),
    ZERO_BIGINT
  );
  let totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    ZERO_BIGINT
  );

  let amount = totalSupply.isZero()
    ? ZERO_BIGINT
    : sharesBurnt.times(totalAssets).div(totalSupply);

  return amount;
}

export function createWithdrawTransaction(
  to: Address,
  vaultAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): Withdraw {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = Withdraw.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new Withdraw(withdrawTransactionId);

    withdrawTransaction.vault = vaultAddress.toHexString();
    const protocol = getOrCreateYieldAggregator();
    withdrawTransaction.protocol = protocol.id;

    withdrawTransaction.to = to.toHexString();
    withdrawTransaction.from = transaction.from.toHexString();

    withdrawTransaction.hash = transaction.hash.toHexString();
    withdrawTransaction.logIndex = transaction.index.toI32();

    withdrawTransaction.asset = assetId;
    withdrawTransaction.amount = amount;
    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = block.timestamp;
    withdrawTransaction.blockNumber = block.number;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}