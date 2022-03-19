import { BigInt, Address, Bytes, BigDecimal, bigInt, bigDecimal } from "@graphprotocol/graph-ts"
import { BenqiTokenqi } from "../generated/BenqiTokenqiAVAX/BenqiTokenqi"
import { Comptroller } from "../generated/BenqiTokenqiAVAX/Comptroller"
import { Oracle } from "../generated/BenqiTokenqiAVAX/Oracle"
import { User, Token, Market, Borrow, Repay, Deposit, Withdraw, Liquidation, UsageMetricsDailySnapshot, LendingProtocol, FinancialsDailySnapshot, MarketDailySnapshot, RewardToken } from "../generated/schema"
import { convertBINumToDesiredDecimals } from "./utils/converters"


export function handleAccrueInterest(
  qiTokenAddress: Address,
  accrueInterest: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
  comptrollerAddress: String,
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let protocolInterface = defineLendingProtocol()
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  financialsDailySnapshotEntity.supplySideRevenueUSD =
    bigDecimal.times(
      bigDecimal.times(
        bigDecimal.minus(
          bigDecimal.fromString("1"), convertBINumToDesiredDecimals(qiTokenContract.reserveFactorMantissa(), 18))
        , convertBINumToDesiredDecimals(accrueInterest, 18))
      , priceWithDecimal)
  financialsDailySnapshotEntity.protocolSideRevenueUSD =
    bigDecimal.times(
      bigDecimal.times(
        convertBINumToDesiredDecimals(qiTokenContract.reserveFactorMantissa(), 18)
        , convertBINumToDesiredDecimals(accrueInterest, 18))
      , priceWithDecimal)
  financialsDailySnapshotEntity.feesUSD =
    bigDecimal.times(
      bigDecimal.times(
        convertBINumToDesiredDecimals(qiTokenContract.reserveFactorMantissa(), 18)
        , convertBINumToDesiredDecimals(accrueInterest, 18))
      , priceWithDecimal)
  financialsDailySnapshotEntity.save()
}

