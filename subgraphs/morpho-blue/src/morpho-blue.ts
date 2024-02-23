import { BigInt, log } from "@graphprotocol/graph-ts";

import {
  AccrueInterest,
  Borrow,
  CreateMarket,
  EnableIrm,
  EnableLltv,
  FlashLoan,
  IncrementNonce,
  Liquidate,
  Repay,
  SetAuthorization,
  SetFee,
  SetFeeRecipient,
  SetOwner,
  Supply,
  SupplyCollateral,
  Withdraw,
  WithdrawCollateral,
} from "../generated/MorphoBlue/MorphoBlue";
import { BadDebtRealization } from "../generated/schema";

import { createMarket, getMarket, getZeroMarket } from "./initializers/markets";
import { getProtocol } from "./initializers/protocol";
import { AccountManager } from "./sdk/account";
import { BIGDECIMAL_WAD, PositionSide } from "./sdk/constants";
import { DataManager } from "./sdk/manager";
import { PositionManager } from "./sdk/position";
import { TokenManager } from "./sdk/token";

export function handleAccrueInterest(event: AccrueInterest): void {
  const market = getMarket(event.params.id);
  market.interest = market.interest.plus(event.params.interest);
  market.totalSupply = market.totalSupply.plus(event.params.interest);
  market.totalBorrow = market.totalBorrow.plus(event.params.interest);
  market.variableBorrowedTokenBalance = market.totalBorrow;
  market.inputTokenBalance = market.totalSupply;
  market.totalSupplyShares = market.totalSupplyShares.plus(
    event.params.feeShares
  );

  market.lastUpdate = event.block.timestamp;

  if (event.params.feeShares.gt(BigInt.zero())) {
    // We heck the consistency of the fee data
    // TODO: do we want to register theses invariants somewhere instead of throwing?
    if (market.fee.isZero()) {
      log.critical("Inconsistent fee data for market {}", [
        market.id.toHexString(),
      ]);
      const protocol = getProtocol();
      const feeRecipientAccount = new AccountManager(
        protocol.feeRecipient
      ).getAccount();
      const position = new PositionManager(
        feeRecipientAccount,
        market,
        PositionSide.SUPPLIER
      );
      // TODO: do not count the fee as a deposit in snapshots etc.
      position.addSupplyPosition(event, event.params.feeShares);
    }
  }

  market.save();
}

export function handleBorrow(event: Borrow): void {
  const market = getMarket(event.params.id);

  const account = new AccountManager(event.params.onBehalf).getAccount();

  const positionManager = new PositionManager(
    account,
    market,
    PositionSide.BORROWER
  );

  const position = positionManager.addBorrowPosition(
    event,
    event.params.shares
  );

  // We update the market after updating the position
  market.totalBorrow = market.totalBorrow.plus(event.params.assets);
  market.totalBorrowShares = market.totalBorrowShares.plus(event.params.shares);
  market.save();

  const manager = new DataManager(market.id, event);
  manager.createBorrow(position, event.params.shares, event.params.assets);

  manager.updateMarketAndProtocolData();
}

export function handleCreateMarket(event: CreateMarket): void {
  log.info("Handle new market created: {}", [event.params.id.toHexString()]);

  createMarket(event.params.id, event.params.marketParams, event);
}

export function handleEnableIrm(event: EnableIrm): void {
  const protocol = getProtocol();

  const irmList = protocol.irmEnabled;
  irmList.push(event.params.irm);

  protocol.irmEnabled = irmList;
  protocol.save();
}

export function handleEnableLltv(event: EnableLltv): void {
  const protocol = getProtocol();

  const lltvList = protocol.lltvEnabled;
  lltvList.push(event.params.lltv);

  protocol.lltvEnabled = lltvList;
  protocol.save();
}

export function handleFlashLoan(event: FlashLoan): void {
  const market = getZeroMarket(event);
  const manager = new DataManager(market.id, event);

  const token = new TokenManager(event.params.token, event);

  manager.createFlashloan(
    event.params.token,
    event.params.caller,
    event.params.assets
  );
}

export function handleIncrementNonce(event: IncrementNonce): void {}

