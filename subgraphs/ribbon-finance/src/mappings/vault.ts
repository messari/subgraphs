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
} from "../common/initalizers";
import {
  NewOffer,
  OpenLoan,
  CloseLoan,
  OpenShort,
  CloseShort,
  PurchaseOption,
  PayOptionYield,
  InstantWithdraw,
  CollectVaultFees,
  DistributePremium,
  CollectManagementFee,
  CollectPerformanceFee,
  InitiateGnosisAuction,
  Deposit as DepositEvent,
  OpenShort1 as OpenShortV1,
  Withdraw as WithdrawEvent,
  Withdraw1 as WithdrawWithFee,
  CloseShort1 as CloseShortV1,
  RollToNextOptionCall as RollToNextOption,

} from "../../generated/ETHCallV2/RibbonThetaVaultWithSwap";
import * as utils from "../common/utils";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import { Vault } from "../../generated/schema";
import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { rollToNextOption } from "../modules/VaultLifecycle";
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

export function handleDeposit(event: DepositEvent): void {
  const vaultAddress = event.address;
  const block = event.block;
  const depositAmount = event.params.amount;

  getOrCreateVault(vaultAddress, event.block);
  updateVaultTVL(vaultAddress, block);
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updateVaultSnapshots(vaultAddress, event.block);

  
  Deposit(vaultAddress, depositAmount, event.transaction, event.block);
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


  Withdraw(vaultAddress, withdrawAmount, event.transaction, event.block);
  
}

export function handleInstantWithdraw(event: InstantWithdraw): void {
  const vaultAddress = event.address;
  const block = event.block;
  const withdrawAmount = event.params.amount;
  
  updateVaultTVL(vaultAddress, block);
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updateVaultSnapshots(vaultAddress, event.block);

  Withdraw(vaultAddress, withdrawAmount, event.transaction, event.block);
  
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

export function handleDistributePremium(event: DistributePremium): void {
    const premium = event.params.amount;
    const vaultAddress = event.address;

    if (vaultAddress == constants.NULL.TYPE_ADDRESS) return;
    
    const vault = getOrCreateVault(vaultAddress, event.block);

    const usdcToken = getOrCreateToken(
    constants.USDC_ADDRESS,
    event.block,
    vaultAddress,
    false
  );
    const premiumUSD = premium
      .divDecimal(
        constants.BIGINT_TEN.pow(6 as u8).toBigDecimal()
      )
      .times(usdcToken.lastPriceUSD!);

    updateVaultSnapshots(vaultAddress, event.block);

    updateRevenueSnapshots(
      vault,
      premiumUSD,
      constants.BIGDECIMAL_ZERO,
      event.block
    );
}

export function handleRollToNextOption(call: RollToNextOption): void {
  const vaultAddress = call.to;
  const block = call.block;
  rollToNextOption(vaultAddress, block);
  log.warning("[HandleRollToNextOption] transaction hash {}", [
    call.transaction.hash.toHexString(),
  ]);
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

export function handleOpenShort(event: OpenShort): void {

  utils.updateProtocolTotalValueLockedUSD();
  
  log.warning("[OpenShort] transaction hash {}", [
    event.transaction.hash.toHexString(),
  ]);
}

export function handleCloseShort(event: CloseShort): void {
  log.warning("[CloseShort] transaction hash {}", [
    event.transaction.hash.toHexString(),
  ]);
}

export function handleNewOffer(event: NewOffer): void {
  log.warning("[NewOffer] transaction hash {}", [
    event.transaction.hash.toHexString(),
  ]);
}



export function handleSwap(event: Swap): void {
  const auctionId = event.params.swapId;
  const soldAmount = event.params.signerAmount;
  const auction = getOrCreateAuction(auctionId);

  if (auction.vault == constants.NULL.TYPE_STRING) return;
  const vaultAddress = Address.fromString(auction.vault);
  const vault = getOrCreateVault(
    vaultAddress,
    event.block
  );
  const inputToken = getOrCreateToken(
    vaultAddress,
    event.block,
    Address.fromString(auction.vault),
    false
  );
  const soldAmountUSD = soldAmount
    .divDecimal(constants.BIGINT_TEN.pow(18).toBigDecimal())
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
  
  const vault = getOrCreateVault(
    vaultAddress,
    event.block
  );
  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block,
    vaultAddress,
    false
  );
  const soldAmountUSD = soldAmount
    .divDecimal(constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
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
export function handleOpenLoan(event: OpenLoan): void {
    utils.updateProtocolTotalValueLockedUSD();

    log.warning("[OpenLoan] transaction hash {}", [
      event.transaction.hash.toHexString(),
    ]);

}
export function handleCloseLoan(event: CloseLoan): void {
    utils.updateProtocolTotalValueLockedUSD();

    log.warning("[CloseShort] transaction hash {}", [
      event.transaction.hash.toHexString(),
    ]);

}
export function handleOpenShortV1(event: OpenShortV1): void {
    utils.updateProtocolTotalValueLockedUSD();

    log.warning("[OpenShort] transaction hash {}", [
      event.transaction.hash.toHexString(),
    ]);

}
export function handleCloseShortV1(event: CloseShortV1): void {
    utils.updateProtocolTotalValueLockedUSD();

    log.warning("[CloseShort] transaction hash {}", [
      event.transaction.hash.toHexString(),
    ]);

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
    .divDecimal(constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
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

  Withdraw(vaultAddress, withdrawAmount, event.transaction, event.block,feeAmount);
  
}


export function handleCollectManagementFee(event: CollectManagementFee): void{
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
  log.warning("[CollectManagementFee] transaction hash {}", [
    event.transaction.hash.toHexString(),
  ]);
}


export function handleCollectPerformanceFee(event: CollectPerformanceFee): void {
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
  log.warning("[CollectPerformanceFee] transaction hash {}", [
    event.transaction.hash.toHexString(),
  ]);
}



