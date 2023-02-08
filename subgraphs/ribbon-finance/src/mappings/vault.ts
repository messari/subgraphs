import {
  updateVaultTVL,
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateAuction,
  getOrCreateSwap,
} from "../common/initializers";
import {
  NewOffer,
  PurchaseOption,
  PayOptionYield,
  InstantWithdraw,
  CollectVaultFees,
  CollectManagementFee,
  CollectPerformanceFee,
  InitiateGnosisAuction,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Withdraw1 as WithdrawWithFee,
} from "../../generated/ETHCallV2/RibbonThetaVaultWithSwap";
import { Transaction } from "../modules/Transaction";
import { Vault } from "../../generated/schema";
import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { Swap as Airswap } from "../../generated/Airswap/Airswap";
import { Swap } from "../../generated/RibbonSwapOld/SwapContract";
import { AuctionCleared } from "../../generated/GnosisAuction/GnosisAuction";

export function handleInitiateGnosisAuction(
  event: InitiateGnosisAuction
): void {
  const auctionId = event.params.auctionCounter;
  const optionToken = event.params.auctioningToken;
  const biddingToken = event.params.biddingToken;
  const vaultAddress = event.address;

  getOrCreateToken(biddingToken, event.block, vaultAddress, false);
  getOrCreateToken(optionToken, event.block, vaultAddress, true);
  getOrCreateAuction(auctionId, vaultAddress, optionToken, biddingToken);
  getOrCreateVault(vaultAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleAuctionCleared(event: AuctionCleared): void {
  //gives supply side revenue
  const auctionId = event.params.auctionId;
  const tokensSold = event.params.soldAuctioningTokens; //options sold
  const soldAmount = event.params.soldBiddingTokens;
  const auction = getOrCreateAuction(auctionId);

  if (auction.vault == constants.NULL.TYPE_STRING) return;
  log.warning("[AuctionCleared] vault {} auction id {}", [
    auctionId.toString(),
    auction.vault,
  ]);
  const vault = getOrCreateVault(
    Address.fromString(auction.vault),
    event.block
  );
  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block,
    Address.fromString(auction.vault),
    false
  );
  const soldAmountUSD = soldAmount
    .divDecimal(constants.BIGINT_TEN.pow(vault._decimals as u8).toBigDecimal())
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    soldAmountUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
  updateVaultSnapshots(Address.fromString(auction.vault), event.block);

  log.warning(
    "[AuctionCleared] transaction hash {} difference {} tokensSold {} soldAmountETH {}",
    [
      event.transaction.hash.toHexString(),
      soldAmountUSD.toString(),
      tokensSold.toString(),
      soldAmount.toString(),
    ]
  );
}

export function handleDeposit(event: DepositEvent): void {
  const vaultAddress = event.address;
  const block = event.block;
  const depositAmount = event.params.amount;

  getOrCreateVault(vaultAddress, event.block);
  updateVaultTVL(vaultAddress, block);
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updateVaultSnapshots(vaultAddress, event.block);

  Transaction(
    vaultAddress,
    depositAmount,
    event.transaction,
    event.block,
    constants.TransactionType.DEPOSIT
  );
}

export function handleWithdraw(event: WithdrawEvent): void {
  const vaultAddress = event.address;
  const block = event.block;
  const withdrawAmount = event.params.amount;

  getOrCreateVault(vaultAddress, event.block);
  updateVaultTVL(vaultAddress, block);
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updateVaultSnapshots(vaultAddress, event.block);

  Transaction(
    vaultAddress,
    withdrawAmount,
    event.transaction,
    event.block,
    constants.TransactionType.WITHDRAW
  );
}

export function handleInstantWithdraw(event: InstantWithdraw): void {
  const vaultAddress = event.address;
  const block = event.block;
  const withdrawAmount = event.params.amount;

  updateVaultTVL(vaultAddress, block);
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updateVaultSnapshots(vaultAddress, event.block);

  Transaction(
    vaultAddress,
    withdrawAmount,
    event.transaction,
    event.block,
    constants.TransactionType.WITHDRAW
  );
}

export function handleCollectVaultFees(event: CollectVaultFees): void {
  const totalFee = event.params.vaultFee;
  const vaultAddress = event.address;
  const block = event.block;
  const vault = getOrCreateVault(vaultAddress, block);

  updateVaultTVL(vaultAddress, block);
  const vaultAsset = getOrCreateToken(
    Address.fromString(vault.inputToken),
    block,
    vaultAddress,
    false
  );
  const totalFeeUSD = totalFee
    .divDecimal(constants.BIGINT_TEN.pow(vault._decimals as u8).toBigDecimal())
    .times(vaultAsset.lastPriceUSD!);

  updateRevenueSnapshots(vault, constants.BIGDECIMAL_ZERO, totalFeeUSD, block);
  updateVaultSnapshots(vaultAddress, event.block);
  log.warning("[CollectVaultFees] transaction hash {}", [
    event.transaction.hash.toHexString(),
  ]);
}

export function handleNewOffer(event: NewOffer): void {
  const swapId = event.params.swapId;
  const optionToken = event.params.oToken;
  const biddingToken = event.params.biddingToken;
  const vaultAddress = event.params.seller;
  const vaultStore = Vault.load(vaultAddress.toHexString());
  if (!vaultStore) return;

  const swapOfferContractAddress = event.address.toHexString();
  const swapOfferId = swapOfferContractAddress
    .concat("-")
    .concat(swapId.toString());

  getOrCreateToken(biddingToken, event.block, vaultAddress, false);
  getOrCreateSwap(swapOfferId, vaultAddress, optionToken, biddingToken);
  getOrCreateVault(vaultAddress, event.block);
  updateVaultSnapshots(vaultAddress, event.block);
  log.warning("[NewOffer] transaction hash {}", [
    event.transaction.hash.toHexString(),
  ]);
}

export function handleSwap(event: Swap): void {
  const swapId = event.params.swapId;
  const soldAmount = event.params.signerAmount;
  const swapOfferContractAddress = event.address.toHexString();
  const swapOfferId = swapOfferContractAddress
    .concat("-")
    .concat(swapId.toString());

  const swapOffer = getOrCreateSwap(swapOfferId);
  if (swapOffer.vault == constants.NULL.TYPE_STRING) return;
  const vaultAddress = Address.fromString(swapOffer.vault);
  const vault = getOrCreateVault(vaultAddress, event.block);
  const inputToken = getOrCreateToken(
    vaultAddress,
    event.block,
    Address.fromString(swapOffer.vault),
    false
  );
  const soldAmountUSD = soldAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
    )
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    soldAmountUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
  updateVaultSnapshots(vaultAddress, event.block);

  log.warning(
    "[Swap] transaction hash {} soldamountUSD {} soldTokenAmount{} tokenPrice {} vault {} vaultDecimals {}",
    [
      event.transaction.hash.toHexString(),
      soldAmountUSD.toString(),
      soldAmount.toString(),
      inputToken.lastPriceUSD!.toString(),
      vault.id,
      vault._decimals.toString(),
    ]
  );
}

