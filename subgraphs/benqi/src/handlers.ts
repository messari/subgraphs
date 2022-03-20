import { 
  BigInt, 
  Address, 
  Bytes, 
  BigDecimal, 
  bigInt, 
  bigDecimal 
} from "@graphprotocol/graph-ts"
import { BenqiTokenqi } from "../generated/BenqiTokenqiAVAX/BenqiTokenqi"
import { Comptroller } from "../generated/BenqiTokenqiAVAX/Comptroller"
import { Oracle } from "../generated/BenqiTokenqiAVAX/Oracle"
import { 
  User, 
  Token, 
  Market, 
  Borrow, 
  Repay, 
  Deposit, 
  Withdraw, 
  Liquidation, 
  UsageMetricsDailySnapshot, 
  LendingProtocol, 
  FinancialsDailySnapshot, 
  MarketDailySnapshot, 
  RewardToken 
} from "../generated/schema"
import { convertBINumToDesiredDecimals } from "./utils/converters"


export function handleAccrueInterest(
  qiTokenAddress: Address,
  accrueInterest: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber,comptrollerAddress)
  
  if (qiTokenContract.try_reserveFactorMantissa().reverted) {
    financialsDailySnapshotEntity.supplySideRevenueUSD = bigDecimal.fromString("0")
  } else {
    financialsDailySnapshotEntity.supplySideRevenueUSD = 
    (bigDecimal.fromString("1")
    .minus(convertBINumToDesiredDecimals(qiTokenContract.reserveFactorMantissa(), 18)))
    .times(convertBINumToDesiredDecimals(accrueInterest, 18))
    .times(priceWithDecimal)
  }
  
  if (qiTokenContract.try_reserveFactorMantissa().reverted) {
    financialsDailySnapshotEntity.protocolSideRevenueUSD = bigDecimal.fromString("0")    
  } else {
    financialsDailySnapshotEntity.protocolSideRevenueUSD = 
      convertBINumToDesiredDecimals(qiTokenContract.reserveFactorMantissa(), 18)
      .times(convertBINumToDesiredDecimals(accrueInterest, 18))
      .times(priceWithDecimal)
  }

  if (qiTokenContract.try_reserveFactorMantissa().reverted) {
    financialsDailySnapshotEntity.feesUSD = bigDecimal.fromString("0")    
  } else {
    financialsDailySnapshotEntity.feesUSD = 
      convertBINumToDesiredDecimals(qiTokenContract.reserveFactorMantissa(), 18)
      .times(convertBINumToDesiredDecimals(accrueInterest, 18))
      .times(priceWithDecimal)
  }
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
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)


  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber,comptrollerAddress)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Borrow.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Borrow(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)


  financialsDailySnapshotEntity.totalValueLockedUSD = financialsDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD = financialsDailySnapshotEntity.totalVolumeUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalValueLockedUSD = market.totalValueLockedUSD.minus(amount.toBigDecimal())
  market.totalVolumeUSD = market.totalVolumeUSD.minus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD = marketDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
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

  entity.amountUSD = convertBINumToDesiredDecimals(amount, 18).times(priceWithDecimal)
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
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber,comptrollerAddress)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Repay.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Repay(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)
  defineUser(transactionFrom, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD = financialsDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD = financialsDailySnapshotEntity.totalVolumeUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amount.toBigDecimal())
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD = marketDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
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

  entity.amountUSD = convertBINumToDesiredDecimals(amount, 18).times(priceWithDecimal)
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
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber,comptrollerAddress)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Withdraw.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Withdraw(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD = financialsDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD = financialsDailySnapshotEntity.totalVolumeUSD.minus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD = market.totalVolumeUSD.minus(amount.toBigDecimal())
  market.totalValueLockedUSD = market.totalValueLockedUSD.minus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD = marketDailySnapshotEntity.totalValueLockedUSD.minus(amount.toBigDecimal())
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

  entity.amountUSD = convertBINumToDesiredDecimals(amount, 18).times(priceWithDecimal)
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
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  defineUsageMetricsDailySnapshotEntity(timestamp, blockNumber, protocolInterface)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber,comptrollerAddress)
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let entity = Deposit.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Deposit(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD = financialsDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD = financialsDailySnapshotEntity.totalVolumeUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amount.toBigDecimal())
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD = marketDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
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

  entity.amountUSD = convertBINumToDesiredDecimals(amount, 18).times(priceWithDecimal)
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
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
  let market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.save()

  let entity = Liquidation.load(transactionHash.toString().concat("-").concat(logIndex.toString()))
  if (entity == null) {
    entity = new Liquidation(transactionHash.toString().concat("-").concat(logIndex.toString()))
  }
  let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp, blockNumber,comptrollerAddress)
  market = defineMarket(qiTokenAddress, timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  market.liquidationPenalty = bigInt.dividedBy(bigInt.minus(seizeTokens, repayAmount), seizeTokens).toBigDecimal()
  defineUser(transactionTo, timestamp, blockNumber, protocolInterface)
  defineUser(transactionFrom, timestamp, blockNumber, protocolInterface)

  financialsDailySnapshotEntity.totalValueLockedUSD = financialsDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.totalVolumeUSD = financialsDailySnapshotEntity.totalVolumeUSD.plus(amount.toBigDecimal())
  financialsDailySnapshotEntity.save()
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amount.toBigDecimal())
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(amount.toBigDecimal())
  market.save()
  marketDailySnapshotEntity.totalValueLockedUSD = marketDailySnapshotEntity.totalValueLockedUSD.plus(amount.toBigDecimal())
  marketDailySnapshotEntity.save()
  entity.hash = transactionHash.toString()
  entity.logIndex = logIndex.toI32()
  entity.protocol = protocolInterface.id
  entity.to = transactionTo.toString()
  entity.from = transactionFrom.toString()
  entity.blockNumber = blockNumber
  entity.timestamp = timestamp
  entity.market = market.id
  let token = defineToken(qiTokenAddress)

  entity.asset = token.id
  entity.amount = convertBINumToDesiredDecimals(amount, 18)

  entity.amountUSD = convertBINumToDesiredDecimals(amount, 18).times(priceWithDecimal)
  entity.save()
  updateInputTokensSupply(qiTokenAddress,market,comptrollerAddress,timestamp,blockNumber)
}

