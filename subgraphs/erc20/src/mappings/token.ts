import {
  BigDecimal,
  Bytes,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { ERC20, Transfer } from "../../generated/templates/StandardToken/ERC20";
import { Burn } from "../../generated/templates/BurnableToken/Burnable";
import { Mint } from "../../generated/templates/MintableToken/Mintable";

import {
  Token,
  TokenDailySnapshot,
  TokenHourlySnapshot,
  TransferEvent,
} from "../../generated/schema";

import {
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  GENESIS_ADDRESS,
  BIGINT_ZERO,
  BIGINT_ONE,
  BIGINT_TWO,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
} from "../common/constants";

import { toDecimal } from "./registry";
import {
  getOrCreateAccount,
  getOrCreateAccountBalance,
  increaseAccountBalance,
  decreaseAccountBalance,
  isNewAccount,
  updateAccountBalanceDailySnapshot,
} from "./account";

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex());

  if (token != null) {
    if (token.name == "") {
      let erc20 = ERC20.bind(event.address);
      let tokenName = erc20.try_name();
      let tokenSymbol = erc20.try_symbol();
      let tokenDecimals = erc20.try_decimals();

      token.name = tokenName.reverted ? "" : tokenName.value;
      token.symbol = tokenSymbol.reverted ? "" : tokenSymbol.value;
      token.decimals = tokenDecimals.reverted
        ? DEFAULT_DECIMALS
        : tokenDecimals.value;
      token.totalSupply = BIGDECIMAL_ZERO;
    }

    if (event.params.value == BIGINT_ZERO) {
      return;
    }
    let amount = toDecimal(event.params.value, token.decimals);

    let isBurn = event.params.to.toHex() == GENESIS_ADDRESS;
    let isMint = event.params.from.toHex() == GENESIS_ADDRESS;
    let isTransfer = !isBurn && !isMint;
    let isEventProcessed = false;

    if (isBurn) {
      isEventProcessed = handleBurnEvent(
        token,
        amount,
        event.params.from,
        event
      );
    } else if (isMint) {
      isEventProcessed = handleMintEvent(token, amount, event.params.to, event);
    } else {
      // In this case, it will be a normal transfer event.
      handleTransferEvent(
        token,
        amount,
        event.params.from,
        event.params.to,
        event
      );
    }

    // Updates balances of accounts
    if (isEventProcessed) {
      return;
    }
    if (isTransfer || isBurn) {
      let sourceAccount = getOrCreateAccount(event.params.from);

      let accountBalance = decreaseAccountBalance(
        sourceAccount,
        token as Token,
        amount
      );
      accountBalance.blockNumber = event.block.number;
      accountBalance.timestamp = event.block.timestamp;

      sourceAccount.save();
      accountBalance.save();

      // To provide information about evolution of account balances
      updateAccountBalanceDailySnapshot(accountBalance, event);
    }

    if (isTransfer || isMint) {
      let destinationAccount = getOrCreateAccount(event.params.to);

      let accountBalance = increaseAccountBalance(
        destinationAccount,
        token as Token,
        amount
      );
      accountBalance.blockNumber = event.block.number;
      accountBalance.timestamp = event.block.timestamp;

      destinationAccount.save();
      accountBalance.save();

      // To provide information about evolution of account balances
      updateAccountBalanceDailySnapshot(accountBalance, event);
    }
  }
}

export function handleBurn(event: Burn): void {
  let token = Token.load(event.address.toHex());

  if (token != null) {
    let amount = toDecimal(event.params.value, token.decimals);

    let isEventProcessed = handleBurnEvent(
      token,
      amount,
      event.params.burner,
      event
    );
    if (isEventProcessed) {
      return;
    }

    // Update source account balance
    let account = getOrCreateAccount(event.params.burner);

    let accountBalance = decreaseAccountBalance(
      account,
      token as Token,
      amount
    );
    accountBalance.blockNumber = event.block.number;
    accountBalance.timestamp = event.block.timestamp;

    account.save();
    accountBalance.save();

    // To provide information about evolution of account balances
    updateAccountBalanceDailySnapshot(accountBalance, event);
  }
}

export function handleMint(event: Mint): void {
  let token = Token.load(event.address.toHex());

  if (token != null) {
    let amount = toDecimal(event.params.amount, token.decimals);
    let isEventProcessed = handleMintEvent(
      token,
      amount,
      event.params.to,
      event
    );
    if (isEventProcessed) {
      return;
    }

    // Update destination account balance
    let account = getOrCreateAccount(event.params.to);

    let accountBalance = increaseAccountBalance(
      account,
      token as Token,
      amount
    );
    accountBalance.blockNumber = event.block.number;
    accountBalance.timestamp = event.block.timestamp;

    account.save();
    accountBalance.save();

    // To provide information about evolution of account balances
    updateAccountBalanceDailySnapshot(accountBalance, event);
  }
}