export function handleAirswap(event: Airswap): void {
  const vaultAddress = event.params.senderWallet;
  const soldAmount = event.params.signerAmount;

  if (vaultAddress == constants.NULL.TYPE_ADDRESS) return;
  const vaultStore = Vault.load(vaultAddress.toHexString());
  if (!vaultStore) return;

  const vault = getOrCreateVault(vaultAddress, event.block);
  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block,
    vaultAddress,
    false
  );
  const soldAmountUSD = soldAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
    )
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    soldAmountUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
  updateVaultSnapshots(vaultAddress, event.block);

  log.warning(
    "[AirSwap] transaction hash {} soldamountUSD {} soldTokenAmount{} tokenPrice {} vault {} vaultDecimals {}",
    [
      event.transaction.hash.toHexString(),
      soldAmountUSD.toString(),
      soldAmount.toString(),
      inputToken.lastPriceUSD!.toString(),
      vault.id,
      vault._decimals.toString(),
    ]
  );
}

export function handlePayOptionYield(event: PayOptionYield): void {
  const netYield = event.params.netYield;
  const vaultAddress = event.address;

  if (vaultAddress == constants.NULL.TYPE_ADDRESS) return;
  const vault = getOrCreateVault(vaultAddress, event.block);

  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block,
    vaultAddress,
    false
  );
  const netYieldUSD = netYield
    .divDecimal(
      constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
    )
    .times(inputToken.lastPriceUSD!);

  updateVaultSnapshots(vaultAddress, event.block);
  updateRevenueSnapshots(
    vault,
    netYieldUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}

