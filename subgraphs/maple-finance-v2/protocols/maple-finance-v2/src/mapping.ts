import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { InstanceDeployed } from "../../../generated/PoolManagerFactory/ContractFactory";
import {
  MapleLoan,
  PaymentMade,
} from "../../../generated/templates/MapleLoan/MapleLoan";
import { MapleGlobals } from "../../../generated/templates/MapleLoan/MapleGlobals";
import { Chainlink } from "../../../generated/templates/MapleLoan/Chainlink";
import { LoanManager } from "../../../generated/LoanManagerFactory/LoanManager";
import { Liquidator } from "../../../generated/templates/Liquidator/Liquidator";
import {
  PoolManager as PoolManagerTemplate,
  MapleLoan as MapleLoanTemplate,
  Liquidator as LiquidatorTemplate,
  Pool as PoolTemplate,
} from "../../../generated/templates";
import {
  LiquidityCapSet,
  LoanFunded,
  PoolManager,
  SetAsActive,
} from "../../../generated/templates/PoolManager/PoolManager";
import { LoanAddedToTransitionLoanManager } from "../../../generated/MigrationHelper/MigrationHelper";
import { PortionLiquidated } from "../../../generated/templates/Liquidator/Liquidator";
import {
  Deposit,
  Pool,
  Withdraw,
} from "../../../generated/templates/PoolManager/Pool";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  INT_ZERO,
  SECONDS_PER_DAY,
  TokenType,
  TransactionType,
} from "../../../src/sdk/constants";
import { DataManager } from "../../../src/sdk/manager";
import { TokenManager } from "../../../src/sdk/token";
import {
  CHAINLINK_DECIMALS,
  getProtocolData,
  MAPLE_GLOBALS,
  ZERO_ADDRESS,
  DEFAULT_DECIMALS,
  USDC_ADDRESS,
  CHAINLINK_USDC_ORACLE,
  MIGRATION_HELPER,
} from "./constants";
import { MarketDailySnapshot, Token, _Loan } from "../../../generated/schema";
import { ERC20, Transfer } from "../../../generated/PoolManagerFactory/ERC20";

/////////////////////
//// Pool Events ////
/////////////////////