function handleBurnEvent(
  token: Token | null,
  amount: BigDecimal,
  burner: Bytes,
  event: ethereum.Event
): boolean {
  // Track total supply/burned
  if (token != null) {
    let totalSupply = ERC20.bind(event.address).try_totalSupply();
    let currentTotalSupply = totalSupply.reverted
      ? token.totalSupply
      : toDecimal(totalSupply.value, token.decimals);
    //If the totalSupply from contract call equals with the totalSupply stored in token entity, it means the burn event was process before.
    //It happens when the transfer function which transfers to GENESIS_ADDRESS emits both transfer event and burn event.
    if (currentTotalSupply == token.totalSupply) {
      return true;
    }
    token.totalSupply = token.totalSupply.minus(amount);
    token.burnCount = token.burnCount.plus(BIGINT_ONE);
    token.totalBurned = token.totalBurned.plus(amount);

    let dailySnapshot = getOrCreateTokenDailySnapshot(token, event.block);
    dailySnapshot.dailyTotalSupply = token.totalSupply;
    dailySnapshot.dailyEventCount += 1;
    dailySnapshot.dailyBurnCount += 1;
    dailySnapshot.dailyBurnAmount = dailySnapshot.dailyBurnAmount.plus(amount);
    dailySnapshot.blockNumber = event.block.number;
    dailySnapshot.timestamp = event.block.timestamp;

    let hourlySnapshot = getOrCreateTokenHourlySnapshot(token, event.block);
    hourlySnapshot.hourlyTotalSupply = token.totalSupply;
    hourlySnapshot.hourlyEventCount += 1;
    hourlySnapshot.hourlyBurnCount += 1;
    hourlySnapshot.hourlyBurnAmount = hourlySnapshot.hourlyBurnAmount.plus(
      amount
    );
    hourlySnapshot.blockNumber = event.block.number;
    hourlySnapshot.timestamp = event.block.timestamp;

    token.save();
    dailySnapshot.save();
    hourlySnapshot.save();
  }
  return false;
}

function handleMintEvent(
  token: Token | null,
  amount: BigDecimal,
  destination: Bytes,
  event: ethereum.Event
): boolean {
  // Track total token supply/minted
  if (token != null) {
    let totalSupply = ERC20.bind(event.address).try_totalSupply();
    let currentTotalSupply = totalSupply.reverted
      ? token.totalSupply
      : toDecimal(totalSupply.value, token.decimals);
    //If the totalSupply from contract call equals with the totalSupply stored in token entity, it means the mint event was process before.
    //It happens when the transfer function which transfers from GENESIS_ADDRESS emits both transfer event and mint event.
    if (currentTotalSupply == token.totalSupply) {
      return true;
    }
    token.totalSupply = token.totalSupply.plus(amount);

    token.mintCount = token.mintCount.plus(BIGINT_ONE);
    token.totalMinted = token.totalMinted.plus(amount);

    let dailySnapshot = getOrCreateTokenDailySnapshot(token, event.block);
    dailySnapshot.dailyTotalSupply = token.totalSupply;
    dailySnapshot.dailyEventCount += 1;
    dailySnapshot.dailyMintCount += 1;
    dailySnapshot.dailyMintAmount = dailySnapshot.dailyMintAmount.plus(amount);
    dailySnapshot.blockNumber = event.block.number;
    dailySnapshot.timestamp = event.block.timestamp;

    let hourlySnapshot = getOrCreateTokenHourlySnapshot(token, event.block);
    hourlySnapshot.hourlyTotalSupply = token.totalSupply;
    hourlySnapshot.hourlyEventCount += 1;
    hourlySnapshot.hourlyMintCount += 1;
    hourlySnapshot.hourlyMintAmount = hourlySnapshot.hourlyMintAmount.plus(
      amount
    );
    hourlySnapshot.blockNumber = event.block.number;
    hourlySnapshot.timestamp = event.block.timestamp;

    token.save();
    dailySnapshot.save();
    hourlySnapshot.save();
  }
  return false;
}

