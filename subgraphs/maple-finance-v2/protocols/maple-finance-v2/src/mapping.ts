import { Address, BigDecimal, Bytes, log } from "@graphprotocol/graph-ts";
import { InstanceDeployed } from "../../../generated/PoolManagerFactory/ContractFactory";
import { Initialized } from "../../../generated/templates/MapleLoan/MapleLoan";
import { MapleGlobals } from "../../../generated/templates/MapleLoan/MapleGlobals";
import {
  PoolManager as PoolManagerTemplate,
  MapleLoan as MapleLoanTemplate,
  WithdrawalManager as WithdrawalManagerTemplate,
  Liquidator as LiquidatorTemplate,
  // LoanManager as LoanManagerTemplate,
} from "../../../generated/templates";
import {
  PoolManager,
  SetAsActive,
} from "../../../generated/templates/PoolManager/PoolManager";
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
import { getProtocolData, MAPLE_GLOBALS } from "./constants";
import { Token } from "../../../generated/schema";

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
  market.save();
  // TODO: price oracle?
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

/////////////////////
//// Loan Events ////
/////////////////////

// TODO: how do we associate a loan with a market??
// LoanManager interacts with Loans on PoolManager's behalf

//
// Create MapleLoan instance to watch loan contract
export function handleLoanInstanceDeployed(event: InstanceDeployed): void {
  MapleLoanTemplate.create(event.params.instance_);
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

//////////////////////////////
//// Loan Manager Events /////
//////////////////////////////

// export function handleLoanManagerInstanceDeployed(event: InstanceDeployed): void {
//   LoanManagerTemplate.create(event.params.instance_);
// }

///////////////////////////
//// Liquidator Events ////
///////////////////////////

export function handleLiquidatorInstanceDeployed(
  event: InstanceDeployed
): void {
  LiquidatorTemplate.create(event.params.instance_);
}

/////////////////
//// Helpers ////
/////////////////

function getPriceUSD(asset: Address): BigDecimal {
  const mapleGlobalsContract = MapleGlobals.bind(
    Address.fromHexString(MAPLE_GLOBALS)
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
    .div(exponentToBigDecimal(token.decimals));
}