//
// Pool created event
export function handleManagerInstanceDeployed(event: InstanceDeployed): void {
  PoolManagerTemplate.create(event.params.instance_);

  const poolManagerContract = PoolManager.bind(event.params.instance_);
  const tryPool = poolManagerContract.try_pool();
  if (tryPool.reverted) {
    log.error(
      "[handleManagerInstanceDeployed] PoolManager contract {} does not have a pool",
      [event.params.instance_.toHexString()]
    );
    return;
  }
  PoolTemplate.create(tryPool.value);

  const poolContract = Pool.bind(tryPool.value);
  const outputToken = new TokenManager(
    tryPool.value,
    event,
    TokenType.REBASING
  );

  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error(
      "[handleManagerInstanceDeployed] Pool contract {} does not have an asset",
      [tryPool.value.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    tryPool.value,
    tryInputToken.value,
    event,
    getProtocolData()
  );

  const market = manager.getMarket();
  manager.getOrUpdateRate(
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE,
    BIGDECIMAL_ZERO
  );
  manager.getOrUpdateRate(
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    BIGDECIMAL_ZERO
  );

  // update market with maple specifics
  market.name = outputToken.getToken().name;
  market.outputToken = outputToken.getToken().id;
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.exchangeRate = BIGDECIMAL_ZERO; // exchange rate = (inputTokenBalance / outputTokenSupply) OR (totalAssets() / totalSupply())
  market.isActive = false; // controlled with setAsActive
  market.canBorrowFrom = false; // controlled with setAsActive
  market.canUseAsCollateral = false; // collateral is posted during loans separate from any deposits
  market.borrowedToken = tryInputToken.value;
  market.stableBorrowedTokenBalance = BIGINT_ZERO;
  market._poolManager = event.params.instance_;
  market.save();
}

//
// handles borrow creations for loans
export function handleLoanFunded(event: LoanFunded): void {
  const loan = getOrCreateLoan(event.params.loan_, event);
  const loanManagerContract = LoanManager.bind(event.params.loanManager_);
  const tryPool = loanManagerContract.try_pool();
  if (tryPool.reverted) {
    log.error(
      "[handleLoanFunded] LoanManager contract {} does not have a pool",
      [event.params.loanManager_.toHexString()]
    );
    return;
  }

  const mapleLoan = MapleLoan.bind(Address.fromBytes(loan.id));
  const tryBorrower = mapleLoan.try_borrower();
  if (tryBorrower.reverted) {
    log.error(
      "[handleLoanFunded] MapleLoan contract {} does not have a borrower",
      [loan.id.toHexString()]
    );
    return;
  }

  loan.borrower = tryBorrower.value;
  loan.market = Bytes.fromHexString(tryPool.value.toHexString());
  loan.loanManager = Bytes.fromHexString(
    event.params.loanManager_.toHexString()
  );
  loan.save();

  const poolContract = Pool.bind(tryPool.value);
  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error("[handleLoanFunded] Pool contract {} does not have an asset", [
      tryPool.value.toHexString(),
    ]);
    return;
  }

  const manager = new DataManager(
    tryPool.value,
    tryInputToken.value,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();
  let loans = market._loans;
  if (!loans) {
    loans = [];
  }
  loans.push(loan.id);
  market._loans = loans;
  market.save();

  const inputTokenPriceUSD = getPriceUSD(tryInputToken.value);
  const inputTokenDecimals = manager.getInputToken().decimals;
  manager.createBorrow(
    tryInputToken.value,
    tryBorrower.value,
    event.params.amount_,
    getTotalValueUSD(
      event.params.amount_,
      inputTokenDecimals,
      inputTokenPriceUSD
    ),
    event.params.amount_,
    inputTokenPriceUSD,
    InterestRateType.FIXED
  );
}

//
// handles money being migrated or transferred in the pool
export function handleTransfer(event: Transfer): void {
  if (event.params.from == ZERO_ADDRESS || event.params.to == ZERO_ADDRESS) {
    // burns/mints are not considered
    // Also we only want to handle transfers from the migration helper
    return;
  }

  if (event.params.from == event.address || event.params.to == event.address) {
    // this is a transfer to/from the pool itself
    return;
  }

  const poolContract = Pool.bind(event.address);
  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error("[handleTransfer] Pool contract {} does not have an asset", [
      event.address.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    event.address,
    tryInputToken.value,
    event,
    getProtocolData()
  );
  updateMarketAndProtocol(manager, event);

  const market = manager.getMarket();
  const inputTokenDecimals = manager.getInputToken().decimals;

  // get amount (in inputToken) by using the exchange rate
  const amount = BigInt.fromString(
    event.params.value
      .toBigDecimal()
      .times(market.exchangeRate!)
      .truncate(0)
      .toString()
  );
  const amountUSD = getTotalValueUSD(
    amount,
    inputTokenDecimals,
    market.inputTokenPriceUSD
  );

  if (event.params.from == Address.fromHexString(MIGRATION_HELPER)) {
    manager.createDeposit(
      market.inputToken,
      event.params.to,
      amount,
      amountUSD,
      getBalanceOf(event.address, event.params.to),
      InterestRateType.VARIABLE
    );
  } else {
    manager.createTransfer(
      market.inputToken,
      event.params.from,
      event.params.to,
      amount,
      amountUSD,
      getBalanceOf(event.address, event.params.from),
      getBalanceOf(event.address, event.params.to),
      InterestRateType.VARIABLE
    );
  }
}

//
// handle deposits to the pool
export function handleDeposit(event: Deposit): void {
  const poolContract = Pool.bind(event.address);
  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error("[handleDeposit] Pool contract {} does not have an asset", [
      event.address.toHexString(),
    ]);
    return;
  }

  const manager = new DataManager(
    event.address,
    tryInputToken.value,
    event,
    getProtocolData()
  );
  updateMarketAndProtocol(manager, event);
  const market = manager.getMarket();

  const amountUSD = getTotalValueUSD(
    event.params.assets_,
    manager.getInputToken().decimals,
    market.inputTokenPriceUSD
  );

  manager.createDeposit(
    market.inputToken,
    event.params.owner_,
    event.params.assets_,
    amountUSD,
    getBalanceOf(event.address, event.params.owner_),
    InterestRateType.VARIABLE
  );
}

//
// handle withdrawals from the pool
export function handleWithdraw(event: Withdraw): void {
  const poolContract = Pool.bind(event.address);
  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error("[handleWithdraw] Pool contract {} does not have an asset", [
      event.address.toHexString(),
    ]);
    return;
  }

  const manager = new DataManager(
    event.address,
    tryInputToken.value,
    event,
    getProtocolData()
  );
  updateMarketAndProtocol(manager, event);
  const market = manager.getMarket();

  const amountUSD = getTotalValueUSD(
    event.params.assets_,
    manager.getInputToken().decimals,
    market.inputTokenPriceUSD
  );

  manager.createWithdraw(
    market.inputToken,
    event.params.owner_,
    event.params.assets_,
    amountUSD,
    getBalanceOf(event.address, event.params.owner_),
    InterestRateType.VARIABLE
  );
}

