import { BigInt, Address, Bytes, ByteArray, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/Vat/ERC20";
import { GemJoin } from "../generated/Vat/GemJoin";
import { Vat, LogNote as VatNoteEvent } from "../generated/Vat/Vat";
import { CatV1, Bite as BiteEvent, LogNote as CatNoteEvent } from "../generated/CatV1/CatV1";
import { Dog, Bark as BarkEvent, File2 as DogFileChopEvent } from "../generated/Dog/Dog";
import { Flip, Clip } from "../generated/templates";
import { LogNote as FlipNoteEvent, Flip as FlipContract } from "../generated/templates/Flip/Flip";
import { Take as TakeEvent, Clip as ClipContract } from "../generated/templates/Clip/Clip";
import { Spot, Poke as PokeEvent, LogNote as SpotNoteEvent } from "../generated/Spot/Spot";
import { Jug, LogNote as JugNoteEvent } from "../generated/Jug/Jug";
import { Pot, LogNote as PotNoteEvent } from "../generated/Pot/Pot";
import { CdpManager, NewCdp } from "../generated/CdpManager/CdpManager";
import { Created } from "../generated/DSProxyFactory/DSProxyFactory";
import { Token, _Ilk, Liquidate, _LiquidateStore, _Chi, _Urn, _Proxy } from "../generated/schema";
import {
  bigIntToBDUseDecimals,
  bigDecimalExponential,
  powerBigDecimal,
  BigDecimalTruncateToBigInt,
  bigIntChangeDecimals,
} from "./utils/numbers";
import {
  getOrCreateChi,
  getOrCreateInterestRate,
  getOwnerAddressFromCdp,
  getOwnerAddressFromProxy,
} from "./common/getters";
import {
  bytes32ToAddress,
  extractCallData,
  bytesToUnsignedBigInt,
  bytesToSignedBigInt,
  bytes32ToAddressHexString,
} from "./utils/bytes";
import {
  WAD,
  RAY,
  RAD,
  BIGINT_ONE,
  ILK_SAI,
  ZERO_ADDRESS,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ONE_HUNDRED,
  InterestRateSide,
  InterestRateType,
  SECONDS_PER_YEAR_BIGDECIMAL,
  VOW_ADDRESS,
  DAI_ADDRESS,
  BIGINT_ONE_RAY,
  BIGDECIMAL_ONE_RAY,
  BIGDECIMAL_ONE_WAD,
} from "./common/constants";
import {
  updateMarketSnapshot,
  updateUsageMetrics,
  updateFinancialsSnapshot,
  updateProtocol,
  handleTransactions,
  updatePriceForMarket,
  updateRevenue,
  updateMarket,
} from "./common/update";
import {
  getOrCreateMarket,
  getOrCreateIlk,
  getOrCreateToken,
  getOrCreateLendingProtocol,
  getMarketFromIlk,
  getMarketAddressFromIlk,
  getOrCreateLiquidateStore,
  getOrCreateLiquidate,
} from "./common/getters";

// Authorizating Vat (CDP engine)
export function handleVatRely(event: VatNoteEvent): void {
  let someAddress = bytes32ToAddress(event.params.arg1);
  log.debug("[handleVatRely]Input address = {}", [someAddress.toHexString()]);

  // We don't know whether the address passed in is a valid 'market' (gemjoin) address
  let marketContract = GemJoin.bind(someAddress);
  let ilkCall = marketContract.try_ilk(); // collateral type
  let gemCall = marketContract.try_gem(); // get market collateral token, referred to as 'gem'
  if (ilkCall.reverted || gemCall.reverted) {
    log.debug("[handleVatRely]Address {} is not a market", [someAddress.toHexString()]);
    log.debug("[handleVatRely]ilkCall.revert = {} gemCall.reverted = {} at tx hash {}", [
      ilkCall.reverted.toString(),
      gemCall.reverted.toString(),
      event.transaction.hash.toHexString(),
    ]);

    return;
  }
  let ilk = ilkCall.value;
  let marketID = someAddress.toHexString();

  let tokenId = gemCall.value.toHexString();
  let tokenName = "unknown";
  let tokenSymbol = "unknown";
  let decimals = 18;
  let erc20Contract = ERC20.bind(gemCall.value);
  let tokenNameCall = erc20Contract.try_name();
  if (tokenNameCall.reverted) {
    log.warning("[handleVatRely]Failed to get name for token {}", [tokenId]);
  } else {
    tokenName = tokenNameCall.value;
  }
  let tokenSymbolCall = erc20Contract.try_symbol();
  if (tokenSymbolCall.reverted) {
    log.warning("[handleVatRely]Failed to get symbol for token {}", [tokenId]);
  } else {
    tokenSymbol = tokenSymbolCall.value;
  }
  let tokenDecimalsCall = erc20Contract.try_decimals();
  if (tokenDecimalsCall.reverted) {
    log.warning("[handleVatRely]Failed to get decimals for token {}", [tokenId]);
  } else {
    decimals = tokenDecimalsCall.value;
  }

  if (ilk.equals(Bytes.fromHexString(ILK_SAI))) {
    // https://etherscan.io/address/0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359#readContract
    tokenName = "Dai Stablecoin v1.0";
    tokenSymbol = "SAI";
    decimals = 18;
  }

  log.info("[handleVatRely]ilk = {}/{}, market = {}, token = {}, name = {}, symbol = {}, decimals = {}", [
    ilk.toString(),
    ilk.toHexString(),
    marketID, //join (market address)
    tokenId, //gem (token address)
    tokenName,
    tokenSymbol,
    decimals.toString(),
  ]);

  getOrCreateMarket(marketID, ilk.toString(), tokenId, event.block.number, event.block.timestamp);
  getOrCreateIlk(ilk, marketID);
  getOrCreateToken(tokenId, tokenName, tokenSymbol, decimals as i32);
  // for protocol.mintedTokens
  getOrCreateToken(DAI_ADDRESS, "Dai Stablecoin", "DAI", 18);

  let protocol = getOrCreateLendingProtocol();
  protocol.totalPoolCount += 1;
  protocol.marketIDList.push(marketID);
  protocol.save();
}

export function handleVatCage(event: VatNoteEvent): void {
  let protocol = getOrCreateLendingProtocol();
  // Vat.cage pauses all markets
  for (let i: i32 = 0; i < protocol.marketIDList.length; i++) {
    let market = getOrCreateMarket(protocol.marketIDList[i]);
    market.isActive = false;
    market.canBorrowFrom = false;
    market.save();
  }
}

// Deposit/Withdraw/Borrow/Repay
export function handleVatFrob(event: VatNoteEvent): void {
  let ilk = event.params.arg1;
  bytes32ToAddressHexString;
  let u = bytes32ToAddressHexString(event.params.arg2);
  let v = bytes32ToAddressHexString(event.params.arg3);
  // frob(bytes32 i, address u, address v, address w, int256 dink, int256 dart) call
  // 4th arg w: start = 4 (signature) + 3 * 32, end = start + 32
  let w = bytes32ToAddressHexString(extractCallData(event.params.data, 100, 132));
  // 5th arg dink: start = 4 (signature) + 4 * 32, end = start + 32
  let dink = bytesToSignedBigInt(extractCallData(event.params.data, 132, 164)); // change to collateral
  // 6th arg dart: start = 4 (signature) + 4 * 32, end = start + 32
  let dart = bytesToSignedBigInt(extractCallData(event.params.data, 164, 196)); // change to debt

  let market = getMarketFromIlk(ilk);
  if (market == null) {
    log.warning("[handleVatFrob]Failed to get market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
    return;
  }

  // translate possible UrnHandler address to its owner address
  u = getOwnerAddressFromCdp(u);
  v = getOwnerAddressFromCdp(v);
  w = getOwnerAddressFromCdp(w);

  // translate possible DSProxy address to its owner address
  u = getOwnerAddressFromProxy(u);
  v = getOwnerAddressFromProxy(v);
  w = getOwnerAddressFromProxy(w);

  let token = getOrCreateToken(market.inputToken);
  market.inputTokenPriceUSD = token.lastPriceUSD!;
  // convert to token's native amount from WAD
  let deltaCollateral = bigIntChangeDecimals(dink, WAD, token.decimals);
  let deltaCollateralUSD = bigIntToBDUseDecimals(dink, WAD).times(market.inputTokenPriceUSD);
  let deltaDebtUSD = bigIntToBDUseDecimals(dart, WAD); //in DAI

  market.inputTokenBalance = market.inputTokenBalance.plus(deltaCollateral);
  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(deltaDebtUSD);

  // here we "mark-to-market" - re-price total collateral using last price
  market.totalDepositBalanceUSD = bigIntToBDUseDecimals(market.inputTokenBalance, token.decimals).times(
    market.inputTokenPriceUSD,
  );
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  log.info(
    "[handleVatFrob]block#={}, ilk={}, market={}, u={}, v={}, w={}, dink={}, dart={}," +
      "inputTokenBal={}, inputTokenPrice={}, totalBorrowUSD={}",
    [
      event.block.number.toString(),
      ilk.toString(),
      market.id,
      u,
      v,
      w,
      dink.toString(),
      dart.toString(),
      market.inputTokenBalance.toString(),
      market.inputTokenPriceUSD.toString(),
      market.totalBorrowBalanceUSD.toString(),
    ],
  );
  market.save();

  handleTransactions(
    event,
    market.id,
    u,
    v,
    w,
    market.inputToken,
    deltaCollateral,
    deltaCollateralUSD,
    dart,
    deltaDebtUSD,
  );
  updateMarket(market.id, deltaCollateralUSD, deltaDebtUSD);
  updateMarketSnapshot(market, event, deltaCollateralUSD, deltaDebtUSD);
  updateUsageMetrics(event, [u, v, w], deltaCollateralUSD, deltaDebtUSD);
  updateProtocol(deltaCollateralUSD, deltaDebtUSD);
  //this needs to after updateProtocol as it uses protocol to do the update
  updateFinancialsSnapshot(event, deltaCollateralUSD, deltaDebtUSD);
}

// update total revenue (stability fee)
export function handleVatFold(event: VatNoteEvent): void {
  let ilk = event.params.arg1;
  let vow = bytes32ToAddress(event.params.arg2).toHexString();
  let rate = bytesToSignedBigInt(event.params.arg3);
  let vatContract = Vat.bind(event.address);
  let ilkOnChain = vatContract.ilks(ilk);
  let revenue = ilkOnChain.getArt().times(rate);
  let newTotalRevenueUSD = bigIntToBDUseDecimals(revenue, RAD);
  if (vow.toLowerCase() != VOW_ADDRESS.toLowerCase()) {
    log.warning("[handleVatFold]Stability fee unexpectedly credited to a non-Vow address {}", [vow]);
  }
  let marketAddress = getMarketAddressFromIlk(ilk);
  if (marketAddress) {
    let marketID = marketAddress.toHexString();
    log.info("[handleVatFold]total revenue accrued from Market {}/{} = ${}", [
      ilk.toString(),
      marketID,
      newTotalRevenueUSD.toString(),
    ]);
    updateRevenue(event, marketID, newTotalRevenueUSD, BIGDECIMAL_ZERO);
  } else {
    log.warning("[handleVatFold]Failed to find marketID for ilk {}/{}; revenue of ${} is ignored.", [
      ilk.toString(),
      ilk.toHexString(),
      newTotalRevenueUSD.toString(),
    ]);
  }
}

export function handleVatDebtSettlement(event: VatNoteEvent): void {
  // settle or issue unbacked debt (e.g. credit dai saving interest)
  // update totalBorrowBalanceUSD when event emitted
  // protocol wide, not market specific, so protocol level number totalBorrowBalanceUSD may be
  // higher than sum across markets
  // Turn this on if it is neccessary to include those debts
  /*
  let protocol = getOrCreateLendingProtocol();
  let vatContract = Vat.bind(event.address);
  let debtCall = vatContract.try_debt();
  if (debtCall.reverted) {
    log.warning("[handleVatDebtSettlement]Failed to call Vat.debt; not updating protocol.totalBorrowBalanceUSD", []);
  } else {
    protocol.totalBorrowBalanceUSD = bigIntToBDUseDecimals(debtCall.value, RAD);
  }
  protocol.save();
  */
}

// old liquidation
export function handleCatBite(event: BiteEvent): void {
  let ilk = event.params.ilk; //market
  let urn = event.params.urn; //liquidatee
  let flip = event.params.flip; //auction contract
  let id = event.params.id; //auction id
  let lot = event.params.ink;
  let art = event.params.art;
  let tab = event.params.tab;

  let market = getMarketFromIlk(ilk);
  let LiquidateID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toString());
  getOrCreateLiquidate(LiquidateID, event, market, urn.toHexString());

  let liquidationRevenueUSD = bigIntToBDUseDecimals(tab, RAD).times(
    market!.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED),
  );

  updateRevenue(event, market!.id, liquidationRevenueUSD, BIGDECIMAL_ZERO);
  log.info("[handleCatBite] ilk={}, urn={}, lot={}, art={}, tab={}, liquidation revenue=${}", [
    ilk.toString(),
    urn.toHexString(),
    lot.toString(),
    art.toString(),
    tab.toString(),
    liquidationRevenueUSD.toString(),
  ]);

  let storeID = ilk
    .toHexString()
    .concat("-")
    .concat(id.toString());
  getOrCreateLiquidateStore(storeID, LiquidateID);
  // auction
  Flip.create(flip);
}

