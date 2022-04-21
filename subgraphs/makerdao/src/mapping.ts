import { BigInt,Address,Bytes,log, BigDecimal } from "@graphprotocol/graph-ts"
import { Vat, LogNote } from "../generated/Vat/Vat"
import { Borrow, Deposit, Liquidate, Market, Repay, Withdraw, _Ilk } from "../generated/schema"
import { DEFAULT_DECIMALS, MCD_VAT_ADDRESS, RAY, DAI, BIGINT_ZERO, RAD, BIGDECIMAL_ONE_HUNDRED, WAD, VOW_ADDRESS_TOPIC, POT_ADDRESS_TOPIC } from "./common/constants"
import { getMarket, getMarketFromIlk, getOrCreateLendingProtocol, getOrCreateToken } from "./common/getters"
import { createMarket } from "./common/setters"
import { bigIntToBigDecimal, bytesToSignedInt, absValBigInt, absValBigDecimal } from "./common/utils/numbers"
import { getOrCreateTokenPriceEntity } from "./common/prices/prices"
import { getOrCreateFinancials } from "./common/getters"
import { updateTVL,updateMarketMetrics, updateUsageMetrics } from "./common/metrics"
import { GemJoin } from "../generated/Vat/GemJoin"
import { createEntityID } from "./common/utils/strings"
import { GemJoin as GemJoinDataSource } from "../generated/templates"
import { LogNote as GemLogNote } from "../generated/templates/GemJoin/GemJoin"
import { bytesToUnsignedBigInt } from "./common/utils/numbers"

export function handleRely(event: LogNote): void {
  let marketAddress = Address.fromString(event.params.arg1.toHexString().substring(26))
  log.info('value = {}',[marketAddress.toHexString()])
  let gemCall = GemJoin.bind(marketAddress).try_ilk()
  log.info('gemCall = {}',[gemCall.reverted.toString()])
  if (!gemCall.reverted){
    GemJoinDataSource.create(marketAddress)
    createMarket(gemCall.value, marketAddress, event.block.number, event.block.timestamp)
  }
}

export function handleCage(event:GemLogNote): void {
  let market = getMarket(event.address.toHexString())
  market.isActive = false
  market.save()
}