//
// Sets the pool as active or not (isActive / canBorrowFrom)
// canUseAsCollateral is not affected bc it is never available
export function handleSetAsActive(event: SetAsActive): void {
  // get input token
  const poolManagerContract = PoolManager.bind(event.address);
  const tryAsset = poolManagerContract.try_asset();
  if (tryAsset.reverted) {
    log.error(
      "[handleSetAsActive] PoolManager contract {} does not have an asset",
      [event.address.toHexString()]
    );
    return;
  }
  const tryPool = poolManagerContract.try_pool();
  if (tryPool.reverted) {
    log.error(
      "[handleSetAsActive] PoolManager contract {} does not have a pool",
      [event.address.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    tryPool.value,
    tryAsset.value,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();
  market.isActive = event.params.active_;
  market.canBorrowFrom = event.params.active_;
  market.save();
}

//
// Set the supplyCap
export function handleLiquidityCapSet(event: LiquidityCapSet): void {
  // get input token
  const poolManagerContract = PoolManager.bind(event.address);
  const tryAsset = poolManagerContract.try_asset();
  if (tryAsset.reverted) {
    log.error(
      "[handleSetAsActive] PoolManager contract {} does not have an asset",
      [event.address.toHexString()]
    );
    return;
  }
  const tryPool = poolManagerContract.try_pool();
  if (tryPool.reverted) {
    log.error(
      "[handleSetAsActive] PoolManager contract {} does not have a pool",
      [event.address.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    tryPool.value,
    tryAsset.value,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();
  market.supplyCap = event.params.liquidityCap_;
  market.save();
}

/////////////////////
//// Loan Events ////
/////////////////////

//
// Create MapleLoan instance to watch loan contract
export function handleLoanInstanceDeployed(event: InstanceDeployed): void {
  MapleLoanTemplate.create(event.params.instance_);
  getOrCreateLoan(event.params.instance_, event);
}

//
// Handle loan repayments
export function handlePaymentMade(event: PaymentMade): void {
  const loan = getOrCreateLoan(event.address, event);
  if (!loan.market) {
    log.error("[handlePaymentMade] Loan {} does not have a market", [
      event.address.toHexString(),
    ]);
    return;
  }
  const poolManagerContract = PoolManager.bind(Address.fromBytes(loan.market!));
  const tryAsset = poolManagerContract.try_asset();
  if (tryAsset.reverted) {
    log.error(
      "[handlePaymentMade] PoolManager contract {} does not have an asset",
      [loan.market!.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    loan.market!,
    tryAsset.value,
    event,
    getProtocolData()
  );
  updateMarketAndProtocol(manager, event);

  const mapleLoanContract = MapleLoan.bind(event.address);
  const tryPrinciple = mapleLoanContract.try_principal();
  if (tryPrinciple.reverted) {
    log.error(
      "[handlePaymentMade] MapleLoan contract {} does not have a principal",
      [event.address.toHexString()]
    );
    return;
  }
  const tryBorrower = mapleLoanContract.try_borrower();
  if (tryBorrower.reverted) {
    log.error(
      "[handlePaymentMade] MapleLoan contract {} does not have a borrower",
      [event.address.toHexString()]
    );
    return;
  }
  const inputTokenPriceUSD = getPriceUSD(tryAsset.value);
  const repayAmount = event.params.principalPaid_.plus(
    event.params.interestPaid_
  );
  const inputTokenDecimals = manager.getInputToken().decimals;
  manager.createRepay(
    tryAsset.value,
    tryBorrower.value,
    repayAmount,
    getTotalValueUSD(repayAmount, inputTokenDecimals, inputTokenPriceUSD),
    tryPrinciple.value,
    inputTokenPriceUSD,
    InterestRateType.FIXED
  );

  // update protocol revenue collected
  // this is either from borrow fees, management fees or loan origination fees
  manager.addProtocolRevenue(
    getTotalValueUSD(event.params.fees_, inputTokenDecimals, inputTokenPriceUSD)
  );
}

//////////////////////////////
//// Loan Manager Events /////
//////////////////////////////

export function handleLoanManagerInstanceDeployed(
  event: InstanceDeployed
): void {
  const loanManagerContract = LoanManager.bind(event.params.instance_);
  const tryPool = loanManagerContract.try_pool();
  const tryAsset = loanManagerContract.try_fundsAsset();
  if (tryPool.reverted || tryAsset.reverted) {
    log.error(
      "[handleLoanManagerInstanceDeployed] LoanManager contract {} does not have a pool or fundsAsset",
      [event.params.instance_.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    tryPool.value,
    tryAsset.value,
    event,
    getProtocolData()
  );
  const protocol = manager.getProtocol();
  if (!protocol._loanManagers) {
    protocol._loanManagers = [];
  }
  const loanManagers = protocol._loanManagers!;
  loanManagers.push(event.params.instance_);
  protocol._loanManagers = loanManagers;
  protocol.save();

  const market = manager.getMarket();
  market._loanManager = Bytes.fromHexString(
    event.params.instance_.toHexString()
  );
  market.save();
}

///////////////////////////
//// Liquidator Events ////
///////////////////////////

export function handleLiquidatorInstanceDeployed(
  event: InstanceDeployed
): void {
  LiquidatorTemplate.create(event.params.instance_);
}

//
// This is the liquidation function
// Note: We don't create liquidate events because we don't have the data to do so
export function handlePortionLiquidated(event: PortionLiquidated): void {
  const liquidatorContract = Liquidator.bind(event.address);
  const tryLoanManager = liquidatorContract.try_loanManager();
  if (tryLoanManager.reverted) {
    log.error(
      "[handlePortionLiquidated] Liquidator contract {} does not have a loanManager",
      [event.address.toHexString()]
    );
    return;
  }
  const loanManagerContract = LoanManager.bind(tryLoanManager.value);
  const tryPool = loanManagerContract.try_pool();
  if (tryPool.reverted) {
    log.error(
      "[handlePortionLiquidated] LoanManager contract {} does not have a pool",
      [tryLoanManager.value.toHexString()]
    );
    return;
  }
  const poolContract = Pool.bind(tryPool.value);
  const tryAsset = poolContract.try_asset();
  if (tryAsset.reverted) {
    log.error(
      "[handlePortionLiquidated] Pool contract {} does not have an asset",
      [tryPool.value.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    tryPool.value,
    tryAsset.value,
    event,
    getProtocolData()
  );
  updateMarketAndProtocol(manager, event);

  const market = manager.getMarket();
  const amountUSD = getTotalValueUSD(
    event.params.returnedAmount_,
    manager.getInputToken().decimals,
    market.inputTokenPriceUSD
  );

  manager.updateTransactionData(
    TransactionType.LIQUIDATE,
    event.params.returnedAmount_,
    amountUSD
  );
}

//////////////////////////
//// Migration Events ////
//////////////////////////

//
// Track loans migrated from Maple V1 to Maple V2
export function handleLoanAddedToTransitionLoanManager(
  event: LoanAddedToTransitionLoanManager
): void {
  MapleLoanTemplate.create(event.params.loan_);
  const loan = getOrCreateLoan(event.params.loan_, event);
  const loanManagerContract = LoanManager.bind(event.params.loanManager_);
  const tryPool = loanManagerContract.try_pool();
  if (tryPool.reverted) {
    log.error(
      "[handleLoanAddedToTransitionLoanManager] LoanManager contract {} does not have a pool",
      [event.params.loanManager_.toHexString()]
    );
    return;
  }

  const mapleLoan = MapleLoan.bind(Address.fromBytes(loan.id));
  const tryBorrower = mapleLoan.try_borrower();
  if (tryBorrower.reverted) {
    log.warning(
      "[handleLoanAddedToTransitionLoanManager] MapleLoan contract {} does not have a borrower",
      [loan.id.toHexString()]
    );
  } else {
    loan.borrower = tryBorrower.value;
  }

  loan.market = Bytes.fromHexString(tryPool.value.toHexString());
  loan.loanManager = Bytes.fromHexString(
    event.params.loanManager_.toHexString()
  );
  loan.save();

  const poolContract = Pool.bind(tryPool.value);
  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error("[handleLoanFunded] Pool contract {} does not have an asset", [
      tryPool.value.toHexString(),
    ]);
    return;
  }

  const manager = new DataManager(
    tryPool.value,
    tryInputToken.value,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();
  let loans = market._loans;
  if (!loans) {
    loans = [];
  }
  loans.push(loan.id);
  market._loans = loans;
  market.save();

  updateMarketAndProtocol(manager, event);
}

/////////////////
//// Helpers ////
/////////////////

//
// Updates the market and protocol with latest data
// Prices, balances, exchange rate, TVL, rates
function updateMarketAndProtocol(
  manager: DataManager,
  event: ethereum.Event
): void {
  const market = manager.getMarket();
  if (!market._loanManager) {
    log.error(
      "[updateMarketAndProtocol] Market {} does not have a loan manager",
      [market.id.toHexString()]
    );
    return;
  }
  const loanManagerContract = LoanManager.bind(
    Address.fromBytes(market._loanManager!)
  );
  const poolContract = Pool.bind(Address.fromBytes(market.id));

  const tryBalance = poolContract.try_totalAssets(); // input tokens
  const tryTotalSupply = poolContract.try_totalSupply(); // output tokens
  if (tryBalance.reverted || tryTotalSupply.reverted) {
    log.error(
      "[updateMarketAndProtocol] Pool contract {} does not have a totalAssets or totalSupply",
      [market.id.toHexString()]
    );
    return;
  }
  const inputTokenPriceUSD = getPriceUSD(
    Address.fromBytes(manager.getInputToken().id)
  );

  const exchangeRate = safeDiv(
    tryBalance.value.toBigDecimal(),
    tryTotalSupply.value.toBigDecimal()
  );
  market.outputTokenSupply = tryTotalSupply.value;
  market.outputTokenPriceUSD = inputTokenPriceUSD.times(exchangeRate);
  market.save();

  const tryAUM = loanManagerContract.try_assetsUnderManagement();
  if (tryAUM.reverted) {
    log.error(
      "[updateMarketAndProtocol] LoanManager contract {} does not have a assetsUnderManagement",
      [market._loanManager!.toHexString()]
    );
    return;
  }

  manager.updateMarketAndProtocolData(
    inputTokenPriceUSD,
    tryBalance.value,
    tryAUM.value,
    null,
    null,
    exchangeRate
  );

  // calculate accrued interest on the loans
  const tryAccruedInterest = loanManagerContract.try_getAccruedInterest();
  if (tryAccruedInterest.reverted) {
    log.error(
      "[updateMarketAndProtocol] LoanManager contract {} does not have a getAccruedInterest",
      [market._loanManager!.toHexString()]
    );
    return;
  }
  if (!market._prevRevenue) {
    market._prevRevenue = BIGINT_ZERO;
  }

  if (market._prevRevenue!.lt(tryAccruedInterest.value)) {
    const revenueDelta = tryAccruedInterest.value.minus(market._prevRevenue!);
    market._prevRevenue = tryAccruedInterest.value;
    market.save();

    manager.addSupplyRevenue(
      getTotalValueUSD(
        revenueDelta,
        manager.getInputToken().decimals,
        inputTokenPriceUSD
      )
    );
  }

  updateBorrowRate(manager);
  updateSupplyRate(manager, event);
}

function updateBorrowRate(manager: DataManager): void {
  const market = manager.getMarket();

  // update borrow rate using the rate from the loans
  let totalPrincipal = BIGDECIMAL_ZERO;
  let rateAmount = BIGDECIMAL_ZERO;
  if (!market._loans) return;
  for (let i = 0; i < market._loans!.length; i++) {
    const loanContract = MapleLoan.bind(Address.fromBytes(market._loans![i]));
    const tryPrincipal = loanContract.try_principal();
    const tryRate = loanContract.try_interestRate();

    if (tryPrincipal.reverted || tryRate.reverted) {
      log.error(
        "[updateMarketAndProtocol] Loan contract {} does not have a principal or interestRate",
        [loanContract._address.toHexString()]
      );
      continue;
    }
    const principal = safeDiv(
      tryPrincipal.value.toBigDecimal(),
      exponentToBigDecimal(manager.getInputToken().decimals)
    );
    totalPrincipal = totalPrincipal.plus(principal);
    rateAmount = rateAmount.plus(
      principal.times(
        tryRate.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS))
      )
    );
  }

  // borrow rate = annual interest on all principal / total principal (in APR)

  // catch divide by zero
  if (totalPrincipal.equals(BIGDECIMAL_ZERO)) return;

  const borrowRate = safeDiv(rateAmount, totalPrincipal).times(
    exponentToBigDecimal(2)
  );
  manager.getOrUpdateRate(
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE,
    borrowRate
  );
}

function updateSupplyRate(manager: DataManager, event: ethereum.Event): void {
  const market = manager.getMarket();

  // update supply rate using interest from the last 30 days
  let totalInterest = BIGDECIMAL_ZERO;
  let days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  for (let i = 0; i < 30; i++) {
    const snapshotID = market.id.concat(Bytes.fromI32(days));
    const thisDailyMarketSnapshot = MarketDailySnapshot.load(snapshotID);
    if (thisDailyMarketSnapshot) {
      totalInterest = totalInterest.plus(
        thisDailyMarketSnapshot.dailySupplySideRevenueUSD
      );
    }

    // decrement days
    days--;
  }
  // catch divide by zero
  if (market.totalDepositBalanceUSD.equals(BIGDECIMAL_ZERO)) return;

  const supplyRate = safeDiv(
    totalInterest,
    market.totalDepositBalanceUSD
  ).times(exponentToBigDecimal(2));
  manager.getOrUpdateRate(
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    supplyRate
  );
}

//
// get the account balance of an account for any erc20 token
function getBalanceOf(erc20Contract: Address, account: Address): BigInt {
  const contract = ERC20.bind(erc20Contract);
  const tryBalance = contract.try_balanceOf(account);
  if (tryBalance.reverted) {
    log.error(
      "[getBalanceOf] Could not get balance of contract {} for account {}",
      [contract._address.toHexString(), account.toHexString()]
    );
    return BIGINT_ZERO;
  }
  return tryBalance.value;
}

function getPriceUSD(asset: Address): BigDecimal {
  const mapleGlobalsContract = MapleGlobals.bind(
    Address.fromString(MAPLE_GLOBALS)
  );
  let tryPrice = mapleGlobalsContract.try_getLatestPrice(asset);
  if (tryPrice.reverted) {
    if (asset == Address.fromString(USDC_ADDRESS)) {
      const chainlinkContract = Chainlink.bind(
        Address.fromString(CHAINLINK_USDC_ORACLE)
      );
      tryPrice = chainlinkContract.try_latestAnswer();
    } else {
      log.warning("[getPriceUSD] Could not get price for asset {}", [
        asset.toHexString(),
      ]);
      return BIGDECIMAL_ZERO;
    }
  }
  const token = Token.load(asset);
  if (!token) {
    log.warning("[getPriceUSD] Could not get token entity for asset {}", [
      asset.toHexString(),
    ]);
    return BIGDECIMAL_ZERO;
  }

  return tryPrice.value
    .toBigDecimal()
    .div(exponentToBigDecimal(CHAINLINK_DECIMALS));
}

//
// get the price of any amount with error handling
function getTotalValueUSD(
  amount: BigInt,
  decimals: i32,
  priceUSD: BigDecimal
): BigDecimal {
  if (decimals <= INT_ZERO) {
    return amount.toBigDecimal().times(priceUSD);
  } else {
    return amount
      .toBigDecimal()
      .div(exponentToBigDecimal(decimals))
      .times(priceUSD);
  }
}

function safeDiv(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b == BIGDECIMAL_ZERO) {
    return BIGDECIMAL_ZERO;
  }
  return a.div(b);
}

function getOrCreateLoan(loanId: Bytes, event: ethereum.Event): _Loan {
  let loan = _Loan.load(loanId);
  if (!loan) {
    loan = new _Loan(loanId);
    loan.rates = [];
    loan.transactionCreated = event.transaction.hash;
    loan.save();
  }
  return loan;
}