export function handleborrowTransactions(
  transactionHash: Bytes,
  logIndex: BigInt,
  transactionTo: Address,
  transactionFrom: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
  qiTokenAddress: Address,
  amount: BigInt,
  comptrollerAddress: String,

): void {
  let protocolInterface = defineLendingProtocol()
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)


  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Borrow.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Borrow(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)


  financialsDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalValueLockedUSD.minus(amount.toBigDecimal())
  market.totalVolumeUSD.minus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
  marketDailySnapshotEntity.save()
  entity.hash = transactionHash.toString()
  entity.logIndex = logIndex.toI32()

  entity.protocol = protocolInterface.getString(protocolInterface.id)
  entity.to = transactionTo.toString()
  entity.from = transactionFrom.toString()
  entity.blockNumber = blockNumber
  entity.timestamp = timestamp

  entity.market = market.getString(market.id)

  let token = defineToken(qiTokenAddress)

  entity.asset = token.getString(token.id)
  entity.amount = convertBINumToDesiredDecimals(amount, 18)

  entity.amountUSD = bigDecimal.times(convertBINumToDesiredDecimals(amount, 18), priceWithDecimal)
  entity.save()
  updateInputTokensSupply(qiTokenAddress,market,comptrollerAddress,timestamp,blockNumber)
}
export function handlerepayTransactions(
  transactionHash: Bytes,
  logIndex: BigInt,
  transactionTo: Address,
  transactionFrom: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
  qiTokenAddress: Address,
  amount: BigInt,
  comptrollerAddress: String,

): void {

  let protocolInterface = defineLendingProtocol()
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Repay.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Repay(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)
  defineUser(transactionFrom, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD.plus(amount.toBigDecimal())
  market.totalValueLockedUSD.plus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  marketDailySnapshotEntity.save()
  
  entity.hash = transactionHash.toString()
  entity.logIndex = logIndex.toI32()

  // protocol done
  entity.protocol = protocolInterface.getString(protocolInterface.id)
  entity.to = transactionTo.toString()
  entity.from = transactionFrom.toString()
  entity.blockNumber = blockNumber
  entity.timestamp = timestamp


  entity.market = market.getString(market.id)

  let token = defineToken(qiTokenAddress)
  entity.asset = token.id
  entity.amount = convertBINumToDesiredDecimals(amount, 18)

  entity.amountUSD = bigDecimal.times(convertBINumToDesiredDecimals(amount, 18), priceWithDecimal)
  entity.save()
  updateInputTokensSupply(qiTokenAddress,market,comptrollerAddress,timestamp,blockNumber)
}

export function handleWithDrawTransactions(
  transactionHash: Bytes,
  logIndex: BigInt,
  transactionTo: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
  qiTokenAddress: Address,
  amount: BigInt,
  comptrollerAddress: String,

): void {

  let protocolInterface = defineLendingProtocol()
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Withdraw.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Withdraw(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD.minus(amount.toBigDecimal())
  market.totalValueLockedUSD.minus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
  marketDailySnapshotEntity.save()

  entity.hash = transactionHash.toString()
  entity.logIndex = logIndex.toI32()
  entity.protocol = protocolInterface.getString(protocolInterface.id)
  entity.to = transactionTo.toString()
  entity.blockNumber = blockNumber
  entity.timestamp = timestamp


  entity.market = market.id

  let token = defineToken(qiTokenAddress)
  entity.asset = token.id
  entity.amount = convertBINumToDesiredDecimals(amount, 18)

  entity.amountUSD = bigDecimal.times(convertBINumToDesiredDecimals(amount, 18), priceWithDecimal)
  entity.save()
  updateInputTokensSupply(qiTokenAddress,market,comptrollerAddress,timestamp,blockNumber)
}

export function handleDepositTransactions(
  transactionHash: Bytes,
  logIndex: BigInt,
  transactionTo: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
  qiTokenAddress: Address,
  amount: BigInt,
  comptrollerAddress: String,

): void {
  let protocolInterface = defineLendingProtocol()
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Deposit.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Deposit(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD.plus(amount.toBigDecimal())
  market.totalValueLockedUSD.plus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  marketDailySnapshotEntity.save()

  entity.hash = transactionHash.toString()
  entity.logIndex = logIndex.toI32()

  entity.protocol = protocolInterface.id
  entity.to = transactionTo.toString()
  entity.blockNumber = blockNumber
  entity.timestamp = timestamp


  entity.market = market.id

  let token = defineToken(qiTokenAddress)
  entity.asset = token.id
  entity.amount = convertBINumToDesiredDecimals(amount, 18)

  entity.amountUSD = bigDecimal.times(convertBINumToDesiredDecimals(amount, 18), priceWithDecimal)
  entity.save()
  updateInputTokensSupply(qiTokenAddress,market,comptrollerAddress,timestamp,blockNumber)
}

export function handleLiquidTransaction(
  transactionHash: Bytes,
  logIndex: BigInt,
  transactionTo: Address,
  transactionFrom: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
  qiTokenAddress: Address,
  amount: BigInt,
  seizeTokens: BigInt,
  repayAmount: BigInt,
  comptrollerAddress: String,
): void {
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let protocolInterface = defineLendingProtocol()
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  let entity = Liquidation.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Liquidation(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.liquidationPenalty = bigInt.dividedBy(bigInt.minus(seizeTokens, repayAmount), seizeTokens).toBigDecimal()
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)
  defineUser(transactionFrom, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD.plus(amount.toBigDecimal())
  market.totalValueLockedUSD.plus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  marketDailySnapshotEntity.save()
  entity.hash = transactionHash.toString()
  entity.logIndex = logIndex.toI32()
  entity.protocol = protocolInterface.getString(protocolInterface.id)
  entity.to = transactionTo.toString()
  entity.from = transactionFrom.toString()
  entity.blockNumber = blockNumber
  entity.timestamp = timestamp
  entity.market = market.id
  let token = defineToken(qiTokenAddress)

  entity.asset = token.id
  entity.amount = convertBINumToDesiredDecimals(amount, 18)

  entity.amountUSD = bigDecimal.times(convertBINumToDesiredDecimals(amount, 18), priceWithDecimal)
  entity.save()
  updateInputTokensSupply(qiTokenAddress,market,comptrollerAddress,timestamp,blockNumber)
}

export function handleDistributedReward(
  tokenType: number,
  qiTokenAddress: Address,
  comptrollerAddress: String,
  blockNumber: BigInt,
  timestamp: BigInt,
  rewardAmount: BigInt,
): void {
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress,timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  let MarketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress,timestamp,blockNumber,market, comptrollerAddress)
  MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType].plus(convertBINumToDesiredDecimals(rewardAmount, 18))
  let comptrollerContract = Comptroller.bind(Address.fromString(comptrollerAddress.toString()))
  let marketAddresses = comptrollerContract.getAllMarkets()
  let numberOfMarkets = marketAddresses.length
  if (tokenType == 0){
    for (let index = 0; index < numberOfMarkets; index++) {
      let addressOfMarket = marketAddresses[index]
      let token = defineToken(addressOfMarket)
      if (token.symbol == "qiQI") {
        priceWithDecimal = getPriceOfUnderlying(addressOfMarket, comptrollerAddress)
        MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType].plus(priceWithDecimal.times(convertBINumToDesiredDecimals(rewardAmount, 18)))
      } 
    }
  } else if(tokenType == 1) {
    for (let index = 0; index < numberOfMarkets; index++) {
      let addressOfMarket = marketAddresses[index]
      let token = defineToken(addressOfMarket)
      if (token.symbol == "qiAVAX") {
        priceWithDecimal = getPriceOfUnderlying(addressOfMarket, comptrollerAddress)
        MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType].plus(priceWithDecimal.times(convertBINumToDesiredDecimals(rewardAmount, 18)))
      }
    }

  }
  MarketDailySnapshotEntity.save()
}