export function handleEvent(event: LogNote, market: Market, eventType: string, amountCollateral: BigInt, amountCollateralUSD: BigDecimal, amountDAI: BigInt ): void {
  let protocol = getOrCreateLendingProtocol()
  if (eventType == "DEPOSIT"){
    let depositEvent = new Deposit("deposit-"+createEntityID(event))
    let borrowEvent = new Borrow("borrow-"+createEntityID(event))
    depositEvent.hash = event.transaction.hash.toHexString()
    depositEvent.logIndex = event.logIndex.toI32()
    depositEvent.protocol = protocol.id
    depositEvent.to = market.id
    depositEvent.from = event.transaction.from.toHexString()
    depositEvent.blockNumber = event.block.number
    depositEvent.timestamp = event.block.timestamp
    depositEvent.market = market.id
    depositEvent.asset = getOrCreateToken(Address.fromString(market.inputTokens[0])).id
    depositEvent.amount = absValBigInt(amountCollateral)
    depositEvent.amountUSD = absValBigDecimal(amountCollateralUSD)

    borrowEvent.hash = event.transaction.hash.toHexString()
    borrowEvent.logIndex = event.logIndex.toI32()
    borrowEvent.protocol = protocol.id
    borrowEvent.to = market.id
    borrowEvent.from = event.transaction.from.toHexString()
    borrowEvent.blockNumber = event.block.number
    borrowEvent.timestamp = event.block.timestamp
    borrowEvent.market = market.id
    borrowEvent.asset = DAI
    borrowEvent.amount = absValBigInt(amountDAI)
    borrowEvent.amountUSD = bigIntToBigDecimal(absValBigInt(amountDAI),DEFAULT_DECIMALS)

    depositEvent.save()
    borrowEvent.save()
  } else if (eventType == "WITHDRAW"){
      let withdrawEvent = new Withdraw("withdraw-"+createEntityID(event))
      let repayEvent = new Repay("repay-"+createEntityID(event))
      withdrawEvent.hash = event.transaction.hash.toHexString()
      withdrawEvent.logIndex = event.logIndex.toI32()
      withdrawEvent.protocol = protocol.id
      withdrawEvent.to = market.id
      withdrawEvent.from = event.transaction.from.toHexString()
      withdrawEvent.blockNumber = event.block.number
      withdrawEvent.timestamp = event.block.timestamp
      withdrawEvent.market = market.id
      withdrawEvent.asset = getOrCreateToken(Address.fromString(market.inputTokens[0])).id
      withdrawEvent.amount = absValBigInt(amountCollateral)
      withdrawEvent.amountUSD = absValBigDecimal(amountCollateralUSD)
    
      repayEvent.hash = event.transaction.hash.toHexString()
      repayEvent.logIndex = event.logIndex.toI32()
      repayEvent.protocol = protocol.id
      repayEvent.to = market.id
      repayEvent.from = event.transaction.from.toHexString()
      repayEvent.blockNumber = event.block.number
      repayEvent.timestamp = event.block.timestamp
      repayEvent.market = market.id
      repayEvent.asset = DAI
      repayEvent.amount = absValBigInt(amountDAI)
      repayEvent.amountUSD = bigIntToBigDecimal(absValBigInt(amountDAI),DEFAULT_DECIMALS)

      withdrawEvent.save()
      repayEvent.save()
  } else if (eventType == "LIQUIDATE"){
      let liquidateEvent = new Liquidate(createEntityID(event))
      liquidateEvent.hash = event.transaction.hash.toHexString()
      liquidateEvent.logIndex = event.logIndex.toI32()
      liquidateEvent.protocol = protocol.id
      liquidateEvent.to = market.id
      liquidateEvent.from = event.transaction.from.toHexString()
      liquidateEvent.blockNumber = event.block.number
      liquidateEvent.timestamp = event.block.timestamp
      liquidateEvent.market = market.id
      liquidateEvent.asset = getOrCreateToken(Address.fromString(market.inputTokens[0])).id
      liquidateEvent.amount = absValBigInt(amountCollateral)
      liquidateEvent.amountUSD = absValBigDecimal(amountCollateralUSD)
      liquidateEvent.profitUSD = bigIntToBigDecimal(absValBigInt(amountDAI),DEFAULT_DECIMALS).times(market.debtMultiplier).times(market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED))      
      liquidateEvent.save()
  }
}

// Create or modify a Vault
export function handleFrob(event: LogNote): void {
  let ilk = event.params.arg1
  let dink = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164))) // change in collateral
  let dart = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196))) // change in debt
  let market = getMarketFromIlk(ilk)
  let financialsDailySnapshot = getOrCreateFinancials(event)
  let collateralToken = getOrCreateToken(Address.fromString(market.inputTokens[0]))
  let collateralTokenUSD = getOrCreateTokenPriceEntity(collateralToken.id).priceUSD
  let inputTokenBalances = market.inputTokenBalances
  let inputTokenBalance = inputTokenBalances[0]
  let inputTokenBalancePost = inputTokenBalance.plus(dink)
  let ΔcollateralUSD = bigIntToBigDecimal(dink,collateralToken.decimals).times(collateralTokenUSD)
  market.inputTokenBalances = [inputTokenBalancePost]
  market.outputTokenSupply = market.outputTokenSupply.plus(dart)
  market.totalBorrowUSD = bigIntToBigDecimal(market.outputTokenSupply,DEFAULT_DECIMALS);
  market.totalDepositUSD = bigIntToBigDecimal(inputTokenBalancePost,collateralToken.decimals).times(collateralTokenUSD)
  market.totalValueLockedUSD = market.totalDepositUSD
  if (dart.gt(BIGINT_ZERO)){
    log.debug('dart',[dart.toString()])
    handleEvent(event, market, "DEPOSIT", dink, ΔcollateralUSD, dart)
  } else if (dart.lt(BIGINT_ZERO)){
    log.debug('dart',[dart.toString()])
    handleEvent(event, market, "WITHDRAW", dink, ΔcollateralUSD, dart)
  }
  market.save()
  financialsDailySnapshot.save()
  updateMarketMetrics(ilk,event)
  updateTVL(event)
}

