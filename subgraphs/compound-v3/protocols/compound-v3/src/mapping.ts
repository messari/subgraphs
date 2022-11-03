import { Address, Bytes, log } from "@graphprotocol/graph-ts";
import { CometDeployed } from "../../../generated/Configurator/Configurator";
import {
  Comet,
  Supply,
  SupplyCollateral,
} from "../../../generated/templates/Comet/Comet";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  bigIntToBigDecimal,
  BIGINT_HUNDRED,
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
  getProtocolData,
  OracleSource,
  TokenType,
} from "./constants";
import { Comet as CometTemplate } from "../../../generated/templates";
import { createDeposit } from "../../../src/utils/creator";

///////////////////////////////
///// Configurator Events /////
///////////////////////////////

//
//
// market creation
export function handleCometDeployed(event: CometDeployed): void {
  CometTemplate.create(event.params.cometProxy);

  const marketID = event.params.newComet;
  const protocol = getOrCreateLendingProtocol(getProtocolData());
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
// Supplying the base token
export function handleSupply(event: Supply): void {
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const market = getOrCreateMarket(
    event,
    event.address,
    Address.fromString(CONFIGURATOR_ADDRESS)
  );
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const amount = event.params.amount;
  // TODO update base token price

  const deposit = createDeposit(
    event,
    event.address,
    tryBaseToken.value,
    accountID,
    amount,
    BIGDECIMAL_ZERO
  );
  deposit.accountActor = accountActorID;
  deposit.save();
}

export function handleSupplyCollateral(event: SupplyCollateral): void {
  log.warning("test", []);
}