// Update liquidate penalty for the Cat contract
// Works for both Cat V1 and V2
export function handleCatFile(event: CatNoteEvent): void {
  let ilk = event.params.arg1;
  let what = event.params.arg2.toString();
  // 3rd arg: start = 4 + 2 * 32, end = start + 32
  let chop = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));

  if (what == "chop") {
    let market = getMarketFromIlk(ilk);
    if (market == null) {
      log.warning("[handleFileDog]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }
    let liquidationPenalty = bigIntToBDUseDecimals(chop, RAY)
      .minus(BIGDECIMAL_ONE)
      .times(BIGDECIMAL_ONE_HUNDRED);
    if (liquidationPenalty.gt(BIGDECIMAL_ZERO)) {
      market.liquidationPenalty = liquidationPenalty;
      market.save();
    }

    log.info("[handleCatFile]ilk={}, chop={}, liquidationPenalty={}", [
      ilk.toString(),
      chop.toString(),
      market.liquidationPenalty.toString(),
    ]);
  }
}

// New liquidation
export function handleDogBark(event: BarkEvent): void {
  let ilk = event.params.ilk; //market
  let urn = event.params.urn; //liquidatee
  let clip = event.params.clip; //auction contract
  let id = event.params.id; //auction id
  let lot = event.params.ink;
  let art = event.params.art;
  let due = event.params.due;

  let market = getMarketFromIlk(ilk);
  let LiquidateID = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toString());
  getOrCreateLiquidate(LiquidateID, event, market, urn.toHexString());

  let liquidationRevenueUSD = bigIntToBDUseDecimals(due, RAD).times(
    market!.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED),
  );

  updateRevenue(event, market!.id, liquidationRevenueUSD, BIGDECIMAL_ZERO);

  log.info("[handleDogBark] ilk={}, urn={}, lot={}, art={}, due={}, liquidation revenue=${}", [
    ilk.toString(),
    urn.toHexString(),
    lot.toString(),
    art.toString(),
    due.toString(),
    liquidationRevenueUSD.toString(),
  ]);

  let storeID = ilk
    .toHexString()
    .concat("-")
    .concat(id.toString());
  getOrCreateLiquidateStore(storeID, LiquidateID);
  Clip.create(clip);
}