export function handleDistributedReward(
  tokenType: number,
  qiTokenAddress: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
  rewardAmount: BigInt,
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
  let priceWithDecimal = getPriceOfUnderlying(qiTokenAddress, comptrollerAddress)
  let market = defineMarket(qiTokenAddress,timestamp, blockNumber, priceWithDecimal, comptrollerAddress)
  let MarketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress,timestamp,blockNumber,market, comptrollerAddress)
  MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType] = MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType].plus(convertBINumToDesiredDecimals(rewardAmount, 18))
  let comptrollerContract = Comptroller.bind(comptrollerAddress)
  if(comptrollerContract.try_getAllMarkets().reverted) {
    
  } else {
    let marketAddresses = comptrollerContract.getAllMarkets()
    let numberOfMarkets = marketAddresses.length
    if (tokenType == 0){
      for (let index = 0; index < numberOfMarkets; index++) {
        let addressOfMarket = marketAddresses[index]
        let token = defineToken(addressOfMarket)
        if (token.symbol == "qiQI") {
          priceWithDecimal = getPriceOfUnderlying(addressOfMarket, comptrollerAddress)
          MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType] = MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType].plus(priceWithDecimal.times(convertBINumToDesiredDecimals(rewardAmount, 18)))
        } 
      }
    } else if(tokenType == 1) {
      for (let index = 0; index < numberOfMarkets; index++) {
        let addressOfMarket = marketAddresses[index]
        let token = defineToken(addressOfMarket)
        if (token.symbol == "qiAVAX") {
          priceWithDecimal = getPriceOfUnderlying(addressOfMarket, comptrollerAddress)
          MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType] = MarketDailySnapshotEntity.rewardTokenEmissionsAmount[<i32>tokenType].plus(priceWithDecimal.times(convertBINumToDesiredDecimals(rewardAmount, 18)))
        }
      }
  
    }
  }
  MarketDailySnapshotEntity.save()
}

export function handleMarketPaused(
  action: String,
  pauseState: boolean,
  qiTokenAddress: Address,
  blockNumber: BigInt,
  timestamp: BigInt,
): void {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerAddress = qiTokenContract.comptroller()
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
  comptrollerAddress: Address,
): MarketDailySnapshot {
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
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

  if (qiTokenContract.try_totalSupply().reverted){
    MarketDailySnapshotEntity.outputTokenSupply = bigDecimal.fromString("0")
  } else {
    MarketDailySnapshotEntity.outputTokenSupply = convertBINumToDesiredDecimals(qiTokenContract.totalSupply(), 18)
  }
  MarketDailySnapshotEntity.outputTokenPriceUSD = priceWithDecimal
  if (qiTokenContract.try_supplyRatePerTimestamp().reverted){
    MarketDailySnapshotEntity.depositRate = bigDecimal.fromString("0")
  } else {
    MarketDailySnapshotEntity.depositRate = convertBINumToDesiredDecimals(qiTokenContract.supplyRatePerTimestamp(), 18)
  }
  if (qiTokenContract.try_borrowRatePerTimestamp().reverted){
    MarketDailySnapshotEntity.stableBorrowRate = bigDecimal.fromString("0")
  } else {
    MarketDailySnapshotEntity.stableBorrowRate = convertBINumToDesiredDecimals(qiTokenContract.borrowRatePerTimestamp(), 18)
  }
  if (qiTokenContract.try_borrowRatePerTimestamp().reverted){
    MarketDailySnapshotEntity.variableBorrowRate = bigDecimal.fromString("0")
  } else {
    MarketDailySnapshotEntity.variableBorrowRate = convertBINumToDesiredDecimals(qiTokenContract.borrowRatePerTimestamp(), 18)
  }
  MarketDailySnapshotEntity.save()
  return MarketDailySnapshotEntity
}



