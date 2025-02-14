import {
  Transfer as TransferEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
  BalanceTransfer as BalanceTransferEvent,
  Initialized as InitializedEvent,
} from "../generated/dUSD-AToken/dUSD_AToken";
import {
  Token,
  Market,
  Account,
  AccountBalance,
  Transfer,
  Mint,
  Burn,
  Position,
  PositionUpdate,
} from "../generated/schema";
import { BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

function getOrCreateAccount(address: Bytes): Account {
  let account = Account.load(address);
  if (!account) {
    account = new Account(address);
    account.positionCount = BigInt.fromI32(0);
    account.save();
  }
  return account;
}

function getOrCreatePosition(
  account: Account,
  market: Market,
  event: ethereum.Event,
): Position {
  const index = account.positionCount;
  const id = account.id
    .toHexString()
    .concat("-")
    .concat(market.id.toHexString())
    .concat("-")
    .concat(index.toString());

  const position = new Position(id);
  position.account = account.id;
  position.market = market.id;
  position.balance = BigDecimal.fromString("0");
  position.timestampOpened = event.block.timestamp;
  position.blockNumberOpened = event.block.number;
  position.hashOpened = event.transaction.hash;
  position.lastUpdateTimestamp = event.block.timestamp;
  position.lastUpdateBlockNumber = event.block.number;
  position.lastUpdateHash = event.transaction.hash;
  position.closed = false;
  position.save();

  account.positionCount = account.positionCount.plus(BigInt.fromI32(1));
  account.save();

  return position;
}

function findActivePosition(account: Account, market: Market): Position | null {
  for (let i = account.positionCount.toI32() - 1; i >= 0; i--) {
    const id = account.id
      .toHexString()
      .concat("-")
      .concat(market.id.toHexString())
      .concat("-")
      .concat(i.toString());
    const position = Position.load(id);
    if (position && !position.closed) {
      return position;
    }
  }
  return null;
}

function createPositionUpdate(
  position: Position,
  amount: BigDecimal,
  type: string,
  source: string,
  event: ethereum.Event,
): void {
  const market = Market.load(position.market);
  if (!market) return;

  const token = Token.load(market.inputToken);
  if (!token) return;

  // Calculate USD amount using token price if available
  let amountUSD = BigDecimal.fromString("0");
  // Adjust amount for token decimals
  const decimals = token.decimals;
  const divisor = BigDecimal.fromString("1" + "0".repeat(decimals));
  amountUSD = amount.div(divisor);

  // Create a unique ID that includes all relevant information
  const id = position.id
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString())
    .concat("-")
    .concat(type)
    .concat("-")
    .concat(source);

  const update = new PositionUpdate(Bytes.fromUTF8(id));
  update.position = position.id;
  update.amount = amount;
  update.amountUSD = amountUSD;
  update.type = type;
  update.source = source;
  update.timestamp = event.block.timestamp;
  update.blockNumber = event.block.number;
  update.hash = event.transaction.hash;
  update.save();
}

function updatePosition(
  account: Account,
  market: Market,
  amount: BigDecimal,
  type: string,
  source: string,
  event: ethereum.Event,
): void {
  let position = findActivePosition(account, market);

  // If it's a deposit and there's no active position or the current position is closed, create a new one
  if (type == "DEPOSIT" && (position == null || position.closed)) {
    position = getOrCreatePosition(account, market, event);
  }

  if (position) {
    if (type == "DEPOSIT") {
      position.balance = position.balance.plus(amount);
    } else {
      position.balance = position.balance.minus(amount);
    }

    // Convert balance to USD for zero check (6 decimals)
    const balanceUSD = position.balance.div(BigDecimal.fromString("1000000"));

    // Check if balance is zero or very close to zero in USD terms
    const isZeroBalance =
      balanceUSD.equals(BigDecimal.fromString("0")) ||
      ((balanceUSD.gt(BigDecimal.fromString("-0.000001")) ||
        balanceUSD.equals(BigDecimal.fromString("-0.000001"))) &&
        balanceUSD.lt(BigDecimal.fromString("0.000001"))) ||
      balanceUSD.equals(BigDecimal.fromString("0.000001"));

    if (isZeroBalance) {
      position.balance = BigDecimal.fromString("0");
      position.closed = true;
      position.timestampClosed = event.block.timestamp;
      position.hashClosed = event.transaction.hash;
      position.blockNumberClosed = event.block.number;
    }

    position.lastUpdateTimestamp = event.block.timestamp;
    position.lastUpdateBlockNumber = event.block.number;
    position.lastUpdateHash = event.transaction.hash;
    position.save();

    createPositionUpdate(position, amount, type, source, event);
  }
}

function getOrCreateAccountBalance(
  account: Account,
  market: Market,
): AccountBalance {
  const id = account.id.concat(market.id);
  let balance = AccountBalance.load(id);
  if (!balance) {
    balance = new AccountBalance(id);
    balance.account = account.id;
    balance.market = market.id;
    balance.balance = BigDecimal.fromString("0");
    balance.lastUpdateTimestamp = BigInt.fromI32(0);
    balance.lastUpdateBlockNumber = BigInt.fromI32(0);
    balance.save();
  }
  return balance;
}

