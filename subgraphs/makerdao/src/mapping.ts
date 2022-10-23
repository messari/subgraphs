import { Bytes, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/Vat/ERC20";
import { GemJoin } from "../generated/Vat/GemJoin";
import { Vat, LogNote as VatNoteEvent } from "../generated/Vat/Vat";
import { Bite as BiteEvent, LogNote as CatNoteEvent } from "../generated/CatV1/CatV1";
import { Bark as BarkEvent, File2 as DogFileChopEvent } from "../generated/Dog/Dog";
import { Flip, Clip } from "../generated/templates";
import { LogNote as FlipNoteEvent, Flip as FlipContract } from "../generated/templates/Flip/Flip";
import { Take as TakeEvent, Yank as ClipYankEvent, Clip as ClipContract } from "../generated/templates/Clip/Clip";
import { Poke as PokeEvent, LogNote as SpotNoteEvent } from "../generated/Spot/Spot";
import { Jug, LogNote as JugNoteEvent } from "../generated/Jug/Jug";
import { Pot, LogNote as PotNoteEvent } from "../generated/Pot/Pot";
import { CdpManager, NewCdp, LogNote as CdpNoteEvent } from "../generated/CdpManager/CdpManager";
import { Created } from "../generated/DSProxyFactory/DSProxyFactory";
import { BuyGem, SellGem, PSM } from "../generated/PSM-USDC-A/PSM";
import { getOwnerAddress, getOrCreatePositionCounter } from "./common/getters";
import { _FlipBidsStore, _ClipTakeStore, _Urn, _Proxy, Position, Market, _Cdpi } from "../generated/schema";
import {
  bigIntToBDUseDecimals,
  bigDecimalExponential,
  BigDecimalTruncateToBigInt,
  bigIntChangeDecimals,
} from "./utils/numbers";
import { getOrCreateChi, getOrCreateInterestRate } from "./common/getters";
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
  ProtocolSideRevenueType,
  BIGDECIMAL_NEG_ONE,
  BIGINT_NEG_ONE,
  PositionSide,
  INT_ZERO,
  INT_ONE,
} from "./common/constants";
import {
  updateUsageMetrics,
  updateFinancialsSnapshot,
  updateProtocol,
  createTransactions,
  updatePriceForMarket,
  updateRevenue,
  updateMarket,
  snapshotMarket,
  transferPosition,
  liquidatePosition,
  updatePosition,
} from "./common/helpers";
import {
  getOrCreateMarket,
  getOrCreateIlk,
  getOrCreateToken,
  getOrCreateLendingProtocol,
  getMarketFromIlk,
  getMarketAddressFromIlk,
  getOrCreateLiquidate,
} from "./common/getters";
import { createEventID } from "./utils/strings";

