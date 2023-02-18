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
  Initialized,
  MapleLoan,
  PaymentMade,
} from "../../../generated/templates/MapleLoan/MapleLoan";
import { MapleGlobals } from "../../../generated/templates/MapleLoan/MapleGlobals";
import { LoanManager } from "../../../generated/LoanManagerFactory/LoanManager";
import {
  PoolManager as PoolManagerTemplate,
  MapleLoan as MapleLoanTemplate,
  WithdrawalManager as WithdrawalManagerTemplate,
  Liquidator as LiquidatorTemplate,
  Pool as PoolTemplate,
} from "../../../generated/templates";
import {
  LiquidityCapSet,
  LoanFunded,
  PoolManager,
  SetAsActive,
  WithdrawalProcessed,
} from "../../../generated/templates/PoolManager/PoolManager";
import { PortionLiquidated } from "../../../generated/templates/Liquidator/Liquidator";
import { Pool } from "../../../generated/templates/PoolManager/Pool";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  TokenType,
} from "../../../src/sdk/constants";
import { DataManager } from "../../../src/sdk/manager";
import { TokenManager } from "../../../src/sdk/token";
import {
  CHAINLINK_DECIMALS,
  getProtocolData,
  MAPLE_GLOBALS,
  ZERO_ADDRESS,
} from "./constants";
import { Token, _Loan } from "../../../generated/schema";
import { ERC20, Transfer } from "../../../generated/PoolManagerFactory/ERC20";

/////////////////////
//// Pool Events ////
/////////////////////

// TODO: missing some PoolManager contexts for loan creation...

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
    Bytes.fromHexString(tryPool.value.toHexString()),
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
    Bytes.fromHexString(tryPool.value.toHexString()),
    Bytes.fromHexString(tryInputToken.value.toHexString()),
    event,
    getProtocolData()
  );

  const market = manager.getMarket();
  manager.getOrUpdateRate(
    InterestRateSide.BORROWER,
    InterestRateType.FIXED,
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
  market.borrowedToken = Bytes.fromHexString(tryInputToken.value.toHexString());
  market.stableBorrowedTokenBalance = BIGINT_ZERO;
  market._poolManager = event.params.instance_;
  market.save();
  // TODO: price oracle?
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
    Bytes.fromHexString(tryPool.value.toHexString()),
    Bytes.fromHexString(tryInputToken.value.toHexString()),
    event,
    getProtocolData()
  );

  const inputTokenPriceUSD = getPriceUSD(tryInputToken.value);
  const inputTokenDecimals = manager.getInputToken().decimals;
  manager.createBorrow(
    Bytes.fromHexString(tryInputToken.value.toHexString()),
    tryBorrower.value,
    event.params.amount_,
    event.params.amount_
      .toBigDecimal()
      .div(exponentToBigDecimal(inputTokenDecimals))
      .times(inputTokenPriceUSD),
    event.params.amount_,
    inputTokenPriceUSD,
    InterestRateType.FIXED
  );
}