export function handleMarketPaused(
  action: String,
  pauseState: boolean,
  qiTokenAddress: Address,
  comptrollerAddress: String,
  blockNumber: BigInt,
  timestamp: BigInt,
): void {
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  if (action = "Borrow") {
    market.canBorrowFrom = pauseState
  } else if (action = "Mint") {
    market.isActive = pauseState
  } else if (action = "Seize") {
    market.canUseAsCollateral = pauseState
  }
}

function defineMarketDailySnapshotEntity(
  qiTokenAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  market: Market,
  comptrollerAddress: String,
): MarketDailySnapshot {
  let protocolInterface = defineLendingProtocol()
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let MarketDailySnapshotEntity = MarketDailySnapshot.load(qiTokenAddress.toString().concat("-").concat(daysFromStart.toString()))
  if (MarketDailySnapshotEntity == null) {
    MarketDailySnapshotEntity = new MarketDailySnapshot(qiTokenAddress.toString().concat("-").concat(daysFromStart.toString()))
    MarketDailySnapshotEntity.protocol = protocolInterface.id
    MarketDailySnapshotEntity.market = market.id
    MarketDailySnapshotEntity.blockNumber = blockNumber
    MarketDailySnapshotEntity.timestamp = timestamp
    MarketDailySnapshotEntity.rewardTokenEmissionsAmount = [bigDecimal.fromString("0"),bigDecimal.fromString("0")]
    MarketDailySnapshotEntity.rewardTokenEmissionsUSD = [bigDecimal.fromString("0"),bigDecimal.fromString("0")]
  }

  MarketDailySnapshotEntity.outputTokenSupply = convertBINumToDesiredDecimals(qiTokenContract.totalSupply(), 18)
  MarketDailySnapshotEntity.outputTokenPriceUSD = priceWithDecimal
  MarketDailySnapshotEntity.depositRate = convertBINumToDesiredDecimals(qiTokenContract.supplyRatePerTimestamp(), 18)
  MarketDailySnapshotEntity.stableBorrowRate = convertBINumToDesiredDecimals(qiTokenContract.borrowRatePerTimestamp(), 18)
  MarketDailySnapshotEntity.variableBorrowRate = convertBINumToDesiredDecimals(qiTokenContract.borrowRatePerTimestamp(), 18)

  MarketDailySnapshotEntity.save()
  return MarketDailySnapshotEntity
}



function defineFinancialsDailySnapshotEntity(
  timestamp: BigInt,
  blockNumber: BigInt,
  protocolInterface: LendingProtocol,
): FinancialsDailySnapshot {

  let daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let FinancialsDailySnapshotEntity = FinancialsDailySnapshot.load(daysFromStart.toString())
  if (FinancialsDailySnapshotEntity == null) {
    FinancialsDailySnapshotEntity = new FinancialsDailySnapshot(daysFromStart.toString())
    FinancialsDailySnapshotEntity.timestamp = timestamp
    FinancialsDailySnapshotEntity.blockNumber = blockNumber
    FinancialsDailySnapshotEntity.protocol = protocolInterface.getString(protocolInterface.id)
  }

  FinancialsDailySnapshotEntity.save()
  return FinancialsDailySnapshotEntity
}