// Authorizating Vat (CDP engine)
export function handleVatRely(event: VatNoteEvent): void {
  const someAddress = bytes32ToAddress(event.params.arg1);
  log.debug("[handleVatRely]Input address = {}", [someAddress.toHexString()]);

  // We don't know whether the address passed in is a valid 'market' (gemjoin) address
  const marketContract = GemJoin.bind(someAddress);
  const ilkCall = marketContract.try_ilk(); // collateral type
  const gemCall = marketContract.try_gem(); // get market collateral token, referred to as 'gem'
  if (ilkCall.reverted || gemCall.reverted) {
    log.debug("[handleVatRely]Address {} is not a market", [someAddress.toHexString()]);
    log.debug("[handleVatRely]ilkCall.revert = {} gemCall.reverted = {} at tx hash {}", [
      ilkCall.reverted.toString(),
      gemCall.reverted.toString(),
      event.transaction.hash.toHexString(),
    ]);

    return;
  }
  const ilk = ilkCall.value;
  const marketID = someAddress.toHexString();

  const tokenId = gemCall.value.toHexString();
  let tokenName = "unknown";
  let tokenSymbol = "unknown";
  let decimals = 18;
  const erc20Contract = ERC20.bind(gemCall.value);
  const tokenNameCall = erc20Contract.try_name();
  if (tokenNameCall.reverted) {
    log.warning("[handleVatRely]Failed to get name for token {}", [tokenId]);
  } else {
    tokenName = tokenNameCall.value;
  }
  const tokenSymbolCall = erc20Contract.try_symbol();
  if (tokenSymbolCall.reverted) {
    log.warning("[handleVatRely]Failed to get symbol for token {}", [tokenId]);
  } else {
    tokenSymbol = tokenSymbolCall.value;
  }
  const tokenDecimalsCall = erc20Contract.try_decimals();
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

  log.info("[handleVatRely]ilk={}, market={}, token={}, name={}, symbol={}, decimals={}", [
    ilk.toString(),
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

  const protocol = getOrCreateLendingProtocol();
  protocol.totalPoolCount += 1;
  protocol.marketIDList.push(marketID);
  protocol.save();
}

export function handleVatCage(event: VatNoteEvent): void {
  const protocol = getOrCreateLendingProtocol();
  log.info("[handleVatCage]All markets paused with tx {}", [event.transaction.hash.toHexString()]);
  // Vat.cage pauses all markets
  for (let i: i32 = 0; i < protocol.marketIDList.length; i++) {
    const market = getOrCreateMarket(protocol.marketIDList[i]);
    market.isActive = false;
    market.canBorrowFrom = false;
    market.save();
  }
}

// Deposit/Withdraw
export function handleVatSlip(event: VatNoteEvent): void {
  const ilk = event.params.arg1;
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const usr = bytes32ToAddressHexString(event.params.arg2);
  const owner = getOwnerAddress(usr);
  const wad = bytesToSignedBigInt(event.params.arg3);

  const market: Market = getMarketFromIlk(ilk)!;
  const token = getOrCreateToken(market.inputToken);
  const deltaCollateral = bigIntChangeDecimals(wad, WAD, token.decimals);
  const deltaCollateralUSD = bigIntToBDUseDecimals(deltaCollateral, token.decimals).times(token.lastPriceUSD!);
  log.info("[handleVatSlip]ilk/market: {}/{}, token={}, usr={}, owner={}, deltaCollateral={}, deltaCollateralUSD={}", [
    ilk.toString(),
    market.id,
    token.name,
    usr,
    owner,
    deltaCollateral.toString(),
    deltaCollateralUSD.toString(),
  ]);

  // those are handled in handleVatFrob
  //createTransactions(event, market, owner, null, deltaCollateral, deltaCollateralUSD);
  //updatePosition(event, usr, ilk, deltaCollateral, BIGINT_ZERO);
  updateMarket(event, market, deltaCollateral, deltaCollateralUSD);
  updateUsageMetrics(event, [owner], deltaCollateralUSD, BIGDECIMAL_ZERO);
  updateProtocol(deltaCollateralUSD, BIGDECIMAL_ZERO);
  //this needs to after updateProtocol as it uses protocol to do the update
  updateFinancialsSnapshot(event, deltaCollateralUSD, BIGDECIMAL_ZERO);
}

// Borrow/Repay
export function handleVatFrob(event: VatNoteEvent): void {
  const ilk = event.params.arg1;
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  let u = bytes32ToAddressHexString(event.params.arg2);
  let v = bytes32ToAddressHexString(event.params.arg3);
  // frob(bytes32 i, address u, address v, address w, int256 dink, int256 dart) call
  // 4th arg w: start = 4 (signature) + 3 * 32, end = start + 32
  let w = bytes32ToAddressHexString(extractCallData(event.params.data, 100, 132));
  // 5th arg dink: start = 4 (signature) + 4 * 32, end = start + 32
  const dink = bytesToSignedBigInt(extractCallData(event.params.data, 132, 164)); // change to collateral
  // 6th arg dart: start = 4 (signature) + 4 * 32, end = start + 32
  const dart = bytesToSignedBigInt(extractCallData(event.params.data, 164, 196)); // change to debt

  log.info("[handleVatFrob]block#={}, ilk={}, u={}, v={}, w={}, dink={}, dart={}", [
    event.block.number.toString(),
    ilk.toString(),
    u,
    v,
    w,
    dink.toString(),
    dart.toString(),
  ]);

  /*
  if (dart == BIGINT_ZERO) {
    log.info(
      "[handleVatFrob]No borrowing/repaying in transaction {}, skipping (deposit/withdraw is handled in handleVatSlip)",
      [event.transaction.hash.toHexString()],
    );
    return;
  }
  */

  const market = getMarketFromIlk(ilk);
  if (market == null) {
    log.warning("[handleVatFrob]Failed to get market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
    return;
  }

  const token = getOrCreateToken(market.inputToken);
  const deltaCollateral = bigIntChangeDecimals(dink, WAD, token.decimals);
  const deltaCollateralUSD = bigIntToBDUseDecimals(deltaCollateral, token.decimals).times(token.lastPriceUSD!);

  /*
  if (deltaCollateral.gt(BIGINT_ZERO)) {
    updatePosition(event, u, ilk, deltaCollateral, BIGINT_ZERO);
  }

  // frob can be used to transfer collateral/debt
  // when u != v, u != w
  if (u.toLowerCase() != v.toLowerCase() && dink.notEqual(BIGINT_ZERO)) {
    transferPosition(event, ilk, v, u, PositionSide.LENDER, null, null, deltaCollateral);
  }
  if (u.toLowerCase() != w.toLowerCase() && dart.notEqual(BIGINT_ZERO)) {
    transferPosition(event, ilk, v, w, PositionSide.BORROWER, null, null, dart);
  }
  */

  const urn = u;

  // translate possible UrnHandler/DSProxy address to its owner address
  u = getOwnerAddress(u);
  v = getOwnerAddress(v);
  w = getOwnerAddress(w);

  market.inputTokenPriceUSD = token.lastPriceUSD!;
  // change in borrowing amount
  const deltaDebtUSD = bigIntToBDUseDecimals(dart, WAD); //in DAI
  // alternatively, use dai mapping on chain and include stablity fees
  //let vatContract = Vat.bind(Address.fromString(VAT_ADDRESS));
  //let dtab = dart.times(vatContract.ilks(ilk).getRate());
  //deltaDebtUSD = bigIntToBDUseDecimals(dtab, RAD);

  log.info("[handleVatFrob]inputTokenBal={}, inputTokenPrice={}, totalBorrowUSD={}", [
    market.inputTokenBalance.toString(),
    market.inputTokenPriceUSD.toString(),
    market.totalBorrowBalanceUSD.toString(),
  ]);

  createTransactions(event, market, v, w, deltaCollateral, deltaCollateralUSD, dart, deltaDebtUSD);
  updatePosition(event, urn, ilk, deltaCollateral, dart);
  updateMarket(event, market, BIGINT_ZERO, BIGDECIMAL_ZERO, deltaDebtUSD);
  updateUsageMetrics(event, [u, v, w], BIGDECIMAL_ZERO, deltaDebtUSD);
  updateProtocol(BIGDECIMAL_ZERO, deltaDebtUSD);
  //this needs to after updateProtocol as it uses protocol to do the update
  updateFinancialsSnapshot(event, BIGDECIMAL_ZERO, deltaDebtUSD);
}

// function fork( bytes32 ilk, address src, address dst, int256 dink, int256 dart)
// needed for position transfer
export function handleVatFork(event: VatNoteEvent): void {
  const ilk = event.params.arg1;
  const src = bytes32ToAddress(event.params.arg2).toHexString();
  const dst = bytes32ToAddress(event.params.arg3).toHexString();

  // fork( bytes32 ilk, address src, address dst, int256 dink, int256 dart)
  // 4th arg dink: start = 4 (signature) + 3 * 32, end = start + 32
  const dink = bytesToSignedBigInt(extractCallData(event.params.data, 100, 132)); // change to collateral
  // 5th arg dart: start = 4 (signature) + 4 * 32, end = start + 32
  const dart = bytesToSignedBigInt(extractCallData(event.params.data, 132, 164)); // change to debt

  const market: Market = getMarketFromIlk(ilk)!;
  const token = getOrCreateToken(market.inputToken);
  const collateralTransferAmount = bigIntChangeDecimals(dink, WAD, token.decimals);
  const debtTransferAmount = dart;

  log.info("[handleVatFork]ilk={}, src={}, dst={}, dink={}, dart={}", [
    ilk.toString(),
    src,
    dst,
    collateralTransferAmount.toString(),
    debtTransferAmount.toString(),
  ]);

  if (dink.gt(BIGINT_ZERO)) {
    transferPosition(event, ilk, src, dst, PositionSide.LENDER, null, null, collateralTransferAmount);
  } else if (dink.lt(BIGINT_ZERO)) {
    transferPosition(
      event,
      ilk,
      dst,
      src,
      PositionSide.LENDER,
      null,
      null,
      collateralTransferAmount.times(BIGINT_NEG_ONE),
    );
  }

  if (dart.gt(BIGINT_ZERO)) {
    transferPosition(event, ilk, src, dst, PositionSide.BORROWER, null, null, debtTransferAmount);
  } else if (dart.lt(BIGINT_ZERO)) {
    transferPosition(event, ilk, dst, src, PositionSide.BORROWER, null, null, debtTransferAmount.times(BIGINT_NEG_ONE));
  }
}

// update total revenue (stability fee)
export function handleVatFold(event: VatNoteEvent): void {
  const ilk = event.params.arg1;
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const vow = bytes32ToAddress(event.params.arg2).toHexString();
  const rate = bytesToSignedBigInt(event.params.arg3);
  const vatContract = Vat.bind(event.address);
  const ilkOnChain = vatContract.ilks(ilk);
  const revenue = ilkOnChain.getArt().times(rate);
  const newTotalRevenueUSD = bigIntToBDUseDecimals(revenue, RAD);
  if (vow.toLowerCase() != VOW_ADDRESS.toLowerCase()) {
    log.warning("[handleVatFold]Stability fee unexpectedly credited to a non-Vow address {}", [vow]);
  }
  const marketAddress = getMarketAddressFromIlk(ilk);
  if (marketAddress) {
    const marketID = marketAddress.toHexString();
    log.info("[handleVatFold]total revenue accrued from Market {}/{} = ${}", [
      ilk.toString(),
      marketID,
      newTotalRevenueUSD.toString(),
    ]);
    updateRevenue(event, marketID, newTotalRevenueUSD, BIGDECIMAL_ZERO, ProtocolSideRevenueType.STABILITYFEE);
  } else {
    log.warning("[handleVatFold]Failed to find marketID for ilk {}/{}; revenue of ${} is ignored.", [
      ilk.toString(),
      ilk.toHexString(),
      newTotalRevenueUSD.toString(),
    ]);
  }
}

// old liquidation
export function handleCatBite(event: BiteEvent): void {
  const ilk = event.params.ilk; //market
  const urn = event.params.urn.toHexString(); //liquidatee
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const flip = event.params.flip; //auction contract
  const id = event.params.id; //auction id
  const lot = event.params.ink;
  const art = event.params.art;
  const tab = event.params.tab;

  const market = getMarketFromIlk(ilk)!;
  //let LiquidateID = event.transaction.hash
  //  .toHexString()
  //  .concat("-")
  //  .concat(event.logIndex.toString());
  //getOrCreateLiquidate(LiquidateID, event, market, urn());

  // remove borrowed amount from borrowed balance
  // collateral/tvl update is taken care of when it exits vat
  // via the slip() function/event
  const deltaDebtUSD = bigIntToBDUseDecimals(art, WAD).times(BIGDECIMAL_NEG_ONE);
  updateMarket(event, market, BIGINT_ZERO, BIGDECIMAL_ZERO, deltaDebtUSD);

  const liquidationRevenueUSD = bigIntToBDUseDecimals(tab, RAD).times(
    market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED),
  );

  updateRevenue(event, market.id, liquidationRevenueUSD, BIGDECIMAL_ZERO, ProtocolSideRevenueType.LIQUIDATION);

  const storeID = flip.toHexString().concat("-").concat(id.toString());

  log.info("[handleCatBite]storeID={}, ilk={}, urn={}: lot={}, art={}, tab={}, liquidation revenue=${}", [
    storeID,
    ilk.toString(),
    urn,
    lot.toString(),
    art.toString(),
    tab.toString(),
    liquidationRevenueUSD.toString(),
  ]);

  const liquidatee = getOwnerAddress(urn);
  //let debt = bigIntChangeDecimals(tab, RAD, WAD);
  const flipBidsStore = new _FlipBidsStore(storeID);
  flipBidsStore.round = INT_ZERO;
  flipBidsStore.urn = urn;
  flipBidsStore.liquidatee = liquidatee;
  flipBidsStore.lot = lot;
  flipBidsStore.art = art;
  flipBidsStore.tab = tab; // not including liquidation penalty
  flipBidsStore.bid = BIGINT_ZERO;
  flipBidsStore.bidder = ZERO_ADDRESS;
  flipBidsStore.ilk = ilk.toHexString();
  flipBidsStore.market = market.id;
  flipBidsStore.ended = false;
  flipBidsStore.save();

  // auction
  Flip.create(flip);
}

// Update liquidate penalty for the Cat contract
// Works for both Cat V1 and V2
export function handleCatFile(event: CatNoteEvent): void {
  const ilk = event.params.arg1;
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const what = event.params.arg2.toString();
  // 3rd arg: start = 4 + 2 * 32, end = start + 32
  const chop = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));

  if (what == "chop") {
    const market = getMarketFromIlk(ilk);
    if (market == null) {
      log.warning("[handleFileDog]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }
    const liquidationPenalty = bigIntToBDUseDecimals(chop, RAY).minus(BIGDECIMAL_ONE).times(BIGDECIMAL_ONE_HUNDRED);
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
  const ilk = event.params.ilk; //market
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const urn = event.params.urn; //liquidatee
  const clip = event.params.clip; //auction contract
  const id = event.params.id; //auction id
  const lot = event.params.ink;
  const art = event.params.art;
  const due = event.params.due; //including interest, but not penalty

  const market = getMarketFromIlk(ilk)!;
  const storeID = clip.toHexString().concat("-").concat(id.toString());

  // remove borrowed amount from borrowed balance
  // collateral/tvl update is taken care of when it exits vat
  // via the slip() function/event
  const deltaDebtUSD = bigIntToBDUseDecimals(art, WAD).times(BIGDECIMAL_NEG_ONE);
  updateMarket(event, market, BIGINT_ZERO, BIGDECIMAL_ZERO, deltaDebtUSD);

  const liquidationRevenueUSD = bigIntToBDUseDecimals(due, RAD).times(
    market.liquidationPenalty.div(BIGDECIMAL_ONE_HUNDRED),
  );

  updateRevenue(event, market.id, liquidationRevenueUSD, BIGDECIMAL_ZERO, ProtocolSideRevenueType.LIQUIDATION);

  log.info("[handleDogBark]storeID={}, ilk={}, urn={}: lot={}, art={}, due={}, liquidation revenue=${}", [
    storeID,
    ilk.toString(),
    urn.toHexString(),
    lot.toString(),
    art.toString(),
    due.toString(),
    liquidationRevenueUSD.toString(),
  ]);

  //let debt = bigIntChangeDecimals(due, RAD, WAD);
  const clipTakeStore = new _ClipTakeStore(storeID);
  clipTakeStore.slice = INT_ZERO;
  clipTakeStore.ilk = ilk.toHexString();
  clipTakeStore.market = market.id;
  clipTakeStore.urn = urn.toHexString();
  clipTakeStore.lot = lot;
  clipTakeStore.art = art;
  clipTakeStore.tab = due; //not including penalty
  clipTakeStore.tab0 = due;
  clipTakeStore.save();

  Clip.create(clip);
}

// Update liquidate penalty for the Dog contract
export function handleDogFile(event: DogFileChopEvent): void {
  const ilk = event.params.ilk;
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const what = event.params.what.toString();
  if (what == "chop") {
    const market = getMarketFromIlk(ilk);
    if (market == null) {
      log.warning("[handleFileDog]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }
    const chop = event.params.data;
    const liquidationPenalty = bigIntToBDUseDecimals(chop, RAY).minus(BIGDECIMAL_ONE).times(BIGDECIMAL_ONE_HUNDRED);
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
  const id = bytesToUnsignedBigInt(event.params.arg1); //
  //let lot = bytesToUnsignedBigInt(event.params.arg2); // uint256 lot
  // 3rd arg start = 4 + 2 * 32, end = start+32
  //let bid = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));
  const flipContract = FlipContract.bind(event.address);
  const ilk = flipContract.ilk();
  const bids = flipContract.bids(id);
  const bid = bids.getBid();
  const lot = bids.getLot();
  const tab = bids.getTab();
  const bidder = bids.getGuy().toHexString();

  const storeID = event.address //flip contract
    .toHexString()
    .concat("-")
    .concat(id.toString());

  const flipBidsStore = _FlipBidsStore.load(storeID)!;
  // let liquidateID = liquidateStore.liquidate;
  log.info(
    "[handleFlipBids] storeID={}, flip.id={}, ilk={}, round #{} store status: lot={}, tab={}, bid={}, bidder={}",
    [
      //liquidateID,
      storeID,
      id.toString(),
      ilk.toString(),
      flipBidsStore.round.toString(),
      flipBidsStore.lot.toString(),
      flipBidsStore.tab.toString(),
      flipBidsStore.bid.toString(),
      flipBidsStore.bidder,
    ],
  );

  log.info(
    "[handleFlipBids] storeID={}, flip.id={}, ilk={}, round #{} call inputs: lot={}, tab={}, bid={}, bidder={}",
    [
      storeID,
      id.toString(),
      ilk.toString(),
      flipBidsStore.round.toString(),
      lot.toString(),
      tab.toString(),
      bid.toString(),
      bidder,
    ],
  );

  if (flipBidsStore.tab.notEqual(tab)) {
    flipBidsStore.tab = tab; // initial tab does not include liquidation penalty
  }

  if (flipBidsStore.bid.lt(bid)) {
    // save higher bid
    flipBidsStore.bid = bid;
    flipBidsStore.bidder = bidder;
  }
  if (flipBidsStore.lot.gt(lot)) {
    // save lower lot
    flipBidsStore.lot = lot;
    flipBidsStore.bidder = bidder;
  }
  flipBidsStore.round += INT_ONE;

  const market = getMarketFromIlk(ilk)!;
  const token = getOrCreateToken(market.inputToken);
  const value = bigIntToBDUseDecimals(flipBidsStore.lot, token.decimals).times(market.inputTokenPriceUSD);
  log.info(
    "[handleFlipBids]storeID={}, flip.id={}, ilk={} round #{} winning bid: lot={}, price={}, value (lot*price)={}, tab={}, bid={}, bidder={}",
    [
      flipBidsStore.id,
      id.toString(),
      flipBidsStore.ilk,
      flipBidsStore.round.toString(),
      flipBidsStore.lot.toString(),
      market.inputTokenPriceUSD.toString(),
      value.toString(),
      flipBidsStore.tab.toString(),
      flipBidsStore.bid.toString(),
      bidder,
    ],
  );
  flipBidsStore.save();
}

// handle flip.deal and flip.yank
export function handleFlipEndAuction(event: FlipNoteEvent): void {
  const id = bytesToUnsignedBigInt(event.params.arg1); //
  //log.debug("[handleFlipEndAuction] id={}, event address={}", [id.toString(), event.address.toHexString()]);
  //let flipContract = FlipContract.bind(event.address);
  //let ilk = flipContract.ilk();
  //log.debug("[handleFlipEndAuction] id={}, ilk={}/{}", [id.toString(), ilk.toString(), ilk.toHexString()]);
  const storeID = event.address //flip contract
    .toHexString()
    .concat("-")
    .concat(id.toString());

  const flipBidsStore = _FlipBidsStore.load(storeID)!;
  log.info("[handleFlipEndAuction]storeID={}, flip.id={} store status: lot={}, tab={}, bid={}, bidder={}", [
    flipBidsStore.id, //storeID
    id.toString(),
    flipBidsStore.lot.toString(),
    flipBidsStore.tab.toString(),
    flipBidsStore.bid.toString(),
    flipBidsStore.bidder,
  ]);

  const marketID = flipBidsStore.market;
  const market = getOrCreateMarket(marketID);
  const token = getOrCreateToken(market.inputToken);

  const amount = bigIntChangeDecimals(flipBidsStore.lot, WAD, token.decimals);
  const amountUSD = bigIntToBDUseDecimals(amount, token.decimals).times(token.lastPriceUSD!);
  // bid is in DAI, assumed to priced at $1
  const profitUSD = amountUSD.minus(bigIntToBDUseDecimals(flipBidsStore.bid, RAD));

  const liquidateID = createEventID(event);
  const liquidate = getOrCreateLiquidate(
    liquidateID,
    event,
    market,
    flipBidsStore.liquidatee,
    flipBidsStore.bidder,
    amount,
    amountUSD,
    profitUSD,
  );

  log.info(
    "[handleFlipEndAuction]storeID={}, flip.id={} final: liquidate.id={}, amount={}, price={}, amountUSD={}, profitUSD={}",
    [
      flipBidsStore.id, //storeID
      id.toString(),
      liquidate.id,
      liquidate.amount.toString(),
      token.lastPriceUSD!.toString(),
      liquidate.amountUSD.toString(),
      liquidate.profitUSD.toString(),
    ],
  );

  if (
    liquidate.amount.le(BIGINT_ZERO) ||
    liquidate.amountUSD.le(BIGDECIMAL_ZERO) ||
    liquidate.profitUSD.le(BIGDECIMAL_ZERO)
  ) {
    log.warning(
      "[handleFlipEndAuction]storeID={}, liquidateID={}, flip.id={} problematic values: amount={}, amountUSD={}, profitUSD={}",
      [
        liquidateID,
        storeID,
        id.toString(),
        liquidate.amount.toString(),
        liquidate.amountUSD.toString(),
        liquidate.profitUSD.toString(),
      ],
    );
  }
  //liquidate._finalized = true;
  liquidate.save();

  flipBidsStore.ended = true;
  flipBidsStore.save();

  // update positions
  const ilk = Bytes.fromHexString(flipBidsStore.ilk);
  // TODO: debugging
  const urn = flipBidsStore.urn;
  const sides = [PositionSide.LENDER, PositionSide.BORROWER];
  log.info("[]txhash={}", [event.transaction.hash.toHexString()]);
  for (let si = 0; si <= 1; si++) {
    const side = sides[si];
    const counterEnity = getOrCreatePositionCounter(urn, ilk, side);
    for (let counter = counterEnity.nextCount; counter >= 0; counter--) {
      const positionID = `${urn}-${marketID}-${side}-${counter}`;
      const position = Position.load(positionID);
      if (position) {
        log.info("[handleFlipEndAuction]{}: balance={}, account={}, hashClosed={}", [
          positionID,
          position.balance.toString(),
          position.account,
          position.hashClosed ? position.hashClosed! : "null",
        ]);
      } else {
        log.info("[handleFlipEndAuction]{}: position not existing", [positionID]);
      }
    }
  }

  liquidatePosition(event, flipBidsStore.urn, ilk, liquidate.liquidator, liquidate.amount, flipBidsStore.art);

  updateProtocol(BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateMarket(event, market, BIGINT_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateUsageMetrics(event, [], BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateFinancialsSnapshot(event, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
}

// Auction used by Dog (new liquidation contract)
export function handleClipTakeBid(event: TakeEvent): void {
  const id = event.params.id;
  let liquidatee = event.params.usr.toHexString();
  const max = event.params.max;
  const lot = event.params.lot;
  const price = event.params.price;
  const tab = event.params.tab;
  const owe = event.params.owe;

  const clipContract = ClipContract.bind(event.address);
  const ilk = clipContract.ilk();

  const liquidator = event.transaction.from.toHexString();
  // translate possible proxy/urn handler address to owner address
  liquidatee = getOwnerAddress(liquidatee);

  const storeID = event.address //clip contract
    .toHexString()
    .concat("-")
    .concat(id.toString());
  //let liquidateStore = getOrCreateLiquidateStore(storeID);
  const clipTakeStore = _ClipTakeStore.load(storeID)!;
  clipTakeStore.slice += INT_ONE;
  const marketID = clipTakeStore.market;
  const market = getOrCreateMarket(marketID);
  const token = getOrCreateToken(market.inputToken);

  const value = bigIntToBDUseDecimals(lot, token.decimals).times(token.lastPriceUSD!);
  log.info(
    "[handleClipTakeBid]block#={}, storeID={}, clip.id={}, slice #{} event params: max={}, lot={}, price={}, value(lot*price)={}, art={}, tab={}, owe={}, liquidatee={}, liquidator={}",
    [
      event.block.number.toString(),
      storeID, //storeID
      id.toString(),
      clipTakeStore.slice.toString(),
      max.toString(),
      lot.toString(),
      price.toString(),
      value.toString(),
      clipTakeStore.art.toString(),
      tab.toString(),
      owe.toString(),
      liquidatee,
      liquidator,
    ],
  );

  const deltaLot = clipTakeStore.lot.minus(lot);
  const deltaTab = clipTakeStore.tab.minus(tab);
  const amount = bigIntChangeDecimals(deltaLot, WAD, token.decimals);
  const amountUSD = bigIntToBDUseDecimals(amount, token.decimals).times(token.lastPriceUSD!);
  //let profitUSD = amountUSD.minus(bigIntToBDUseDecimals(deltaTab, WAD));
  const profitUSD = amountUSD.minus(bigIntToBDUseDecimals(owe, RAD));

  const liquidateID = createEventID(event);
  const liquidate = getOrCreateLiquidate(
    liquidateID,
    event,
    market,
    liquidatee,
    liquidator,
    amount,
    amountUSD,
    profitUSD,
  );

  clipTakeStore.lot = lot;
  clipTakeStore.tab = tab;
  clipTakeStore.save();

  /*
  if (
    liquidateID.toLowerCase() != "0x63bc315387b2853768716e48cb5ea1b21a2a6cc583774f8a7a0646eb610325dc-192".toLowerCase()
  ) {
    return;
  }


  //let liquidate = getOrCreateLiquidate(liquidateID); // use the cat.bite event as ID
  let liquidate = getOrCreateLiquidate(createEventID(event), event, market, liquidateStore.liquidatee, liquidator);
  // convert collateral to its native amount from WAD
  liquidate.amount = bigIntChangeDecimals(lot, WAD, token.decimals);
  liquidate.amountUSD = bigIntToBDUseDecimals(liquidate.amount, token.decimals).times(token.lastPriceUSD!);
  liquidate.profitUSD = liquidate.amountUSD.minus(bigIntToBDUseDecimals(owe, RAD));

  */

  log.info(
    "[handleClipTakeBid]liquidateID={}, storeID={}, clip.id={}, slice #{} final: amount={}, amountUSD={}, profitUSD={}",
    [
      liquidate.id,
      clipTakeStore.id, //storeID
      id.toString(),
      clipTakeStore.slice.toString(),
      liquidate.amount.toString(),
      liquidate.amountUSD.toString(),
      liquidate.profitUSD.toString(),
    ],
  );

  if (
    liquidate.amount.le(BIGINT_ZERO) ||
    liquidate.amountUSD.le(BIGDECIMAL_ZERO) ||
    liquidate.profitUSD.le(BIGDECIMAL_ZERO)
  ) {
    log.warning(
      "[handleClipTakeBid]liquidateID={}, storeID={}, clip.id={} slice #{} problematic values: amount={}, amountUSD={}, profitUSD={}",
      [
        liquidateID,
        storeID,
        id.toString(),
        clipTakeStore.slice.toString(),
        liquidate.amount.toString(),
        liquidate.amountUSD.toString(),
        liquidate.profitUSD.toString(),
      ],
    );
  }

  log.info("[handleClipTakeBid]storeID={}, clip.id={} clipTakeStatus: lot={}, tab={}, price={}", [
    storeID, //storeID
    id.toString(),
    clipTakeStore.lot.toString(),
    clipTakeStore.tab.toString(),
    token.lastPriceUSD!.toString(),
  ]);

  const debtRepaid = BigDecimalTruncateToBigInt(
    clipTakeStore.art.times(deltaTab).divDecimal(clipTakeStore.tab0!.toBigDecimal()),
  ).plus(BIGINT_ONE); // plus 1 to avoid rounding down & not closing borrowing position

  //liquidate._finalized = true;
  //liquidate.save();
  liquidatePosition(event, clipTakeStore.urn!, ilk, liquidate.liquidator, liquidate.amount, debtRepaid);
  updateMarket(event, market, BIGINT_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateProtocol(BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateUsageMetrics(
    event,
    [],
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    liquidate.amountUSD,
    liquidate.liquidator,
    liquidate.liquidatee,
  );
  updateFinancialsSnapshot(event, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
}

// cancel auction
export function handleClipYankBid(event: ClipYankEvent): void {
  const id = event.params.id;
  const clipContract = ClipContract.bind(event.address);
  const ilk = clipContract.ilk();
  const sales = clipContract.sales(id);
  const lot = sales.getLot();
  const tab = sales.getTab();
  let liquidatee = sales.getUsr().toHexString();

  const liquidator = event.transaction.from.toHexString();
  // translate possible proxy/urn handler address to owner address
  liquidatee = getOwnerAddress(liquidatee);

  const storeID = event.address //clip contract
    .toHexString()
    .concat("-")
    .concat(id.toString());
  //let liquidateStore = getOrCreateLiquidateStore(storeID);
  const clipTakeStore = _ClipTakeStore.load(storeID)!;

  //let storeID = event.address //clip contract
  //  .toHexString()
  //  .concat("-")
  //  .concat(id.toString());
  //let liquidateStore = getOrCreateLiquidateStore(storeID);
  //let clipTakeStore = _ClipTakeStore.load(storeID)!

  //let liquidateID = liquidateStore.liquidate;
  const market = getMarketFromIlk(ilk)!;
  const token = getOrCreateToken(market.inputToken);

  const liquidateID = createEventID(event);
  // convert collateral to its native amount from WAD
  const amount = bigIntChangeDecimals(lot, WAD, token.decimals);
  const amountUSD = bigIntToBDUseDecimals(amount, token.decimals).times(token.lastPriceUSD!);
  const profitUSD = amountUSD.minus(bigIntToBDUseDecimals(tab, RAD));
  const liquidate = getOrCreateLiquidate(
    liquidateID,
    event,
    market,
    liquidatee,
    liquidator,
    amount,
    amountUSD,
    profitUSD,
  );

  log.info(
    "[handleClipYankBid]auction for liquidation {} (id {}) cancelled, assuming the msg sender {} won at ${} (profit ${})",
    [liquidateID, id.toString(), liquidator, liquidate.amountUSD.toString(), liquidate.profitUSD.toString()],
  );

  if (
    liquidate.amount.le(BIGINT_ZERO) ||
    liquidate.amountUSD.le(BIGDECIMAL_ZERO) ||
    liquidate.profitUSD.le(BIGDECIMAL_ZERO)
  ) {
    log.warning("[handleClipTakeBid]problematic values: amount={}, amountUSD={}, profitUSD={}", [
      liquidate.amount.toString(),
      liquidate.amountUSD.toString(),
      liquidate.profitUSD.toString(),
    ]);
  }
  //liquidate._finalized = true;
  liquidate.save();

  const debtRepaid = BigDecimalTruncateToBigInt(
    clipTakeStore.art.times(tab).divDecimal(clipTakeStore.tab0!.toBigDecimal()),
  ).plus(BIGINT_ONE); // plus 1 to avoid rounding down & not closing borrowing position

  liquidatePosition(event, clipTakeStore.urn!, ilk, liquidate.liquidator, liquidate.amount, debtRepaid);
  updateMarket(event, market, BIGINT_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateProtocol(BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
  updateUsageMetrics(event, [], BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD, liquidator, liquidatee);
  updateFinancialsSnapshot(event, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, liquidate.amountUSD);
}

// Setting mat & par in the Spot contract
export function handleSpotFileMat(event: SpotNoteEvent): void {
  const what = event.params.arg2.toString();
  if (what == "mat") {
    const ilk = event.params.arg1;
    if (ilk.toString() == "TELEPORT-FW-A") {
      log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [
        ilk.toString(),
      ]);
      return;
    }
    const market = getMarketFromIlk(ilk);
    if (market == null) {
      log.warning("[handleSpotFileMat]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }

    // 3rd arg: start = 4 + 2 * 32, end = start + 32
    const mat = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));
    log.info("[handleSpotFileMat]ilk={}, market={}, mat={}", [ilk.toString(), market.id, mat.toString()]);

    const protocol = getOrCreateLendingProtocol();
    const par = protocol._par!;
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
  const what = event.params.arg1.toString();
  if (what == "par") {
    const par = bytesToUnsignedBigInt(event.params.arg2);
    log.info("[handleSpotFilePar]par={}", [par.toString()]);
    const protocol = getOrCreateLendingProtocol();
    protocol._par = par;
    protocol.save();

    for (let i: i32 = 0; i <= protocol.marketIDList.length; i++) {
      const market = getOrCreateMarket(protocol.marketIDList[i]);
      const mat = market._mat;
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
  const ilk = event.params.ilk;
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const market = getMarketFromIlk(ilk);
  if (market == null) {
    log.warning("[handleSpotPoke]Failed to get Market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
    return;
  }

  const tokenPriceUSD = bigIntToBDUseDecimals(bytesToUnsignedBigInt(event.params.val), WAD);
  market.inputTokenPriceUSD = tokenPriceUSD;
  market.save();

  const tokenID = market.inputToken;
  const token = getOrCreateToken(tokenID);
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
  const ilk = event.params.arg1;
  if (ilk.toString() == "TELEPORT-FW-A") {
    log.info("[handleVatSlip] Skip ilk={} (DAI Teleport: https://github.com/makerdao/dss-teleport)", [ilk.toString()]);
    return;
  }
  const what = event.params.arg2.toString();
  if (what == "duty") {
    const market = getMarketFromIlk(ilk);
    if (market == null) {
      log.error("[handleJugFileDuty]Failed to get market for ilk {}/{}", [ilk.toString(), ilk.toHexString()]);
      return;
    }

    const jugContract = Jug.bind(event.address);
    const base = jugContract.base();
    const duty = jugContract.ilks(ilk).value0;
    const rate = bigIntToBDUseDecimals(base.plus(duty), RAY).minus(BIGDECIMAL_ONE);
    let rateAnnualized = BIGDECIMAL_ZERO;
    if (rate.gt(BIGDECIMAL_ZERO)) {
      rateAnnualized = bigDecimalExponential(rate, SECONDS_PER_YEAR_BIGDECIMAL).times(BIGDECIMAL_ONE_HUNDRED);
    }
    log.info("[handleJugFileDuty] ilk={}, duty={}, rate={}, rateAnnualized={}", [
      ilk.toString(),
      duty.toString(),
      rate.toString(),
      rateAnnualized.toString(),
    ]);

    const interestRateID = InterestRateSide.BORROW + "-" + InterestRateType.STABLE + "-" + market.id;
    const interestRate = getOrCreateInterestRate(market.id, InterestRateSide.BORROW, InterestRateType.STABLE);
    interestRate.rate = rateAnnualized;
    interestRate.save();

    market.rates = [interestRateID];
    market.save();
    snapshotMarket(event, market);
  }
}

export function handlePotFileVow(event: PotNoteEvent): void {
  // Add a "Market" entity for Pot
  // It is not an actual market, but the schema expects supply side
  // revenue accrued to a market.
  const what = event.params.arg1.toString();
  if (what == "vow") {
    //let bytes32ToAddressHexString(event.params.arg2)
    const market = getOrCreateMarket(
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

  const potContract = Pot.bind(event.address);
  const chiValue = potContract.chi();
  const rhoValue = potContract.rho();
  const _chiID = event.address.toHexString();
  log.info("[handlePotFileVow] Save values for dsr calculation: chi={}, rho={}", [
    chiValue.toString(),
    rhoValue.toString(),
  ]);
  const _chi = getOrCreateChi(_chiID);
  _chi.chi = chiValue;
  _chi.rho = rhoValue;
  _chi.save();
}

export function handlePotFileDsr(event: PotNoteEvent): void {
  const what = event.params.arg1.toString();
  if (what == "dsr") {
    const dsr = bytesToUnsignedBigInt(event.params.arg2);

    // Since DAI saving is not linked to a real market, it is
    // assigned to the artificial "MCD POT" market
    const market = getOrCreateMarket(event.address.toHexString());
    const rate = bigIntToBDUseDecimals(dsr, RAY).minus(BIGDECIMAL_ONE);
    let rateAnnualized = BIGDECIMAL_ZERO;
    if (rate.gt(BIGDECIMAL_ZERO)) {
      rateAnnualized = bigDecimalExponential(rate, SECONDS_PER_YEAR_BIGDECIMAL).times(BIGDECIMAL_ONE_HUNDRED);
    }

    const interestRateID = `${InterestRateSide.LENDER}-${InterestRateType.STABLE}-${event.address.toHexString()}`;
    const interestRate = getOrCreateInterestRate(market.id, InterestRateSide.LENDER, InterestRateType.STABLE);
    interestRate.rate = rateAnnualized;
    interestRate.save();

    market.rates = [interestRateID];
    market.save();
    snapshotMarket(event, market);

    log.info("[handlePotFileDsr] dsr={}, rate={}, rateAnnualized={}", [
      dsr.toString(),
      rate.toString(),
      rateAnnualized.toString(),
      //chiValue.toString(),
    ]);
  }
}

export function handlePotDrip(event: PotNoteEvent): void {
  const potContract = Pot.bind(event.address);
  const now = event.block.timestamp;
  const chiValueOnChain = potContract.chi();
  const Pie = potContract.Pie();

  const evtAddress = event.address.toHexString();
  const _chi = getOrCreateChi(evtAddress);
  const chiValuePrev = _chi.chi;

  const chiValueDiff = chiValueOnChain.minus(chiValuePrev);
  const newSupplySideRevenue = bigIntToBDUseDecimals(Pie, WAD).times(bigIntToBDUseDecimals(chiValueDiff, RAY));

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
  const cdpi = event.params.cdp;
  const owner = event.params.own.toHexString().toLowerCase();
  const contract = CdpManager.bind(event.address);
  const urnhandlerAddress = contract.urns(cdpi).toHexString();
  const ilk = contract.ilks(cdpi);
  const _cdpi = new _Cdpi(cdpi.toString());
  _cdpi.urn = urnhandlerAddress.toString();
  _cdpi.ilk = ilk.toHexString();
  _cdpi.ownerAddress = owner;
  _cdpi.save();

  const _urn = new _Urn(urnhandlerAddress);
  _urn.ownerAddress = owner;
  _urn.cdpi = cdpi;
  _urn.save();

  log.info("[handleNewCdp]cdpi={}, ilk={}, urn={}, owner={}", [
    cdpi.toString(),
    ilk.toString(),
    urnhandlerAddress,
    owner,
  ]);
}

// Give a CDP position to a new owner
export function handleCdpGive(event: CdpNoteEvent): void {
  // update mapping between urnhandler and owner
  const cdpi = bytesToUnsignedBigInt(event.params.arg1);
  const dstAccountAddress = bytes32ToAddressHexString(event.params.arg2);
  //let contract = CdpManager.bind(event.address);
  //let srcUrnAddress = contract
  //  .urns(cdpi)
  //  .toHexString()
  //  .toLowerCase();
  //let ilk = contract.ilks(cdpi);
  const _cdpi = _Cdpi.load(cdpi.toString())!;
  const srcUrn = _cdpi.urn;
  const ilk = _cdpi.ilk;
  //let srcAccountAddressC = _cdpi.ownerAddress;
  _cdpi.ownerAddress = dstAccountAddress;
  _cdpi.save();

  const _urn = _Urn.load(srcUrn)!;
  const srcAccountAddress = _urn.ownerAddress;
  // since it is a transfer of cdp position, the urn record should already exist
  _urn.ownerAddress = dstAccountAddress;
  _urn.save();

  log.info("[handleCdpGive] cdpi {} (ilk={}, urn={}) is given to {} from {}", [
    cdpi.toString(),
    ilk,
    srcUrn,
    dstAccountAddress,
    srcAccountAddress,
  ]);

  const ilkBytes = Bytes.fromHexString(ilk);
  transferPosition(event, ilkBytes, srcUrn, srcUrn, PositionSide.LENDER, srcAccountAddress, dstAccountAddress);
  transferPosition(event, ilkBytes, srcUrn, srcUrn, PositionSide.BORROWER, srcAccountAddress, dstAccountAddress);
}

// Move a position from cdpSrc urn to the cdpDst urn
// If the two positions are not the same ower, close existing position and open new position
export function handleCdpShift(event: CdpNoteEvent): void {
  const srcCdp = bytesToUnsignedBigInt(event.params.arg1);
  const dstCdp = bytesToUnsignedBigInt(event.params.arg2);

  const srcCdpi = _Cdpi.load(srcCdp.toString());
  const srcIlk = Bytes.fromHexString(srcCdpi!.ilk);
  const srcUrnAddress = srcCdpi!.urn;
  //let srcAccountAddress = srcCdpi!.ownerAddress;

  const dstCdpi = _Cdpi.load(dstCdp.toString());
  // this should be the same as srcIlk
  const dstIlk = Bytes.fromHexString(dstCdpi!.ilk);
  const dstUrnAddress = dstCdpi!.urn;
  //let dstAccountAddress = dstCdpi!.ownerAddress;

  log.info("[handleCdpShift]cdpi {}/urn {}/ilk {} -> cdpi {}/urn {}/ilk {}", [
    srcCdp.toString(),
    srcUrnAddress,
    srcIlk.toString(),
    dstCdp.toString(),
    dstUrnAddress,
    dstIlk.toString(),
  ]);

  transferPosition(event, srcIlk, srcUrnAddress, dstUrnAddress, PositionSide.LENDER);
  transferPosition(event, srcIlk, srcUrnAddress, dstUrnAddress, PositionSide.BORROWER);
}

// Import a position from src urn to the urn owned by cdp
export function handleCdpEnter(event: CdpNoteEvent): void {
  const src = bytes32ToAddress(event.params.arg1).toHexString();
  const cdpi = bytesToUnsignedBigInt(event.params.arg2);

  const _cdpi = _Cdpi.load(cdpi.toString());
  const dst = _cdpi!.urn;
  const ilk = Bytes.fromHexString(_cdpi!.ilk);

  transferPosition(event, ilk, src, dst, PositionSide.LENDER);
  transferPosition(event, ilk, src, dst, PositionSide.BORROWER);
}

// Quit the Cdp system, migrating the cdp (ink, art) to a dst urn
export function handleCdpQuit(event: CdpNoteEvent): void {
  const cdpi = bytesToUnsignedBigInt(event.params.arg1);
  const dst = bytes32ToAddress(event.params.arg2).toHexString();

  const _cdpi = _Cdpi.load(cdpi.toString());
  const src = _cdpi!.urn;
  const ilk = Bytes.fromHexString(_cdpi!.ilk);

  transferPosition(event, ilk, src, dst, PositionSide.LENDER);
  transferPosition(event, ilk, src, dst, PositionSide.BORROWER);
}

// Transfer cdp collateral from the cdp address to a dst address
export function handleCdpFlux(event: CdpNoteEvent): void {
  const cdpi = bytesToUnsignedBigInt(event.params.arg1);
  const dst = bytes32ToAddress(event.params.arg2).toHexString();
  // 3rd arg: start = 4 + 2 * 32, end = start + 32
  const wad = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));
  if (wad == BIGINT_ZERO) {
    log.info("[handleCdpFlux]wad = 0, skip transferring position", []);
    return;
  }
  const _cdpi = _Cdpi.load(cdpi.toString());
  const src = _cdpi!.urn;
  const ilk = Bytes.fromHexString(_cdpi!.ilk);
  const market: Market = getMarketFromIlk(ilk)!;
  const token = getOrCreateToken(market.inputToken);
  const transferAmount = bigIntChangeDecimals(wad, WAD, token.decimals);

  log.info("[handleCdpFlux]transfer {} collateral from src {} to dst {} for ilk {}", [
    wad.toString(),
    src,
    dst,
    ilk.toString(),
  ]);
  transferPosition(event, ilk, src, dst, PositionSide.LENDER, null, null, transferAmount);
}

// Transfer DAI from the cdp address to a dst address
export function handleCdpMove(event: CdpNoteEvent): void {
  const cdpi = bytesToUnsignedBigInt(event.params.arg1);
  const dst = bytes32ToAddress(event.params.arg2).toHexString();
  // 3rd arg: start = 4 + 2 * 32, end = start + 32
  const rad = bytesToUnsignedBigInt(extractCallData(event.params.data, 68, 100));
  if (rad == BIGINT_ZERO) {
    log.info("[handleCdpMove]wad = 0, skip transferring position", []);
    return;
  }
  const transferAmount = bigIntChangeDecimals(rad, RAD, WAD);

  const _cdpi = _Cdpi.load(cdpi.toString());
  const src = _cdpi!.urn;
  const ilk = Bytes.fromHexString(_cdpi!.ilk);

  log.info("[handleCdpMove]transfer {} DAI from src {} to dst {} for ilk {}", [
    transferAmount.toString(),
    src,
    dst,
    ilk.toString(),
  ]);

  transferPosition(event, ilk, src, dst, PositionSide.BORROWER, null, null, transferAmount);
}

// Store proxy address and owner address
export function handleCreateProxy(event: Created): void {
  const proxy = event.params.proxy;
  const owner = event.params.owner;

  const _proxy = new _Proxy(proxy.toHexString());
  _proxy.ownerAddress = owner.toHexString().toLowerCase();
  _proxy.save();
}

export function handleBuyGem(event: BuyGem): void {
  const fee = event.params.fee;
  const feeUSD = bigIntToBDUseDecimals(fee, WAD);
  _handleSwapFee(event, feeUSD);
}

export function handleSellGem(event: SellGem): void {
  const fee = event.params.fee;
  const feeUSD = bigIntToBDUseDecimals(fee, WAD);
  _handleSwapFee(event, feeUSD);
}

function _handleSwapFee(event: ethereum.Event, feeUSD: BigDecimal): void {
  const contract = PSM.bind(event.address);
  const ilk = contract.ilk();
  const marketID = getMarketAddressFromIlk(ilk)!.toHexString();
  log.info("[handleSwapFee]Swap fee revenue {} collected from market {}", [feeUSD.toString(), marketID]);
  updateRevenue(event, marketID, feeUSD, BIGDECIMAL_ZERO, ProtocolSideRevenueType.PSM);
}