function handleTransferEvent(
  token: Token | null,
  amount: BigDecimal,
  source: Bytes,
  destination: Bytes,
  event: ethereum.Event
): TransferEvent {
  let transferEvent = new TransferEvent(
    event.address.toHex() +
      "-" +
      event.transaction.hash.toHex() +
      "-" +
      event.logIndex.toString()
  );
  transferEvent.hash = event.transaction.hash.toHex();
  transferEvent.logIndex = event.logIndex.toI32();
  transferEvent.token = event.address.toHex();
  transferEvent.nonce = event.transaction.nonce.toI32();
  transferEvent.amount = amount;
  transferEvent.to = destination.toHex();
  transferEvent.from = source.toHex();
  transferEvent.blockNumber = event.block.number;
  transferEvent.timestamp = event.block.timestamp;

  transferEvent.save();

  // Track total token transferred
  if (token != null) {
    let FromBalanceToZeroNum = BIGINT_ZERO;
    let balance = getOrCreateAccountBalance(getOrCreateAccount(source), token);
    if (balance.amount == amount) {
      // It means the sender's token balance will be 0 after transferal.
      FromBalanceToZeroNum = BIGINT_ONE;
    }

    let toAddressIsNewHolderNum = BIGINT_ZERO;
    let toBalanceIsZeroNum = BIGINT_ZERO;
    if (isNewAccount(destination)) {
      // It means the receiver is a new holder
      toAddressIsNewHolderNum = BIGINT_ONE;
    } else {
      balance = getOrCreateAccountBalance(
        getOrCreateAccount(destination),
        token
      );
      if (balance.amount == BIGDECIMAL_ZERO) {
        // It means the receiver's token balance is 0 before transferal.
        toBalanceIsZeroNum = BIGINT_ONE;
      }
    }

    token.currentHolderCount = token.currentHolderCount
      .minus(FromBalanceToZeroNum)
      .plus(toAddressIsNewHolderNum)
      .plus(toBalanceIsZeroNum);
    token.cumulativeHolderCount = token.cumulativeHolderCount.plus(
      toAddressIsNewHolderNum
    );
    token.transferCount = token.transferCount.plus(BIGINT_ONE);

    let dailySnapshot = getOrCreateTokenDailySnapshot(token, event.block);
    dailySnapshot.currentHolderCount = dailySnapshot.currentHolderCount
      .minus(FromBalanceToZeroNum)
      .plus(toAddressIsNewHolderNum)
      .plus(toBalanceIsZeroNum);
    dailySnapshot.cumulativeHolderCount = dailySnapshot.cumulativeHolderCount.plus(
      toAddressIsNewHolderNum
    );
    dailySnapshot.dailyEventCount += 1;
    dailySnapshot.dailyTransferCount += 1;
    dailySnapshot.dailyTransferAmount = dailySnapshot.dailyTransferAmount.plus(
      amount
    );
    dailySnapshot.blockNumber = event.block.number;
    dailySnapshot.timestamp = event.block.timestamp;

    let hourlySnapshot = getOrCreateTokenHourlySnapshot(token, event.block);
    hourlySnapshot.currentHolderCount = hourlySnapshot.currentHolderCount
      .minus(FromBalanceToZeroNum)
      .plus(toAddressIsNewHolderNum)
      .plus(toBalanceIsZeroNum);
    hourlySnapshot.cumulativeHolderCount = hourlySnapshot.cumulativeHolderCount.plus(
      toAddressIsNewHolderNum
    );
    hourlySnapshot.hourlyEventCount += 1;
    hourlySnapshot.hourlyTransferCount += 1;
    hourlySnapshot.hourlyTransferAmount = hourlySnapshot.hourlyTransferAmount.plus(
      amount
    );
    hourlySnapshot.blockNumber = event.block.number;
    hourlySnapshot.timestamp = event.block.timestamp;

    token.save();
    dailySnapshot.save();
    hourlySnapshot.save();
  }

  return transferEvent;
}

function getOrCreateTokenDailySnapshot(
  token: Token,
  block: ethereum.Block
): TokenDailySnapshot {
  let snapshotId =
    token.id + "-" + (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let previousSnapshot = TokenDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as TokenDailySnapshot;
  }

  let newSnapshot = new TokenDailySnapshot(snapshotId);
  newSnapshot.token = token.id;
  newSnapshot.dailyTotalSupply = token.totalSupply;
  newSnapshot.currentHolderCount = token.currentHolderCount;
  newSnapshot.cumulativeHolderCount = token.cumulativeHolderCount;
  newSnapshot.dailyEventCount = 0;
  newSnapshot.dailyTransferCount = 0;
  newSnapshot.dailyTransferAmount = BIGDECIMAL_ZERO;
  newSnapshot.dailyMintCount = 0;
  newSnapshot.dailyMintAmount = BIGDECIMAL_ZERO;
  newSnapshot.dailyBurnCount = 0;
  newSnapshot.dailyBurnAmount = BIGDECIMAL_ZERO;

  return newSnapshot;
}

function getOrCreateTokenHourlySnapshot(
  token: Token,
  block: ethereum.Block
): TokenHourlySnapshot {
  let snapshotId =
    token.id + "-" + (block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let previousSnapshot = TokenHourlySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as TokenHourlySnapshot;
  }

  let newSnapshot = new TokenHourlySnapshot(snapshotId);
  newSnapshot.token = token.id;

  newSnapshot.hourlyTotalSupply = token.totalSupply;
  newSnapshot.currentHolderCount = token.currentHolderCount;
  newSnapshot.cumulativeHolderCount = token.cumulativeHolderCount;
  newSnapshot.hourlyEventCount = 0;
  newSnapshot.hourlyTransferCount = 0;
  newSnapshot.hourlyTransferAmount = BIGDECIMAL_ZERO;
  newSnapshot.hourlyMintCount = 0;
  newSnapshot.hourlyMintAmount = BIGDECIMAL_ZERO;
  newSnapshot.hourlyBurnCount = 0;
  newSnapshot.hourlyBurnAmount = BIGDECIMAL_ZERO;

  return newSnapshot;
}