function defineUsageMetricsDailySnapshotEntity(
  timestamp: BigInt,
  blockNumber: BigInt,
  protocolInterface: LendingProtocol,
): UsageMetricsDailySnapshot {
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let UsageMetricsDailySnapshotEntity = UsageMetricsDailySnapshot.load(daysFromStart.toString())
  if (UsageMetricsDailySnapshotEntity == null) {
    UsageMetricsDailySnapshotEntity = new UsageMetricsDailySnapshot(daysFromStart.toString())
    UsageMetricsDailySnapshotEntity.timestamp = timestamp
    UsageMetricsDailySnapshotEntity.blockNumber = blockNumber
    UsageMetricsDailySnapshotEntity.protocol = protocolInterface.id
  }
  UsageMetricsDailySnapshotEntity.dailyTransactionCount = UsageMetricsDailySnapshotEntity.dailyTransactionCount + 1
  UsageMetricsDailySnapshotEntity.save()
  return UsageMetricsDailySnapshotEntity
}

function getPriceOfUnderlying(qiTokenAddress: Address, comptrollerAddress: String): BigDecimal {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerContract = Comptroller.bind(Address.fromString(comptrollerAddress.toString()))
  let oracleAddress = comptrollerContract.oracle()
  let oracleContract = Oracle.bind(Address.fromString(oracleAddress.toString()))
  let priceWithoutDecimal = oracleContract.getUnderlyingPrice(qiTokenAddress)
  let symbol = qiTokenContract.symbol()
  let priceWithDecimal: BigDecimal
  if (symbol == "qiBTC") {
    priceWithDecimal = convertBINumToDesiredDecimals(priceWithoutDecimal, 28)
  } else {
    priceWithDecimal = convertBINumToDesiredDecimals(priceWithoutDecimal, 18)
  }
  return priceWithDecimal
}

function defineToken(qiTokenAddress: Address): Token {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let token = Token.load(qiTokenAddress.toString())
  if (token == null) {
    token = new Token(qiTokenAddress.toString())
    token.decimals = qiTokenContract.decimals()
    token.name = qiTokenContract.name()
    token.symbol = qiTokenContract.symbol()
  }
  token.save()
  return token
}

function defineLendingProtocol(): LendingProtocol {
  let protocolInterface = LendingProtocol.load("0")
  if (protocolInterface == null) {
    protocolInterface = new LendingProtocol("0")
  }

  protocolInterface.name = "Benqi Finance"
  protocolInterface.slug = "Benqi"
  protocolInterface.network = "AVALANCHE"
  protocolInterface.type = "LENDING"
  protocolInterface.lendingType = "CDP"
  protocolInterface.save()

  return protocolInterface
}

function defineRewardToken(
  qiTokenAddress: Address,
  comptrollerAddress: String,
): RewardToken[] {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerContract = Comptroller.bind(Address.fromString(comptrollerAddress.toString()))
  let marketAddresses = comptrollerContract.getAllMarkets()
  let numberOfMarkets = marketAddresses.length
  let rewardTokenList: RewardToken[] = []
  for (let index = 0; index < numberOfMarkets; index++) {
    let addressOfMarket = marketAddresses[index]
    let token = defineToken(addressOfMarket)
    if (token.symbol == "qiQI") {
      let rewardToken = RewardToken.load(qiTokenAddress.toString())
      if (rewardToken == null) {
        rewardToken = new RewardToken(qiTokenAddress.toString())
        rewardToken.decimals = qiTokenContract.decimals()
        rewardToken.name = qiTokenContract.name()
        rewardToken.symbol = qiTokenContract.symbol()
        rewardToken.save()
      }
      rewardTokenList.push(rewardToken)
    }
  }
  for (let index = 0; index < numberOfMarkets; index++) {
    let addressOfMarket = marketAddresses[index]
    let token = defineToken(addressOfMarket)
    if (token.symbol == "qiAVAX ") {
      let rewardToken = RewardToken.load(qiTokenAddress.toString())
      if (rewardToken == null) {
        rewardToken = new RewardToken(qiTokenAddress.toString())
        rewardToken.decimals = qiTokenContract.decimals()
        rewardToken.name = qiTokenContract.name()
        rewardToken.symbol = qiTokenContract.symbol()
        rewardToken.save()
      }
      rewardTokenList.push(rewardToken)
    }
  }
  return rewardTokenList
}


