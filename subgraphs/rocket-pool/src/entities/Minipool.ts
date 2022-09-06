import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Pool, Minipool } from "../../generated/schema";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreatePool } from "./pool";
import { getOrCreateToken } from "./token";
import { rocketNetworkFees } from "../../generated/rocketVault/rocketNetworkFees";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  RPL_ADDRESS,
  FEESENCODE,
  ONE_ETH_IN_WEI,
} from "../utils/constants";
import { getStorageAddress } from "../mappings/RocketPool";

export function getOrCreateMinipool(
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  miniPoolAddress: string
): Minipool {
  let protocol = getOrCreateProtocol();
  let pool = getOrCreatePool(blockNumber, blockTimestamp);
  let minipool = Minipool.load(miniPoolAddress);

  if (!minipool) {
    minipool = new Minipool(miniPoolAddress);

    // Metadata
    minipool.name = protocol.id;
    minipool.symbol = "MINIPOOL";
    minipool.protocol = protocol.id;
    minipool.createdTimestamp = blockTimestamp;
    minipool.createdBlockNumber = blockNumber;

    // Tokens
    minipool.inputTokens = [
      getOrCreateToken(Address.fromString(ETH_ADDRESS), blockNumber).id,
    ];
    minipool.outputToken = getOrCreateToken(
      Address.fromString(protocol.id),
      blockNumber
    ).id;
    minipool.rewardTokens = [
      getOrCreateToken(Address.fromString(RPL_ADDRESS), blockNumber).id,
    ];

    // Quantitative Revenue Data
    minipool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    minipool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    minipool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    // Quantitative Token Data
    minipool.inputTokenBalances = [BIGINT_ZERO];
    minipool.slashAmount = BIGINT_ZERO;
    let comissionRate = BIGDECIMAL_ZERO;
    const rocketPoolFee = getStorageAddress(FEESENCODE);

    let rocketPoolFeesContract = rocketNetworkFees.bind(rocketPoolFee);

    let comission = rocketPoolFeesContract.try_getNodeFee();

    if (comission.reverted) {
      log.error("getNodeFee call reverted", []);
    } else {
      comissionRate = bigIntToBigDecimal(comission.value).div(
        bigIntToBigDecimal(ONE_ETH_IN_WEI)
      );
    }
    minipool.comissionRate = comissionRate;

    minipool.save();

    // Update Protocol
    protocol.totalPoolCount += 1;
    protocol.save();

    let pools = pool.miniPools;

    if (pools) {
      pools.push(miniPoolAddress);
    }
    pool.miniPools = pools;
    pool.save();
  }

  return minipool;
}
