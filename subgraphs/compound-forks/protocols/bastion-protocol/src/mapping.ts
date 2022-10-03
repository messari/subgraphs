import { BigInt, log } from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import { MarketListed } from "../../../generated/Comptroller/Comptroller";
import { LiquidateBorrow } from "../../../generated/templates/CToken/CToken";
import { LendingProtocol, Liquidate, Token } from "../../../generated/schema";
import { Network, BIGINT_ZERO } from "../../../src/constants";
import {
  ProtocolData,
  _getOrCreateProtocol,
  _handleNewReserveFactor,
  _handleNewCollateralFactor,
  _handleNewPriceOracle,
  _handleMarketListed,
  MarketListedData,
  _handleNewLiquidationIncentive,
  _handleMint,
  _handleRedeem,
  _handleBorrow,
  _handleRepayBorrow,
  _handleLiquidateBorrow,
  _handleAccrueInterest,
  getOrElse,
  _handleActionPaused,
  _handleMarketEntered,
  _handleTransfer,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { comptrollerAddr, nativeCToken, nativeToken } from "./constants";

function getOrCreateProtocol(): LendingProtocol {
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "Bastion Protocol",
    "bastion-protocol",
    "2.0.1",
    "1.1.4",
    "1.0.0",
    Network.AURORA,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.cToken);

  let cTokenAddr = event.params.cToken;
  let cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  let protocol = getOrCreateProtocol();
  let cTokenContract = CToken.bind(event.params.cToken);
  let cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );
  if (cTokenAddr == nativeCToken.address) {
    let marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      nativeCToken,
      cTokenReserveFactorMantissa
    );
    _handleMarketListed(marketListedData, event);
    return;
  }
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  if (
    event.block.number.toI32() >= 67915511 &&
    event.block.number.toI32() <= 67915618
  ) {
    log.warning("Liquidate: {} block: {} amount: {}", [
      event.transaction.hash.toHexString(),
      event.block.number.toString(),
      event.params.repayAmount.toString(),
      event.params.seizeTokens.toString(),
    ]);

    let liquidate = new Liquidate(event.transaction.hash.toHexString());
    liquidate.hash = event.transaction.hash.toHexString();
    liquidate.nonce = event.transaction.nonce;
    liquidate.logIndex = event.logIndex.toI32();
    liquidate.blockNumber = event.block.number;
    liquidate.timestamp = event.block.timestamp;
    liquidate.liquidator = event.params.liquidator;
    liquidate.liquidatee = event.params.borrower;
    liquidate.market = event.address;
    liquidate.asset = event.address;
    liquidate.siezeAmount = event.params.seizeTokens;
    liquidate.repayAmount = event.params.repayAmount;
    liquidate.save();
  }
}
