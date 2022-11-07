import {
  Address,
  ByteArray,
  Bytes,
  crypto,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { CometDeployed } from "../../../generated/Configurator/Configurator";
import {
  Comet,
  Supply,
  Withdraw,
  Transfer,
  SupplyCollateral,
  WithdrawCollateral,
} from "../../../generated/templates/Comet/Comet";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  bigIntToBigDecimal,
  BIGINT_HUNDRED,
  BIGINT_ONE,
  BIGINT_ZERO,
} from "../../../src/utils/constants";
import {
  getOrCreateLendingProtocol,
  getOrCreateMarket,
  getOrCreateOracle,
  getOrCreateToken,
  getOrCreateTokenData,
} from "../../../src/utils/getters";
import {
  CONFIGURATOR_ADDRESS,
  ENCODED_TRANSFER_SIGNATURE,
  getProtocolData,
  OracleSource,
  TokenType,
  ZERO_ADDRESS,
} from "./constants";
import { Comet as CometTemplate } from "../../../generated/templates";
import { createDeposit, createWithdraw } from "../../../src/utils/creator";

///////////////////////////////
///// Configurator Events /////
///////////////////////////////

//
//
// market creation
export function handleCometDeployed(event: CometDeployed): void {
  CometTemplate.create(event.params.cometProxy);

  const protocol = getOrCreateLendingProtocol(getProtocolData());
  const marketID = event.params.cometProxy;
  const market = getOrCreateMarket(event, marketID, protocol.id);
  market.canBorrowFrom = true;

  // create base token TokenData
  const tokenDataIDs: Bytes[] = [];
  const cometContract = Comet.bind(marketID);
  const tryBaseToken = cometContract.try_baseToken();
  const tryBaseOracle = cometContract.try_baseTokenPriceFeed();

  if (!tryBaseToken.reverted) {
    const baseTokenData = getOrCreateTokenData(marketID, tryBaseToken.value);
    baseTokenData.canUseAsCollateral = true;
    // TODO: set maxLTV, liquidationThreshold, liquidationPenalty, borrow tokens, output tokens

    // create output token
    const outputToken = getOrCreateToken(marketID);
    outputToken.type = TokenType.NON_REBASING;
    outputToken.save();

    market.name = outputToken.name;

    baseTokenData.outputTokens = [outputToken.id];
    baseTokenData.outputTokenBalances = [BIGINT_ZERO];
    baseTokenData.outputTokenPricesUSD = [BIGDECIMAL_ZERO];
    baseTokenData.exchangeRates = [BIGDECIMAL_ZERO];

    // create base token Oracle
    if (!tryBaseOracle.reverted) {
      const baseToken = getOrCreateToken(tryBaseToken.value);
      baseToken.oracle = getOrCreateOracle(
        event,
        tryBaseOracle.value,
        marketID,
        true,
        OracleSource.CHAINLINK
      ).id;
      baseToken.save();
    }

    baseTokenData.save();
    tokenDataIDs.push(baseTokenData.id);
  }

  // populate collateral token data
  let assetIndex = 0;
  let tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  while (!tryAssetInfo.reverted) {
    const inputTokenID = tryAssetInfo.value.asset;
    const tokenData = getOrCreateTokenData(marketID, inputTokenID);

    // add unique TokenData fields
    tokenData.canUseAsCollateral = true;
    tokenData.maximumLTV = bigIntToBigDecimal(
      tryAssetInfo.value.borrowCollateralFactor,
      16
    );
    tokenData.liquidationThreshold = bigIntToBigDecimal(
      tryAssetInfo.value.liquidateCollateralFactor,
      16
    );
    tokenData.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
      bigIntToBigDecimal(tryAssetInfo.value.liquidationFactor, 16)
    );
    tokenData.supplyCap = tryAssetInfo.value.supplyCap;
    tokenData.save();
    tokenDataIDs.push(tokenData.id);

    // Create TokenOracle
    const inputToken = getOrCreateToken(inputTokenID);
    inputToken.oracle = getOrCreateOracle(
      event,
      tryAssetInfo.value.priceFeed,
      marketID,
      true,
      OracleSource.CHAINLINK
    ).id;
    inputToken.save();

    // get next asset info
    assetIndex++;
    tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  }

  market.tokens = tokenDataIDs;
  market.save();
}