function defineFinancialsDailySnapshotEntity(
  timestamp: BigInt,
  blockNumber: BigInt,
  comptrollerAddress: Address,
): FinancialsDailySnapshot {
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
  let daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let FinancialsDailySnapshotEntity = FinancialsDailySnapshot.load(daysFromStart.toString())
  if (FinancialsDailySnapshotEntity == null) {
    FinancialsDailySnapshotEntity = new FinancialsDailySnapshot(daysFromStart.toString())
    FinancialsDailySnapshotEntity.timestamp = timestamp
    FinancialsDailySnapshotEntity.blockNumber = blockNumber
    FinancialsDailySnapshotEntity.protocol = protocolInterface.id
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

function getPriceOfUnderlying(qiTokenAddress: Address, comptrollerAddress: Address): BigDecimal {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerContract = Comptroller.bind(comptrollerAddress)
  let priceWithDecimal: BigDecimal = bigDecimal.fromString("0")
  if (comptrollerContract.try_oracle().reverted) {
    return priceWithDecimal
  } else {
    let oracleAddress = comptrollerContract.oracle()
    let oracleContract = Oracle.bind(oracleAddress)
    let priceWithoutDecimal = oracleContract.getUnderlyingPrice(qiTokenAddress)
    if (qiTokenContract.try_symbol().reverted) {
      return priceWithDecimal
    } else {
      let symbol = qiTokenContract.symbol()
      if (symbol == "qiBTC") {
        priceWithDecimal = convertBINumToDesiredDecimals(priceWithoutDecimal, 28)
      } else {
        priceWithDecimal = convertBINumToDesiredDecimals(priceWithoutDecimal, 18)
      }
      return priceWithDecimal
    }
  }
}

function defineToken(qiTokenAddress: Address): Token {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let token = Token.load(qiTokenAddress.toString())
  if (token == null) {
    token = new Token(qiTokenAddress.toString())
    if (qiTokenContract.try_decimals().reverted) {
      token.decimals = 0
    } else {
      token.decimals = qiTokenContract.decimals()
    }
    if (qiTokenContract.try_name().reverted) {
      token.name = ""
    } else {
      token.name = qiTokenContract.name()
    }
    if (qiTokenContract.try_symbol().reverted) {
      token.symbol = ""
    } else {
      token.symbol = qiTokenContract.symbol()
    }
  }
  token.save()
  return token
}

function defineLendingProtocol(comptrollerAddress: Address): LendingProtocol {
  let protocolInterface = LendingProtocol.load(comptrollerAddress.toString())
  if (protocolInterface == null) {
    protocolInterface = new LendingProtocol(comptrollerAddress.toString())
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
  comptrollerAddress: Address,
): RewardToken[] {
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerContract = Comptroller.bind(comptrollerAddress)
  let rewardTokenList: RewardToken[] = []
  if (comptrollerContract.try_getAllMarkets().reverted){

  } else {
    let marketAddresses = comptrollerContract.getAllMarkets()
    let numberOfMarkets = marketAddresses.length
    for (let index = 0; index < numberOfMarkets; index++) {
      let addressOfMarket = marketAddresses[index]
      let token = defineToken(addressOfMarket)
      if (token.symbol == "qiQI") {
        let rewardToken = RewardToken.load(qiTokenAddress.toString())
        if (rewardToken == null) {
          rewardToken = new RewardToken(qiTokenAddress.toString())
          if (qiTokenContract.try_decimals().reverted) {
            rewardToken.decimals = 0
          } else {
            rewardToken.decimals = qiTokenContract.decimals()
          }
          if (qiTokenContract.try_name().reverted) {
            rewardToken.name = ""
          } else {
            rewardToken.name = qiTokenContract.name()
          }
          if (qiTokenContract.try_symbol().reverted) {
            rewardToken.symbol = ""
          } else {
            rewardToken.symbol = qiTokenContract.symbol()
          }
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
          if (qiTokenContract.try_decimals().reverted) {
            rewardToken.decimals = 0
          } else {
            rewardToken.decimals = qiTokenContract.decimals()
          }
          if (qiTokenContract.try_name().reverted) {
            rewardToken.name = ""
          } else {
            rewardToken.name = qiTokenContract.name()
          }
          if (qiTokenContract.try_symbol().reverted) {
            rewardToken.symbol = ""
          } else {
            rewardToken.symbol = qiTokenContract.symbol()
          }
          rewardToken.save()
        }
        rewardTokenList.push(rewardToken)
      }
    }
  }
  return rewardTokenList
}


function defineMarket(
  qiTokenAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  priceWithDecimal: BigDecimal,
  comptrollerAddress: Address,
): Market {
  let protocolInterface = defineLendingProtocol(comptrollerAddress)
  let qiTokenContract = BenqiTokenqi.bind(qiTokenAddress)
  let comptrollerContract = Comptroller.bind(comptrollerAddress)

  let market = Market.load(qiTokenAddress.toString())
  if (market == null) {
    market = new Market(qiTokenAddress.toString())
    if (qiTokenContract.try_name().reverted) {
      market.name = null
    } else {
      market.name = qiTokenContract.name()
    }
    market.protocol = protocolInterface.id
    market.createdTimestamp = timestamp
    market.createdBlockNumber = blockNumber
    market.rewardTokens = defineRewardToken(qiTokenAddress, comptrollerAddress).map<string>((t) => t.id)
  }

  if (comptrollerContract.try_getAllMarkets().reverted) {
  } else {
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
      let inputTokenBalance: BigDecimal = bigDecimal.fromString("0")
      if(inputTokenContract.try_totalSupply().reverted){
        
      } else {
        inputTokenBalance = convertBINumToDesiredDecimals(inputTokenContract.totalSupply(), 18)
      }
      market.inputTokenBalances.push(inputTokenBalance)
    }
    market.inputTokens = inputTokens.map<string>((t) => t.id)
  }

  market.isActive = false

  let outputToken = defineToken(qiTokenAddress)
  market.outputToken = outputToken.id

  if (qiTokenContract.try_totalSupply().reverted) {
    market.outputTokenSupply = bigDecimal.fromString("0")
  } else {
    market.outputTokenSupply = convertBINumToDesiredDecimals(qiTokenContract.totalSupply(), 18)
  }
  market.outputTokenPriceUSD = priceWithDecimal
  market.canUseAsCollateral = true
  market.canBorrowFrom = true
  
  if (qiTokenContract.try_totalBorrows().reverted || qiTokenContract.try_totalSupply().reverted) {
    market.maximumLTV = bigDecimal.fromString("0")
  } else {
    market.maximumLTV = qiTokenContract.totalBorrows().divDecimal(qiTokenContract.totalSupply().toBigDecimal())
  }

  if (qiTokenContract.try_supplyRatePerTimestamp().reverted) {
    market.depositRate = bigDecimal.fromString("0")
  } else {
    market.depositRate = convertBINumToDesiredDecimals(qiTokenContract.supplyRatePerTimestamp(), 18)
  }

  if (qiTokenContract.try_borrowRatePerTimestamp().reverted) {
    market.variableBorrowRate = bigDecimal.fromString("0")
  } else {
    market.variableBorrowRate = convertBINumToDesiredDecimals(qiTokenContract.borrowRatePerTimestamp(), 18)
  }
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
  comptrollerAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
): void{
  let comptrollerContract = Comptroller.bind(comptrollerAddress)
  if (comptrollerContract.try_getAllMarkets().reverted) {
    
  } else {
    let marketAddresses = comptrollerContract.getAllMarkets()
    let numberOfMarkets = marketAddresses.length
    for (let index = 0; index < numberOfMarkets; index++) {
      let tokenIndex = market.inputTokens.indexOf(marketAddresses[index].toString())
      let marketDailySnapshotEntity = defineMarketDailySnapshotEntity(qiTokenAddress, timestamp, blockNumber, market, comptrollerAddress)
      let inputContract = BenqiTokenqi.bind(marketAddresses[index])
      marketDailySnapshotEntity.inputTokenBalances[tokenIndex] = convertBINumToDesiredDecimals(inputContract.totalSupply(), 18)
      let priceWithDecimal = getPriceOfUnderlying(marketAddresses[index], comptrollerAddress)
      marketDailySnapshotEntity.inputTokenPricesUSD[tokenIndex] = priceWithDecimal
      marketDailySnapshotEntity.save()
    }
  }
}