//
// handles money being moved in/out the pool
// this includes Deposits / Withdrawals / Transfers
export function handleTransfer(event: Transfer): void {
  const poolContract = Pool.bind(event.address);
  const tryInputToken = poolContract.try_asset();
  if (tryInputToken.reverted) {
    log.error("[handleTransfer] Pool contract {} does not have an asset", [
      event.address.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    Bytes.fromHexString(event.address.toHexString()),
    Bytes.fromHexString(tryInputToken.value.toHexString()),
    event,
    getProtocolData()
  );
  updateMarketAndProtocol(manager);

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
  const amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputTokenDecimals))
    .times(market.inputTokenPriceUSD);

  if (event.params.from == ZERO_ADDRESS) {
    // tokens created (Deposit)
    manager.createDeposit(
      market.inputToken,
      event.params.to,
      amount,
      amountUSD,
      getBalanceOf(event.address, event.params.to),
      InterestRateType.VARIABLE
    );
  } else if (event.params.to == ZERO_ADDRESS) {
    // tokens destroyed (Withdrawal)
    manager.createWithdraw(
      market.inputToken,
      event.params.from,
      amount,
      amountUSD,
      getBalanceOf(event.address, event.params.from),
      InterestRateType.VARIABLE
    );
  } else {
    // tokens transferred (Transfer)
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
    Bytes.fromHexString(tryPool.value.toHexString()),
    Bytes.fromHexString(tryAsset.value.toHexString()),
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
    Bytes.fromHexString(tryPool.value.toHexString()),
    Bytes.fromHexString(tryAsset.value.toHexString()),
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
    Bytes.fromHexString(tryAsset.value.toHexString()),
    event,
    getProtocolData()
  );
  updateMarketAndProtocol(manager);

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
    Bytes.fromHexString(tryAsset.value.toHexString()),
    Bytes.fromHexString(tryBorrower.value.toHexString()),
    repayAmount,
    repayAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(inputTokenDecimals))
      .times(inputTokenPriceUSD),
    tryPrinciple.value,
    inputTokenPriceUSD,
    InterestRateType.FIXED
  );

  // update interest paid
  manager.addSupplyRevenue(
    event.params.interestPaid_
      .toBigDecimal()
      .div(exponentToBigDecimal(inputTokenDecimals))
      .times(inputTokenPriceUSD)
  );
  manager.addProtocolRevenue(
    event.params.interestPaid_
      .toBigDecimal()
      .div(exponentToBigDecimal(inputTokenDecimals))
      .times(inputTokenPriceUSD)
  );
}

//
// create loan (ie borrow position in a market)
export function handleLoanInitialized(event: Initialized): void {}

///////////////////////////
//// Withdrawal Events ////
///////////////////////////

export function handleWithdrawalInstanceDeployed(
  event: InstanceDeployed
): void {
  WithdrawalManagerTemplate.create(event.params.instance_);
}

export function handleWithdrawalProcessed(event: WithdrawalProcessed): void {}

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
    Bytes.fromHexString(tryPool.value.toHexString()),
    Bytes.fromHexString(tryAsset.value.toHexString()),
    event,
    getProtocolData()
  );
  const protocol = manager.getProtocol();
  if (!protocol._loanManagers) {
    protocol._loanManagers = [];
  }
  const loanManagers = protocol._loanManagers!;
  loanManagers.push(Bytes.fromHexString(event.params.instance_.toHexString()));
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
// Note: We don't get the market this was liquidated in or the accounts involved
export function handlePortionLiquidated(event: PortionLiquidated): void {
  // TODO: not sure how we want to handle this
}

/////////////////
//// Helpers ////
/////////////////

//
// Updates the market and protocol with latest data
// Prices, balances, exchange rate, TVL, rates
// TODO; update rates
function updateMarketAndProtocol(manager: DataManager): void {
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

  const tryAUM = loanManagerContract.try_assetsUnderManagement();
  if (tryAUM.reverted) {
    log.error(
      "[updateMarketAndProtocol] LoanManager contract {} does not have a assetsUnderManagement",
      [market._loanManager!.toHexString()]
    );
    return;
  }

  const exchangeRate = tryBalance.value
    .div(tryTotalSupply.value)
    .toBigDecimal();
  const inputTokenPriceUSD = getPriceUSD(
    Address.fromBytes(manager.getInputToken().id)
  );

  manager.updateMarketAndProtocolData(
    inputTokenPriceUSD,
    tryBalance.value,
    tryAUM.value,
    null,
    null,
    exchangeRate
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
  const tryPrice = mapleGlobalsContract.try_getLatestPrice(asset);
  if (tryPrice.reverted) {
    log.warning("[getPriceUSD] Could not get price for asset {}", [
      asset.toHexString(),
    ]);
    return BIGDECIMAL_ZERO;
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