////////////////////////
///// Comet Events /////
////////////////////////

//
//
// Supplying the base token (could be a Deposit or Repay)
export function handleSupply(event: Supply): void {
  // TODO calculate repay like in withdraw
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const amount = event.params.amount;
  // TODO update all token price in this market

  const deposit = createDeposit(
    event,
    event.address, // marketID
    tryBaseToken.value,
    accountID,
    amount,
    BIGDECIMAL_ZERO
  );
  deposit.accountActor = accountActorID;
  deposit.save();
}

//
//
// Supplying collateral tokens
export function handleSupplyCollateral(event: SupplyCollateral): void {
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const asset = event.params.asset;
  const amount = event.params.amount;
  // TODO update all token price in this market

  const deposit = createDeposit(
    event,
    event.address, // marketID
    asset,
    accountID,
    amount,
    BIGDECIMAL_ZERO
  );
  deposit.accountActor = accountActorID;
  deposit.save();
}

//
//
// withdraws baseToken (could be a Withdrawal or Borrow)
export function handleWithdraw(event: Withdraw): void {
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const asset = Address.fromString(ZERO_ADDRESS);
  const amount = event.params.amount;

  const burnAmount = isBurn(event);
  if (!burnAmount) {
    // Borrow only
  } else if (burnAmount.toBigInt().gte(amount)) {
    // withdraw only
  } else {
    // burnAmount < amount
    // partial withdraw and partial borrow
    burn;
  }
}

// if (newPrincipal >= 0) {
// withdraw no borrow
// withdraw =
//   return (uint104(oldPrincipal - newPrincipal), 0);
// } else if (oldPrincipal <= 0) {
//   return (0, uint104(oldPrincipal - newPrincipal));
// } else {
//   return (uint104(oldPrincipal), uint104(-newPrincipal));
// }

//
// Withdraw collateral tokens (cannot be a Borrow)
export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  // TODO update all token price in this market

  const deposit = createWithdraw(
    event,
    event.address, // marketID
    asset,
    accountID,
    amount,
    BIGDECIMAL_ZERO // TODO price asset
  );
  deposit.accountActor = accountActorID;
  deposit.save();
}

export function handleTransfer(event: Transfer): void {}

///////////////////
///// Helpers /////
///////////////////

function isMint(event: ethereum.Event): BigInt | null {
  const transfer = findTransfer(event);
  if (!transfer) {
    // ie, this event is a Deposit (not a Repay)
    return null;
  }
  const fromAddress = ethereum
    .decode("address", transfer.topics.at(1))!
    .toAddress();
  if (
    fromAddress != Address.fromString(ZERO_ADDRESS) ||
    event.address != transfer.address
  ) {
    // coincidence that there is a transfer, must be a mint from the same comet
    return null;
  }

  // return transfer amount
  return ethereum.decode("uint256", transfer.data)!.toBigInt();
}

function isBurn(event: ethereum.Event): BigInt | null {
  const transfer = findTransfer(event);
  if (!transfer) {
    // ie, this event is a Withdrawal (not a Borrow)
    return null;
  }
  const toAddress = ethereum
    .decode("address", transfer.topics.at(2))!
    .toAddress();
  if (
    toAddress != Address.fromString(ZERO_ADDRESS) ||
    event.address != transfer.address
  ) {
    // coincidence that there is a transfer, must be a burn from the same comet
    return null;
  }

  // return transfer amount
  return ethereum.decode("uint256", transfer.data)!.toBigInt();
}

//
//
// Find and return transfer (as long as it is one index after the handled event)
function findTransfer(event: ethereum.Event): ethereum.Log | null {
  if (!event.receipt) {
    log.warning("[findTransfer] No receipt found for event: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return null;
  }

  const logs = event.receipt!.logs;
  const transferLogIndex = event.logIndex.plus(BIGINT_ONE); // expected index
  for (let i = 0; i < logs.length; i++) {
    let thisLog = logs[i];
    let logSignature = thisLog.topics[0];
    if (
      transferLogIndex.equals(thisLog.logIndex) &&
      logSignature == ENCODED_TRANSFER_SIGNATURE
    ) {
      return thisLog;
    }
  }

  return null;
}
