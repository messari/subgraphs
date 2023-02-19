import {
  updateVaultTVL,
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  getOrCreateSwap,
  getOrCreateVault,
  getOrCreateToken,
  getOrCreateAuction,
} from "../common/initializers";
import {
  CapSet,
  Migrate,
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
  CapSet1 as CapSetWithManager,
} from "../../generated/templates/LiquidityGauge/RibbonThetaVaultWithSwap";
import * as utils from "../common/utils";
import { Vault } from "../../generated/schema";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { Transaction, updateVaultFees } from "../modules/Transaction";
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
  const soldAmount = event.params.soldBiddingTokens;
  const auction = getOrCreateAuction(auctionId);

  if (auction.vault == constants.NULL.TYPE_STRING) return;
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
  const soldAmountUSD = utils
    .bigIntToBigDecimal(soldAmount, vault._decimals)
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    soldAmountUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
  updateVaultSnapshots(Address.fromString(auction.vault), event.block);
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
  const totalFeeUSD = utils
    .bigIntToBigDecimal(totalFee, vault._decimals)
    .times(vaultAsset.lastPriceUSD!);

  updateRevenueSnapshots(vault, constants.BIGDECIMAL_ZERO, totalFeeUSD, block);
  updateVaultSnapshots(vaultAddress, event.block);
  updateVaultFees(vaultAddress, block);
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
  const soldAmountUSD = utils
    .bigIntToBigDecimal(soldAmount, inputToken.decimals)
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    soldAmountUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
  updateVaultSnapshots(vaultAddress, event.block);
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
  const soldAmountUSD = utils
    .bigIntToBigDecimal(soldAmount, inputToken.decimals)
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    soldAmountUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
  updateVaultSnapshots(vaultAddress, event.block);
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
  const netYieldUSD = utils
    .bigIntToBigDecimal(netYield, inputToken.decimals)
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
  const premiumUSD = utils
    .bigIntToBigDecimal(premium, vault._decimals)
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
  const managementFeeUSD = utils
    .bigIntToBigDecimal(managementFee, vault._decimals)
    .times(vaultAsset.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    managementFeeUSD,
    block
  );
  updateVaultSnapshots(vaultAddress, event.block);
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
  const performanceFeeUSD = utils
    .bigIntToBigDecimal(performanceFee, 6)
    .times(usdcToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    performanceFeeUSD,
    block
  );
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleCapSet(event: CapSet): void {
  const vaultAddress = event.address;
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;
  const vault = getOrCreateVault(vaultAddress, event.block);
  vault.depositLimit = event.params.newCap;
  vault.save();
}

export function handleCapSetWithManager(event: CapSetWithManager): void {
  const vaultAddress = event.address;
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;
  const vault = getOrCreateVault(vaultAddress, event.block);
  vault.depositLimit = event.params.newCap;
  vault.save();
}

export function handleMigrate(event: Migrate): void {
  const vaultAddress = event.address;
  Transaction(
    vaultAddress,
    constants.BIGINT_ZERO,
    event.transaction,
    event.block,
    constants.TransactionType.REFRESH
  );
}