export function handlePurchaseOption(event: PurchaseOption): void {
  const premium = event.params.premium;
  const vaultAddress = event.address;

  if (vaultAddress == constants.NULL.TYPE_ADDRESS) return;
  const vault = getOrCreateVault(vaultAddress, event.block);

  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block,
    vaultAddress,
    false
  );
  const premiumUSD = premium
    .divDecimal(constants.BIGINT_TEN.pow(vault._decimals as u8).toBigDecimal())
    .times(inputToken.lastPriceUSD!);

  updateVaultSnapshots(vaultAddress, event.block);

  updateRevenueSnapshots(
    vault,
    premiumUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}

export function handleWithdrawWithFee(event: WithdrawWithFee): void {
  const vaultAddress = event.address;
  const block = event.block;
  const withdrawAmount = event.params.amount;
  const feeAmount = event.params.fee;

  getOrCreateVault(vaultAddress, event.block);
  updateVaultTVL(vaultAddress, block);
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updateVaultSnapshots(vaultAddress, block);

  Transaction(
    vaultAddress,
    withdrawAmount,
    event.transaction,
    event.block,
    constants.TransactionType.WITHDRAW,
    feeAmount
  );
}

export function handleCollectManagementFee(event: CollectManagementFee): void {
  const managementFee = event.params.managementFee;
  const vaultAddress = event.address;
  const block = event.block;
  const vault = getOrCreateVault(vaultAddress, block);

  updateVaultTVL(vaultAddress, block);
  const vaultAsset = getOrCreateToken(
    Address.fromString(vault.inputToken),
    block,
    vaultAddress,
    false
  );
  const managementFeeUSD = managementFee
    .divDecimal(constants.BIGINT_TEN.pow(vault._decimals as u8).toBigDecimal())
    .times(vaultAsset.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    managementFeeUSD,
    block
  );
  updateVaultSnapshots(vaultAddress, event.block);
  log.warning(
    "[CollectManagementFee] transaction hash {} managementFee {} managementFeeUSD {}",
    [
      event.transaction.hash.toHexString(),
      managementFee.toString(),
      managementFeeUSD.toString(),
    ]
  );
}

export function handleCollectPerformanceFee(
  event: CollectPerformanceFee
): void {
  const performanceFee = event.params.performanceFee;
  const vaultAddress = event.address;
  const block = event.block;
  const vault = getOrCreateVault(vaultAddress, block);

  updateVaultTVL(vaultAddress, block);
  const usdcToken = getOrCreateToken(
    constants.USDC_ADDRESS,
    block,
    vaultAddress,
    false
  );
  const performanceFeeUSD = performanceFee
    .divDecimal(constants.BIGINT_TEN.pow(6 as u8).toBigDecimal())
    .times(usdcToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    performanceFeeUSD,
    block
  );
  updateVaultSnapshots(vaultAddress, event.block);
  log.warning(
    "[CollectPerformanceFee] transaction hash {} performanceFee {} performanceFeeUSD {}",
    [
      event.transaction.hash.toHexString(),
      performanceFee.toString(),
      performanceFeeUSD.toString(),
    ]
  );
}