// Update liquidate penalty for the Dog contract
export function handleDogFile(event: DogFileChopEvent): void {
  let ilk = event.params.ilk;
  let what = event.params.what.toString();
  if (what == "chop") {
    let market = getMarketFromIlk(ilk);
    if (market == null) {
      log.warning("[handleFileDog]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }
    let chop = event.params.data;
    let liquidationPenalty = bigIntToBDUseDecimals(chop, RAY)
      .minus(BIGDECIMAL_ONE)
      .times(BIGDECIMAL_ONE_HUNDRED);
    if (liquidationPenalty.gt(BIGDECIMAL_ZERO)) {
      market.liquidationPenalty = liquidationPenalty;
      market.save();
    }

    log.info("[handleCatFile]ilk={}, chop={}, liquidationPenalty={}", [
      ilk.toString(),
      chop.toString(),
      market.liquidationPenalty.toString(),
    ]);
  }
}

// Auction of collateral used by Cat (liquidation)
export function handleFlipBids(event: FlipNoteEvent): void {
  let id = bytesToUnsignedBigInt(event.params.arg1); //
  //let lot = bytesToUnsignedBigInt(event.params.arg2); // uint256 lot
  // 3rd arg start = 4 + 2 * 32, end = start+32
  //let bid = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));
  let flipContract = FlipContract.bind(event.address);
  let ilk = flipContract.ilk();
  let bids = flipContract.bids(id);
  let bid = bids.getBid();
  let lot = bids.getLot();
  let bidder = bids.getGuy().toHexString();
  log.info("[handleFlipBids] id={}, ilk={}/{}, lot={}, bid={}", [
    id.toString(),
    ilk.toString(),
    ilk.toHexString(),
    lot.toString(),
    bid.toString(),
  ]);

  let storeID = ilk
    .toHexString()
    .concat("-")
    .concat(id.toString());
  let liquidateStore = getOrCreateLiquidateStore(storeID);
  if (bid.gt(liquidateStore.bid)) {
    // save higher bid
    liquidateStore.bid = bid;
    liquidateStore.bidder = bidder;
  }
  if (liquidateStore.collateral.gt(lot)) {
    // save lower lot
    liquidateStore.collateral = lot;
    liquidateStore.bidder = bidder;
  }
  log.info("[handleFlipBids] Current winning bid: lot={}, bid={}, bidder={}", [
    liquidateStore.collateral.toString(),
    liquidateStore.bid.toString(),
    bidder,
  ]);

  liquidateStore.save();
}

export function handleFlipEndAuction(event: FlipNoteEvent): void {
  let id = bytesToUnsignedBigInt(event.params.arg1); //
  log.debug("[handleFlipEndAuction] id={}, event address={}", [id.toString(), event.address.toHexString()]);
  let flipContract = FlipContract.bind(event.address);
  let ilk = flipContract.ilk();
  log.debug("[handleFlipEndAuction] id={}, ilk={}/{}", [id.toString(), ilk.toString(), ilk.toHexString()]);
  let storeID = ilk
    .toHexString()
    .concat("-")
    .concat(id.toString());
  let liquidateStore = getOrCreateLiquidateStore(storeID);

  let liquidateID = liquidateStore.liquidate;
  let liquidate = getOrCreateLiquidate(liquidateID);
  let token = getOrCreateToken(liquidate.asset);
  liquidate.from = liquidateStore.bidder;
  // convert collateral to its native amount (it is WAD)
  liquidate.amount = bigIntChangeDecimals(liquidateStore.collateral, WAD, token.decimals);
  liquidate.amountUSD = bigIntToBDUseDecimals(liquidate.amount, token.decimals).times(token.lastPriceUSD!);
  liquidate.profitUSD = liquidate.amountUSD.minus(bigIntToBDUseDecimals(liquidateStore.bid, RAD));
  log.info("[handleFlipEndAuction]liquidate {} won by {} at ${} (liquidator profit=${})", [
    liquidateID,
    liquidateStore.bidder,
    liquidate.amountUSD.toString(),
    liquidate.profitUSD.toString(),
  ]);
  liquidate.save();

  let protocol = getOrCreateLendingProtocol();
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidate.amountUSD);
  protocol.save();

  let market = getMarketFromIlk(ilk)!;
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(liquidate.amountUSD);
  market.save();

  updateUsageMetrics(event, [], BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateMarketSnapshot(market, event, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateFinancialsSnapshot(event, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
}

// Auction used by Dog (new liquidation contract)
export function handleClipTakeBid(event: TakeEvent): void {
  let id = event.params.id;
  let liquidator = event.params.usr.toHexString();
  let lot = event.params.lot;
  //let price = event.params.price;
  let owe = event.params.owe;
  let clipContract = ClipContract.bind(event.address);
  let ilk = clipContract.ilk();
  let storeID = ilk
    .toHexString()
    .concat("-")
    .concat(id.toString());
  let liquidateStore = getOrCreateLiquidateStore(storeID);

  let liquidateID = liquidateStore.liquidate;
  let liquidate = getOrCreateLiquidate(liquidateID);
  let token = getOrCreateToken(liquidate.asset);
  liquidate.from = liquidator;
  // convert collateral to its native amount from WAD
  liquidate.amount = bigIntChangeDecimals(lot, WAD, token.decimals);
  liquidate.amountUSD = bigIntToBDUseDecimals(liquidate.amount, token.decimals).times(token.lastPriceUSD!);
  liquidate.profitUSD = liquidate.amountUSD.minus(bigIntToBDUseDecimals(owe, RAD));
  log.info("[handleClipTakeBid]liquidate {} won by {} at ${} (liquidator profit ${})", [
    liquidateID,
    liquidator,
    liquidate.amountUSD.toString(),
    liquidate.profitUSD.toString(),
  ]);
  liquidate.save();

  let protocol = getOrCreateLendingProtocol();
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidate.amountUSD);
  protocol.save();

  let market = getMarketFromIlk(ilk)!;
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(liquidate.amountUSD);
  market.save();

  updateUsageMetrics(event, [], BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateMarketSnapshot(market, event, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateFinancialsSnapshot(event, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
}

// Setting mat & par in the Spot contract
export function handleSpotFileMat(event: SpotNoteEvent): void {
  let what = event.params.arg2.toString();
  if (what == "mat") {
    let ilk = event.params.arg1;
    let market = getMarketFromIlk(ilk);
    if (market == null) {
      log.warning("[handleSpotFileMat]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }

    // 3rd arg: start = 4 + 2 * 32, end = start + 32
    let mat = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));
    log.info("[handleSpotFileMat]ilk={}, market={}, mat={}", [ilk.toString(), market.id, mat.toString()]);

    // TODO remove when verify mat working
    /*
    let spotContract = Spot.bind(event.address);
    let mat2 = bigIntToBDUseDecimals(spotContract.ilks(ilk).value1, RAY); //27 decimals
    let par2 = bigIntToBDUseDecimals(spotContract.par(), RAY); //27 decimals
    log.info("[handleSpotFileMat]mat(storage)={}, par(storage)={}", [mat2.toString(), par2.toString()]);
    */

    let protocol = getOrCreateLendingProtocol();
    let par = protocol._par!;
    market._mat = mat;
    if (mat != BIGINT_ZERO) {
      // mat for the SAI market is 0 and can not be used as deonimnator
      market.maximumLTV = BIGDECIMAL_ONE_HUNDRED.div(bigIntToBDUseDecimals(mat, RAY)).div(
        bigIntToBDUseDecimals(par, RAY),
      );
      market.liquidationThreshold = market.maximumLTV;
    }
    market.save();
  }
}

export function handleSpotFilePar(event: SpotNoteEvent): void {
  let what = event.params.arg1.toString();
  if (what == "par") {
    let par = bytesToUnsignedBigInt(event.params.arg2);
    log.info("[handleSpotFilePar]par={}", [par.toString()]);
    let protocol = getOrCreateLendingProtocol();
    protocol._par = par;
    protocol.save();

    for (let i: i32 = 0; i <= protocol.marketIDList.length; i++) {
      let market = getOrCreateMarket(protocol.marketIDList[i]);
      let mat = market._mat;
      if (mat != BIGINT_ZERO) {
        // mat is 0 for the SAI market
        market.maximumLTV = BIGDECIMAL_ONE_HUNDRED.div(bigIntToBDUseDecimals(mat, RAY)).div(
          bigIntToBDUseDecimals(par, RAY),
        );
        market.liquidationThreshold = market.maximumLTV;
        market.save();
      }
    }
  }
}

// update token price for ilk market
export function handleSpotPoke(event: PokeEvent): void {
  let ilk = event.params.ilk;
  let market = getMarketFromIlk(ilk);
  if (market == null) {
    log.warning("[handleSpotPoke]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
    return;
  }

  let tokenPriceUSD = bigIntToBDUseDecimals(bytesToUnsignedBigInt(event.params.val), WAD);
  market.inputTokenPriceUSD = tokenPriceUSD;
  market.save();

  let tokenID = market.inputToken;
  let token = getOrCreateToken(tokenID);
  token.lastPriceUSD = tokenPriceUSD;
  token.lastPriceBlockNumber = event.block.number;
  token.save();

  updatePriceForMarket(market.id, event);
  log.info("[handleSpotPoke]Price of token {} in market {} is updated to {} from {}", [
    tokenID,
    market.id,
    tokenPriceUSD.toString(),
    token.lastPriceUSD!.toString(),
  ]);
}

export function handleJugFileDuty(event: JugNoteEvent): void {
  let ilk = event.params.arg1;
  let what = event.params.arg2.toString();
  if (what == "duty") {
    let market = getMarketFromIlk(ilk);
    if (market == null) {
      log.error("[handleJugFileDuty]Failed to get market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }

    let duty = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));

    // TODO: remove code accessing duty on storage once verify correctness
    let jugContract = Jug.bind(event.address);
    let base = jugContract.base();
    let duty2 = jugContract.ilks(ilk).value0;
    let rate = bigIntToBDUseDecimals(base.plus(duty), RAY).minus(BIGDECIMAL_ONE);
    let rateAnnualized = bigDecimalExponential(rate, SECONDS_PER_YEAR_BIGDECIMAL).times(BIGDECIMAL_ONE_HUNDRED);
    log.info("[handleJugFileDuty] ilk={}, duty={}, duty2 (storage)={}, rate={}, rateAnnualized={}", [
      ilk.toString(),
      duty.toString(),
      duty2.toString(),
      rate.toString(),
      rateAnnualized.toString(),
    ]);

    let interestRateID = InterestRateSide.BORROW + "-" + InterestRateType.STABLE + "-" + market.id;
    let interestRate = getOrCreateInterestRate(market.id, InterestRateSide.BORROW, InterestRateType.STABLE);
    interestRate.rate = rateAnnualized;
    interestRate.save();

    market.rates = [interestRateID];
    market.save();
  }
}

export function handlePotFileVow(event: PotNoteEvent): void {
  // Add a "Market" entity for Pot
  // It is not an actual market, but the schema expects supply side
  // revenue accrued to a market.
  let what = event.params.arg1.toString();
  if (what == "vow") {
    //let bytes32ToAddressHexString(event.params.arg2)
    let market = getOrCreateMarket(
      event.address.toHexString(),
      "MCD POT",
      DAI_ADDRESS,
      event.block.number,
      event.block.timestamp,
    );

    log.info("[handlePotFileVow] Create market {} for Pot Contract; supply side revenue is accrued to this market", [
      market.id,
    ]);
  }

  let potContract = Pot.bind(event.address);
  let chiValue = potContract.chi();
  let rhoValue = potContract.rho();
  let _chiID = event.address.toHexString();
  log.info("[handlePotFileVow] Save values for dsr calculation: chi={}, rho={}", [
    chiValue.toString(),
    rhoValue.toString(),
  ]);
  let _chi = getOrCreateChi(_chiID);
  _chi.chi = chiValue;
  _chi.rho = rhoValue;
  _chi.save();
}

export function handlePotFileDsr(event: PotNoteEvent): void {
  let what = event.params.arg1.toString();
  if (what == "dsr") {
    let dsr = bytesToUnsignedBigInt(event.params.arg2);
    /*
    let potContract = Pot.bind(event.address);
    let chiValue = potContract.chi();
    let _chiID = event.address.toHexString();
    let _chi = getOrCreateChi(_chiID);
    _chi.chi = chiValue;
    _chi.save();
    */

    // TODO: do we need to save dai saving rate?
    // Since it is not linked to a real market, it is
    // assigned to the artificial "MCD POT" market
    let market = getOrCreateMarket(event.address.toHexString());
    let rate = bigIntToBDUseDecimals(dsr, RAY);
    let rateAnnualized = bigDecimalExponential(rate, SECONDS_PER_YEAR_BIGDECIMAL).times(BIGDECIMAL_ONE_HUNDRED);

    let interestRateID = InterestRateSide.LENDER + "-" + InterestRateType.STABLE + "-" + event.address.toHexString();
    let interestRate = getOrCreateInterestRate(market.id, InterestRateSide.LENDER, InterestRateType.STABLE);
    interestRate.rate = rateAnnualized;
    interestRate.save();

    market.rates = [interestRateID];
    market.save();

    log.info("[handlePotFileDsr] dsr={}, rate={}, rateAnnualized={}", [
      dsr.toString(),
      rate.toString(),
      rateAnnualized.toString(),
      //chiValue.toString(),
    ]);
  }
}

export function handlePotDrip(event: PotNoteEvent): void {
  let potContract = Pot.bind(event.address);
  let now = event.block.timestamp;
  let chiValueOnChain = potContract.chi();
  let Pie = potContract.Pie();

  let evtAddress = event.address.toHexString();
  let _chi = getOrCreateChi(evtAddress);
  let chiValuePrev = _chi.chi;

  let chiValueDiff = chiValueOnChain.minus(chiValuePrev);
  let newSupplySideRevenue = bigIntToBDUseDecimals(Pie, WAD).times(bigIntToBDUseDecimals(chiValueDiff, RAY));

  // dsr all goes to supply side, so totalrevenue = supplyside revenue in this call
  updateRevenue(event, evtAddress, newSupplySideRevenue, newSupplySideRevenue);

  log.info("[handlePotDrip] Pie={}, prev chi={}, current chi={}, rho={}, deltaSec={}, revenue={}", [
    Pie.toString(),
    chiValuePrev.toString(),
    chiValueOnChain.toString(),
    _chi.rho.toString(),
    now.minus(_chi.rho).toString(),
    newSupplySideRevenue.toString(),
  ]);

  _chi.chi = chiValueOnChain;
  _chi.rho = now;
  _chi.save();
}

// Store cdpi, UrnHandler, and owner address
export function handleNewCdp(event: NewCdp): void {
  let cdpi = event.params.cdp;
  let owner = event.params.own.toHexString();
  let contract = CdpManager.bind(event.address);
  let urnhandlerAddress = contract.urns(cdpi);
  let _urn = new _Urn(urnhandlerAddress.toHexString());
  _urn.ownerAddress = owner;
  _urn.cdpi = cdpi;
  _urn.save();
}

// Store proxy address and owner address
export function handleCreateProxy(event: Created): void {
  let proxy = event.params.proxy;
  let owner = event.params.owner;

  let _proxy = new _Proxy(proxy.toHexString());
  _proxy.ownerAddress = owner.toHexString();
  _proxy.save();
}
