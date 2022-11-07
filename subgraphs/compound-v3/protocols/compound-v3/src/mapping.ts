import {
  Address,
  ByteArray,
  Bytes,
  crypto,
  ethereum,
  BigInt,
  log,
  BigDecimal,
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
  BIGDECIMAL_ONE,
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
  COMPOUND_DECIMALS,
  CONFIGURATOR_ADDRESS,
  ENCODED_TRANSFER_SIGNATURE,
  getProtocolData,
  OracleSource,
  TokenType,
  ZERO_ADDRESS,
} from "./constants";
import { Comet as CometTemplate } from "../../../generated/templates";
import {
  createBorrow,
  createDeposit,
  createRepay,
  createWithdraw,
} from "../../../src/utils/creator";
import {
  Market,
  Oracle,
  Repay,
  Token,
  TokenData,
} from "../../../generated/schema";

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
    baseTokenData.exchangeRates = [BIGDECIMAL_ONE];

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
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const amount = event.params.amount;
  const token = updateMarketPrices(event, tryBaseToken.value);
  if (!token) {
    log.warning("[handleSupply] Could not find token {}", [
      tryBaseToken.value.toHexString(),
    ]);
    return;
  }

  const mintAmount = isMint(event);
  if (!mintAmount) {
    // Repay only
    const repay = createRepay(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    repay.accountActor = accountActorID;
    repay.save();
  } else if (mintAmount.le(amount)) {
    // TODO ensure this is correct
    // deposit only
    const deposit = createDeposit(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    deposit.accountActor = accountActorID;
    deposit.save();
  } else {
    // mintAmount > amount
    // partial deposit and partial repay
    const repayAmount = amount.minus(mintAmount);
    const depositAmount = amount.minus(repayAmount);
    const repay = createRepay(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      repayAmount,
      bigIntToBigDecimal(repayAmount, token.decimals).times(token.lastPriceUSD!)
    );
    repay.accountActor = accountActorID;
    repay.save();

    const deposit = createDeposit(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      depositAmount,
      bigIntToBigDecimal(depositAmount, token.decimals).times(
        token.lastPriceUSD!
      )
    );
    deposit.accountActor = accountActorID;
    deposit.save();
  }
}

//
//
// Supplying collateral tokens
export function handleSupplyCollateral(event: SupplyCollateral): void {
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketPrices(event, asset);
  if (!token) {
    log.warning("[handleSupplyCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }

  const deposit = createDeposit(
    event,
    event.address, // marketID
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );
  deposit.accountActor = accountActorID;
  deposit.save();
}

//
//
// withdraws baseToken (could be a Withdrawal or Borrow)
export function handleWithdraw(event: Withdraw): void {
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const amount = event.params.amount;
  const token = updateMarketPrices(event, tryBaseToken.value);
  if (!token) {
    log.warning("[handleWithdraw] Could not find token {}", [
      tryBaseToken.value.toHexString(),
    ]);
    return;
  }

  const burnAmount = isBurn(event);
  if (!burnAmount) {
    // Borrow only
    const borrow = createBorrow(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    borrow.accountActor = accountActorID;
    borrow.save();
  } else if (burnAmount.ge(amount)) {
    // withdraw only
    const withdraw = createWithdraw(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    withdraw.accountActor = accountActorID;
    withdraw.save();
  } else {
    // burnAmount < amount
    // partial withdraw and partial borrow
    const borrowAmount = amount.minus(burnAmount);
    const withdrawAmount = amount.minus(borrowAmount);
    const borrow = createBorrow(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      borrowAmount,
      bigIntToBigDecimal(borrowAmount, token.decimals).times(
        token.lastPriceUSD!
      )
    );
    borrow.accountActor = accountActorID;
    borrow.save();

    const withdraw = createWithdraw(
      event,
      event.address,
      tryBaseToken.value,
      accountID,
      withdrawAmount,
      bigIntToBigDecimal(withdrawAmount, token.decimals).times(
        token.lastPriceUSD!
      )
    );
    withdraw.accountActor = accountActorID;
    withdraw.save();
  }
}

//
//
// Withdraw collateral tokens (cannot be a Borrow)
export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketPrices(event, asset);
  if (!token) {
    log.warning("[handleWithdrawCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }

  const deposit = createWithdraw(
    event,
    event.address, // marketID
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );
  deposit.accountActor = accountActorID;
  deposit.save();
}

export function handleTransfer(event: Transfer): void {}

///////////////////
///// Helpers /////
///////////////////

function updateMarketPrices(
  event: ethereum.Event,
  tokenAddress: Address // token we want the price of
): Token | null {
  const market = getOrCreateMarket(
    event,
    event.address,
    getProtocolData().protocolID
  );
  const tokens = market.tokens!;
  const marketAddress = event.address;
  let thisToken: Token | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const tokenData = TokenData.load(tokens[i]);
    if (!tokenData) {
      continue;
    }
    const inputToken = getOrCreateToken(tokenData.inputToken);
    const oracleData = Oracle.load(inputToken.oracle!);
    if (!oracleData) {
      continue;
    }
    const tokenPrice = getPrice(
      Address.fromBytes(oracleData.oracleAddress),
      marketAddress
    );

    tokenData.inputTokenPricesUSD = tokenPrice;
    if (tokenData.outputTokens) {
      tokenData.outputTokenPricesUSD = [tokenPrice];
    }
    tokenData.save();

    inputToken.lastPriceUSD = tokenPrice;
    inputToken.lastPriceBlockNumber = event.block.number;
    inputToken.save();

    if (inputToken.id == tokenAddress) {
      thisToken = inputToken;
    }
  }

  return thisToken;
}

function getPrice(priceFeed: Address, cometAddress: Address): BigDecimal {
  const cometContract = Comet.bind(cometAddress);
  const tryPrice = cometContract.try_getPrice(priceFeed);

  if (tryPrice.reverted) {
    return BIGDECIMAL_ZERO;
  }

  return bigIntToBigDecimal(tryPrice.value, COMPOUND_DECIMALS);
}

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
    const thisLog = logs[i];
    const logSignature = thisLog.topics[0];
    if (
      transferLogIndex.equals(thisLog.logIndex) &&
      logSignature == ENCODED_TRANSFER_SIGNATURE
    ) {
      return thisLog;
    }
  }

  return null;
}