function defineMarket(
  qiTokenAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  priceWithDecimal: BigDecimal,
  comptrollerAddress: String,
): Market {
  let protocolInterface = defineLendingProtocol()
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerContract = Comptroller.bind(Address.fromString(comptrollerAddress.toString()))

  let market = Market.load(qiTokenAddress.toString())
  if (market == null) {
    market = new Market(qiTokenAddress.toString())
    market.name = qiTokenContract.name()
    market.protocol = protocolInterface.getString(protocolInterface.id)
    market.createdTimestamp = timestamp
    market.createdBlockNumber = blockNumber
    market.rewardTokens = defineRewardToken(qiTokenAddress, comptrollerAddress).map<string>((t) => t.id)
  }

  let marketAddresses = comptrollerContract.getAllMarkets()
  let numberOfMarkets = marketAddresses.length
  market.inputTokenBalances = []
  market.inputTokens = []
  let inputTokens: Token[] = []
  for (let index = 0; index < numberOfMarkets; index++) {
    let addressOfMarket = marketAddresses[index]
    let token = defineToken(addressOfMarket)
    inputTokens.push(token)
    let inputTokenContract = BenqiTokenqi.bind(addressOfMarket)
    let inputTokenBalance = convertBINumToDesiredDecimals(inputTokenContract.totalSupply(), 18)
    market.inputTokenBalances.push(inputTokenBalance)
  }
  market.inputTokens = inputTokens.map<string>((t) => t.id)
  market.isActive = false

  let outputToken = defineToken(qiTokenAddress)
  market.outputToken = outputToken.getString(outputToken.id)

  market.outputTokenSupply = convertBINumToDesiredDecimals(qiTokenContract.totalSupply(), 18)
  market.outputTokenPriceUSD = priceWithDecimal
  market.canUseAsCollateral = true
  market.canBorrowFrom = true
  market.maximumLTV = bigInt.dividedByDecimal(qiTokenContract.totalBorrows(), qiTokenContract.totalSupply().toBigDecimal())
  market.depositRate = convertBINumToDesiredDecimals(qiTokenContract.supplyRatePerTimestamp(), 18)
  market.variableBorrowRate = convertBINumToDesiredDecimals(qiTokenContract.borrowRatePerTimestamp(), 18)
  market.liquidationThreshold = new BigDecimal(BigInt.fromI32(0))
  market.stableBorrowRate = new BigDecimal(BigInt.fromI32(0))

  market.save()
  return market
}

function defineUser(
  address: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  protocolInterface: LendingProtocol): void {
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let user = User.load(address.toString())
  let UsageMetricsDailySnapshot = defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  if (user == null) {
    user = new User(address.toString())
    user.lastDayActivity = daysFromStart
    UsageMetricsDailySnapshot.activeUsers = UsageMetricsDailySnapshot.activeUsers + 1
    UsageMetricsDailySnapshot.totalUniqueUsers = UsageMetricsDailySnapshot.totalUniqueUsers + 1
  } else if (user.lastDayActivity < daysFromStart) {
    UsageMetricsDailySnapshot.activeUsers = UsageMetricsDailySnapshot.activeUsers + 1
  }
  UsageMetricsDailySnapshot.save()
}

function updateInputTokensSupply(
  qiTokenAddress: Address,
  market: Market,
  comptrollerAddress: String,
  timestamp: BigInt,
  blockNumber: BigInt,
): void{
  let comptrollerContract = Comptroller.bind(Address.fromString(comptrollerAddress.toString()))
  let marketAddresses = comptrollerContract.getAllMarkets()
  let numberOfMarkets = marketAddresses.length
  for (let index = 0; index < numberOfMarkets; index++) {
    let tokenIndex = market.inputTokens.indexOf(marketAddresses[index].toString())
    let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
    let inputContract = BenqiTokenqi.bind(Address.fromString(marketAddresses[index].toString()))
    marketDailySnapshotEntity.inputTokenBalances[tokenIndex] = convertBINumToDesiredDecimals(inputContract.totalSupply(), 18)
    let priceWithDecimal = getPriceOfUnderlying(Address.fromString(marketAddresses[index].toString()), comptrollerAddress)
    marketDailySnapshotEntity.inputTokenPricesUSD[tokenIndex] = priceWithDecimal
    marketDailySnapshotEntity.save()
  }
}