// Liquidate a Vault
export function handleGrab(event: LogNote): void {
  let ilk = event.params.arg1
  let dink = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164)))
  let dart = bytesToSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196)))
  let market = getMarketFromIlk(ilk)
  let financialsDailySnapshot = getOrCreateFinancials(event)
  let protocol = getOrCreateLendingProtocol()
  let collateralToken = getOrCreateToken(Address.fromString(market.inputTokens[0]))
  let collateralTokenUSD = getOrCreateTokenPriceEntity(collateralToken.id).priceUSD
  let inputTokenBalances = market.inputTokenBalances
  let inputTokenBalance = inputTokenBalances[0]
  let inputTokenBalancePost = inputTokenBalance.plus(dink)
  let ΔcollateralUSD = bigIntToBigDecimal(dink,collateralToken.decimals).times(collateralTokenUSD)
  // liquidation profit = dart * rate * liq penalty
  let liquidationProfit = bigIntToBigDecimal(absValBigInt(dart),DEFAULT_DECIMALS).times(market.debtMultiplier).times(market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED))
  market.inputTokenBalances = [inputTokenBalancePost]
  market.outputTokenSupply = market.outputTokenSupply.plus(dart)
  market.totalBorrowUSD = bigIntToBigDecimal(market.outputTokenSupply,DEFAULT_DECIMALS).times(market.debtMultiplier)
  protocol.totalBorrowUSD = bigIntToBigDecimal(Vat.bind(Address.fromString(MCD_VAT_ADDRESS)).debt(),RAD) // Total debt is Art * rate (like on DAIStats)
  market.totalDepositUSD = bigIntToBigDecimal(inputTokenBalancePost,WAD).times(collateralTokenUSD)
  market.totalValueLockedUSD = market.totalDepositUSD
  financialsDailySnapshot.protocolSideRevenueUSD = financialsDailySnapshot.protocolSideRevenueUSD.plus(liquidationProfit)
  financialsDailySnapshot.totalRevenueUSD = financialsDailySnapshot.totalRevenueUSD.plus(liquidationProfit)
  market.save()
  protocol.save()
  financialsDailySnapshot.save()
  handleEvent(event, market, "LIQUIDATE", dink, ΔcollateralUSD, dart)
  updateMarketMetrics(ilk,event)
  updateTVL(event)
  updateUsageMetrics(event,event.transaction.from) // add liquidator
}

export function handleSuck(event: LogNote): void {
  if (event.params.arg1.toHexString().toLowerCase()==VOW_ADDRESS_TOPIC && event.params.arg2.toHexString().toLowerCase()==POT_ADDRESS_TOPIC){
    let FinancialsDailySnapshot = getOrCreateFinancials(event)
    let accumSavings = bigIntToBigDecimal(bytesToUnsignedBigInt(event.params.arg3),RAD)
    log.debug("supplySideRevenueUSD = {}",[accumSavings.toString()])
    FinancialsDailySnapshot.supplySideRevenueUSD = FinancialsDailySnapshot.supplySideRevenueUSD.plus(accumSavings)
    FinancialsDailySnapshot.save()
  }
}

export function handleFold(event: LogNote): void {
  let ilk = event.params.arg1
  let dRate = bigIntToBigDecimal(bytesToSignedInt(event.params.arg3),RAY)
  log.debug('dRate = {}',[dRate.toString()])
  let market = getMarketFromIlk(ilk)
  // stability fee collection, fold is called when someone calls jug.drip which increases debt balance for user
  let feesAccrued = dRate.times(market.totalBorrowUSD) // change in rate multiplied by total borrowed amt, compounded
  let financialsDailySnapshot = getOrCreateFinancials(event)
  financialsDailySnapshot.protocolSideRevenueUSD = financialsDailySnapshot.protocolSideRevenueUSD.plus(feesAccrued)
  financialsDailySnapshot.totalRevenueUSD = financialsDailySnapshot.totalRevenueUSD.plus(feesAccrued)
  financialsDailySnapshot.blockNumber = event.block.number
  financialsDailySnapshot.timestamp = event.block.timestamp
  market.debtMultiplier = market.debtMultiplier.plus(dRate)
  financialsDailySnapshot.save()
  market.save()
}