export function handleLiquidate(event: Liquidate): void {
  const market = getMarket(event.params.id);

  market.totalCollateral = market.totalCollateral.minus(
    event.params.seizedAssets
  );
  market.save();

  const liquidatorAccount = new AccountManager(
    event.params.caller
  ).getAccount();

  liquidatorAccount.liquidationCount += 1;
  liquidatorAccount.save();

  const account = new AccountManager(event.params.borrower).getAccount();
  account.liquidateCount += 1;
  account.save();

  const borrowPosition = new PositionManager(
    account,
    market,
    PositionSide.BORROWER
  );

  borrowPosition.reduceBorrowPosition(
    event,
    // count bad debt shares as the amount repaid by all the suppliers
    event.params.repaidShares.plus(event.params.badDebtShares)
  );
  // The current position must be defined for a Repay

  const collateralPosition = new PositionManager(
    account,
    market,
    PositionSide.COLLATERAL
  );

  const manager = new DataManager(event.params.id, event);

  const liquidate = manager.createLiquidate(
    new AccountManager(event.params.caller).getAccount(),
    borrowPosition.getPosition()!,
    collateralPosition.getPosition()!,
    event.params.seizedAssets,
    event.params.repaidAssets
  );

  collateralPosition.reduceCollateralPosition(event, event.params.seizedAssets);

  market.totalBorrow = market.totalBorrow.minus(event.params.repaidAssets);
  market.totalBorrowShares = market.totalBorrowShares
    .minus(event.params.repaidShares)
    .minus(event.params.badDebtShares);
  if (event.params.badDebtShares.gt(BigInt.zero())) {
    market.totalSupply = market.totalSupply.minus(event.params.badDebtAssets);
    market.totalBorrow = market.totalBorrow.minus(event.params.badDebtAssets);

    const badDebtRealization = new BadDebtRealization(liquidate.id);
    badDebtRealization.liquidation = liquidate.id;
    badDebtRealization.market = market.id;
    badDebtRealization.badDebt = event.params.badDebtAssets;

    const loanToken = new TokenManager(market.borrowedToken, event);

    badDebtRealization.badDebtUSD = loanToken.getAmountUSD(
      event.params.badDebtAssets
    );
    badDebtRealization.save();
  }
  market.save();

  manager.updateMarketAndProtocolData();
}

export function handleRepay(event: Repay): void {
  const market = getMarket(event.params.id);
  const account = new AccountManager(event.params.onBehalf).getAccount();

  const positionManager = new PositionManager(
    account,
    market,
    PositionSide.BORROWER
  );

  const position = positionManager.reduceBorrowPosition(
    event,
    event.params.shares
  );

  market.totalBorrow = market.totalBorrow.minus(event.params.assets);
  market.totalBorrowShares = market.totalBorrowShares.minus(
    event.params.shares
  );
  market.save();

  const manager = new DataManager(market.id, event);
  manager.createRepay(position, event.params.shares, event.params.assets);

  manager.updateMarketAndProtocolData();
}

export function handleSetAuthorization(event: SetAuthorization): void {}

export function handleSetFee(event: SetFee): void {
  const market = getMarket(event.params.id);
  market.fee = event.params.newFee;
  market.reserveFactor = event.params.newFee.toBigDecimal().div(BIGDECIMAL_WAD);
  market.save();
}

export function handleSetFeeRecipient(event: SetFeeRecipient): void {
  const protocol = getProtocol();
  protocol.feeRecipient = event.params.newFeeRecipient;
  protocol.save();
}

export function handleSetOwner(event: SetOwner): void {
  const protocol = getProtocol();
  protocol.owner = event.params.newOwner;
  protocol.save();
}

export function handleSupply(event: Supply): void {
  const market = getMarket(event.params.id);
  const account = new AccountManager(event.params.onBehalf).getAccount();
  const positionManager = new PositionManager(
    account,
    market,
    PositionSide.SUPPLIER
  );

  const position = positionManager.addSupplyPosition(
    event,
    event.params.shares
  );

  market.totalSupply = market.totalSupply.plus(event.params.assets);
  market.totalSupplyShares = market.totalSupplyShares.plus(event.params.shares);
  market.save();

  const manager = new DataManager(market.id, event);
  manager.createDeposit(position, event.params.shares, event.params.assets);

  manager.updateMarketAndProtocolData();
}

export function handleSupplyCollateral(event: SupplyCollateral): void {
  const market = getMarket(event.params.id);
  market.totalCollateral = market.totalCollateral.plus(event.params.assets);
  market.save();

  const account = new AccountManager(event.params.onBehalf).getAccount();
  const positionManager = new PositionManager(
    account,
    market,
    PositionSide.COLLATERAL
  );

  const position = positionManager.addCollateralPosition(
    event,
    event.params.assets
  );

  const manager = new DataManager(market.id, event);
  manager.createDepositCollateral(position, event.params.assets);

  manager.updateMarketAndProtocolData();
}

export function handleWithdraw(event: Withdraw): void {
  const market = getMarket(event.params.id);
  const account = new AccountManager(event.params.onBehalf).getAccount();
  const positionManager = new PositionManager(
    account,
    market,
    PositionSide.SUPPLIER
  );

  const position = positionManager.reduceSupplyPosition(
    event,
    event.params.shares
  );

  market.totalSupply = market.totalSupply.minus(event.params.assets);
  market.totalSupplyShares = market.totalSupplyShares.minus(
    event.params.shares
  );
  market.save();

  const manager = new DataManager(market.id, event);
  manager.createWithdraw(position, event.params.shares, event.params.assets);

  manager.updateMarketAndProtocolData();
}

export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const market = getMarket(event.params.id);
  market.totalCollateral = market.totalCollateral.minus(event.params.assets);
  market.save();

  const account = new AccountManager(event.params.onBehalf).getAccount();
  const positionManager = new PositionManager(
    account,
    market,
    PositionSide.COLLATERAL
  );

  const position = positionManager.reduceCollateralPosition(
    event,
    event.params.assets
  );

  const manager = new DataManager(market.id, event);
  manager.createWithdrawCollateral(position, event.params.assets);

  manager.updateMarketAndProtocolData();
}
