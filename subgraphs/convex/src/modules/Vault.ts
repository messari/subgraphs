import { getTotalFees } from "./Fees";
import * as utils from "../common/utils";
import { getRewardTokens } from "./Tokens";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/Booster/ERC20";
import { getOrCreateToken } from "../common/initializer";
import { PoolCrvRewards } from "../../generated/templates";
import { Vault as VaultStore } from "../../generated/schema";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Address, DataSourceContext, log } from "@graphprotocol/graph-ts";

export function _NewVault(
  poolId: BigInt,
  lpTokenAddress: Address,
  gaugeAddress: Address,
  stashVersion: BigInt,
  block: ethereum.Block
): void {
  const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
    .concat("-")
    .concat(poolId.toString());
  const vault = new VaultStore(vaultId);

  const poolAddress = utils.getPool(lpTokenAddress);
  if (poolAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
    log.warning("Could not find pool for lp token {}", [
      lpTokenAddress.toHexString(),
    ]);
  }

  const inputToken = getOrCreateToken(lpTokenAddress);
  vault.inputToken = inputToken.id;
  vault.inputTokenBalance = constants.BIGINT_ZERO;

  const poolInfo = utils.getPoolInfoFromPoolId(poolId);
  if (poolInfo) {
    const outputToken = getOrCreateToken(poolInfo.token);
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = constants.BIGINT_ZERO;

    vault.pricePerShare = constants.BIGDECIMAL_ZERO;
    vault._crvRewards = poolInfo.crvRewards.toHexString();

    let rewardTokens = getRewardTokens(poolId, block, poolInfo.crvRewards);
    vault.rewardTokens = rewardTokens;

    vault.rewardTokenEmissionsAmount = new Array<BigInt>(
      rewardTokens.length
    ).fill(constants.BIGINT_ZERO);
    vault.rewardTokenEmissionsUSD = new Array<BigDecimal>(
      rewardTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    const context = new DataSourceContext();
    context.setString("poolId", poolId.toString());

    PoolCrvRewards.createWithContext(poolInfo.crvRewards, context);
  } else {
    log.warning("[AddPool]: PoolInfo Reverted, PoolId: {}, block: {}", [
      poolId.toString(),
      block.number.toString(),
    ]);
  }

  const lpTokenContract = ERC20.bind(lpTokenAddress);

  vault.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();
  vault.name = utils.readValue<string>(lpTokenContract.try_name(), "");
  vault.symbol = utils.readValue<string>(lpTokenContract.try_symbol(), "");

  vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  vault.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
  vault.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  vault.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;


  const performanceFeeId = utils
    .enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE)
    .concat(constants.CONVEX_BOOSTER_ADDRESS.toHexString());
  
  let performanceFee = getTotalFees();
  utils.createFeeType(
    performanceFeeId,
    constants.VaultFeeType.PERFORMANCE_FEE,
    performanceFee.totalFees().times(constants.BIGDECIMAL_HUNDRED)
  );

  vault._pool = poolAddress.toHexString();
  vault._gauge = gaugeAddress.toHexString();
  vault._stashVersion = stashVersion;
  vault._lpToken = lpTokenAddress.toHexString();

  vault.createdBlockNumber = block.number;
  vault.createdTimestamp = block.timestamp;

  vault.fees = [performanceFeeId];
  vault.save();
}
