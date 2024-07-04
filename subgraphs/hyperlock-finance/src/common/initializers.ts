import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Pricer, TokenInit, readValue } from "../common/utils";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { _ThrusterPositionsNftHelper } from "../../generated/schema";
import { ThrusterV2 } from "../../generated/ERC20PointsDeposit/ThrusterV2";
import { ThrusterPointNFT } from "../../generated/ThrusterPointNFT/ThrusterPointNFT";

export function initializeSDKFromEvent(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromEvent(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    event
  );

  return sdk;
}

export function getOrCreateV2Pool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const poolContract = ThrusterV2.bind(poolAddress);
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    const token0 = sdk.Tokens.getOrCreateToken(
      readValue<Address>(poolContract.try_token0(), constants.NULL.TYPE_ADDRESS)
    );
    const token1 = sdk.Tokens.getOrCreateToken(
      readValue<Address>(poolContract.try_token1(), constants.NULL.TYPE_ADDRESS)
    );

    const poolName = token0.name.concat(" / ").concat(token1.name);
    const poolsymbol = token0.symbol.concat(" / ").concat(token1.symbol);

    pool.initialize(
      poolName,
      poolsymbol,
      [token0.id, token1.id, outputToken.id],
      outputToken
    );
  }

  return pool;
}

export function getOrCreateV3Pool(
  poolAddress: Address,
  tokenId: BigInt,
  sdk: SDK
): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    const positionsNft = getOrCreatePositionsNft(
      poolAddress,
      tokenId,
      sdk.Protocol.event.block
    );

    const token0 = sdk.Tokens.getOrCreateToken(
      Address.fromBytes(positionsNft.token0)
    );
    const token1 = sdk.Tokens.getOrCreateToken(
      Address.fromBytes(positionsNft.token1)
    );

    const poolName = token0.name.concat(" / ").concat(token1.name);
    const poolsymbol = token0.symbol.concat(" / ").concat(token1.symbol);

    pool.initialize(poolName, poolsymbol, [token0.id, token1.id], outputToken);
  }

  return pool;
}

export function getOrCreatePositionsNft(
  poolAddress: Address,
  tokenId: BigInt,
  block: ethereum.Block
): _ThrusterPositionsNftHelper {
  const id = poolAddress.concatI32(tokenId.toI32());
  let positionsNft = _ThrusterPositionsNftHelper.load(id);

  if (!positionsNft) {
    positionsNft = new _ThrusterPositionsNftHelper(id);

    const positionsNftContract = ThrusterPointNFT.bind(poolAddress);

    let token0 = constants.NULL.TYPE_ADDRESS;
    let token1 = constants.NULL.TYPE_ADDRESS;

    const positions = positionsNftContract.try_positions(tokenId);

    if (!positions.reverted) {
      token0 = positions.value.getToken0();
      token1 = positions.value.getToken1();
    }

    positionsNft.token0 = token0;
    positionsNft.token1 = token1;

    positionsNft.amount0 = constants.BIGINT_ZERO;
    positionsNft.amount1 = constants.BIGINT_ZERO;

    positionsNft.liquidity = constants.BIGINT_ZERO;

    positionsNft.lastUpdateBlockNumber = block.number;
    positionsNft.lastUpdateTimestamp = block.timestamp;

    positionsNft.save();
  }

  return positionsNft;
}