export function handleTransfer(event: TransferEvent): void {
  const market = Market.load(event.address);
  if (!market) return;

  const from = getOrCreateAccount(event.params.from);
  const to = getOrCreateAccount(event.params.to);

  const fromBalance = getOrCreateAccountBalance(from, market);
  const toBalance = getOrCreateAccountBalance(to, market);

  const amount = event.params.value.toBigDecimal();

  fromBalance.balance = fromBalance.balance.minus(amount);
  fromBalance.lastUpdateTimestamp = event.block.timestamp;
  fromBalance.lastUpdateBlockNumber = event.block.number;
  fromBalance.save();

  toBalance.balance = toBalance.balance.plus(amount);
  toBalance.lastUpdateTimestamp = event.block.timestamp;
  toBalance.lastUpdateBlockNumber = event.block.number;
  toBalance.save();

  // Only update positions for regular transfers (not mints/burns)
  const isFromZero = event.params.from.equals(
    Bytes.fromHexString("0x0000000000000000000000000000000000000000"),
  );
  const isToZero = event.params.to.equals(
    Bytes.fromHexString("0x0000000000000000000000000000000000000000"),
  );

  // If neither address is zero (meaning it's a regular transfer, not a mint/burn)
  if (!isFromZero && !isToZero) {
    updatePosition(from, market, amount, "WITHDRAWAL", "TRANSFER_OUT", event);
    updatePosition(to, market, amount, "DEPOSIT", "TRANSFER_IN", event);
  }

  const transfer = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  transfer.from = from.id;
  transfer.to = to.id;
  transfer.market = market.id;
  transfer.amount = amount;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();
}

export function handleMint(event: MintEvent): void {
  const market = Market.load(event.address);
  if (!market) return;

  const account = getOrCreateAccount(event.params.onBehalfOf);
  const balance = getOrCreateAccountBalance(account, market);

  const amount = event.params.value.toBigDecimal();
  balance.balance = balance.balance.plus(amount);
  balance.lastUpdateTimestamp = event.block.timestamp;
  balance.lastUpdateBlockNumber = event.block.number;
  balance.save();

  market.totalSupply = market.totalSupply.plus(amount);
  market.save();

  updatePosition(account, market, amount, "DEPOSIT", "MINT", event);

  const mint = new Mint(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  mint.account = account.id;
  mint.market = market.id;
  mint.amount = amount;
  mint.balanceIncrease = event.params.balanceIncrease.toBigDecimal();
  mint.index = event.params.index;
  mint.timestamp = event.block.timestamp;
  mint.blockNumber = event.block.number;
  mint.transactionHash = event.transaction.hash;
  mint.save();
}

export function handleBurn(event: BurnEvent): void {
  const market = Market.load(event.address);
  if (!market) return;

  const account = getOrCreateAccount(event.params.from);
  const target = getOrCreateAccount(event.params.target);
  const balance = getOrCreateAccountBalance(account, market);

  const amount = event.params.value.toBigDecimal();
  balance.balance = balance.balance.minus(amount);
  balance.lastUpdateTimestamp = event.block.timestamp;
  balance.lastUpdateBlockNumber = event.block.number;
  balance.save();

  market.totalSupply = market.totalSupply.minus(amount);
  market.save();

  updatePosition(account, market, amount, "WITHDRAWAL", "BURN", event);

  const burn = new Burn(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  burn.account = account.id;
  burn.target = target.id;
  burn.market = market.id;
  burn.amount = amount;
  burn.balanceIncrease = event.params.balanceIncrease.toBigDecimal();
  burn.index = event.params.index;
  burn.timestamp = event.block.timestamp;
  burn.blockNumber = event.block.number;
  burn.transactionHash = event.transaction.hash;
  burn.save();
}

export function handleBalanceTransfer(event: BalanceTransferEvent): void {
  const market = Market.load(event.address);
  if (!market) return;

  const from = getOrCreateAccount(event.params.from);
  const to = getOrCreateAccount(event.params.to);

  const fromBalance = getOrCreateAccountBalance(from, market);
  const toBalance = getOrCreateAccountBalance(to, market);

  const amount = event.params.value.toBigDecimal();

  fromBalance.balance = fromBalance.balance.minus(amount);
  fromBalance.lastUpdateTimestamp = event.block.timestamp;
  fromBalance.lastUpdateBlockNumber = event.block.number;
  fromBalance.save();

  toBalance.balance = toBalance.balance.plus(amount);
  toBalance.lastUpdateTimestamp = event.block.timestamp;
  toBalance.lastUpdateBlockNumber = event.block.number;
  toBalance.save();
}

export function handleInitialized(event: InitializedEvent): void {
  let market = Market.load(event.address);
  if (!market) {
    market = new Market(event.address);
    market.name = event.params.aTokenName;

    const token = new Token(event.params.underlyingAsset);
    token.name = event.params.aTokenName;
    token.symbol = event.params.aTokenSymbol;
    token.decimals = event.params.aTokenDecimals;
    token.save();

    market.token = token.id;
    market.inputToken = token.id;
    market.outputToken = token.id;
    market.totalSupply = BigDecimal.fromString("0");
    market.totalBorrowed = BigDecimal.fromString("0");
    market.exchangeRate = BigDecimal.fromString("1");
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    market.save();
  }
}
