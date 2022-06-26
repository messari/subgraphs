import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Vault, VaultFee, _UnderlyingToken } from "../../../generated/schema";
import { ArrakisVaultV1 as VaultV1Contract } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import { BIGINT_MAX, BIGINT_ZERO } from "../../common/constants";
import { getOrCreateToken } from "../../common/getters";

export function getOrCreateVault(
  vaultAddress: Address,
  block: ethereum.Block
): Vault {
  let vaultId = vaultAddress.toHex();
  let vault = Vault.load(vaultId);
  if (!vault) {
    let vaultContract = VaultV1Contract.bind(vaultAddress);

    // Create relevant tokens
    getOrCreateUnderlyingToken(vaultAddress);
    getOrCreateToken(vaultAddress);

    vault = new Vault(vaultId);
    vault.protocol = "";
    vault.name = vaultContract.name();
    vault.symbol = vaultContract.symbol();
    vault.inputToken = vaultId;
    vault.outputToken = vaultId;
    vault.rewardTokens = null;
    vault.depositLimit = BIGINT_MAX;
    vault.createdTimestamp = block.timestamp;
    vault.createdBlockNumber = block.number;
    vault.totalValueLockedUSD = BigDecimal.zero();
    vault.inputTokenBalance = BIGINT_ZERO;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.outputTokenPriceUSD = BigDecimal.zero();
    vault.pricePerShare = null;
    vault.stakedOutputTokenAmount = null;
    vault.rewardTokenEmissionsAmount = null;
    vault.rewardTokenEmissionsUSD = null;

    // let vaultPerformanceFee = createVaultFee(
    //   VaultFeeType.PERFORMANCE_FEE,
    //   PROTOCOL_PERFORMANCE_FEE,
    //   vaultId
    // );
    // vault.fees = [vaultPerformanceFee.id];
    // vault.save();
  }
  return vault;
}

export function getOrCreateUnderlyingToken(
  vaultAddress: Address
): _UnderlyingToken {
  const vaultId = vaultAddress.toHex();
  let underlyingToken = _UnderlyingToken.load(vaultId);
  if (!underlyingToken) {
    const vaultContract = VaultV1Contract.bind(vaultAddress);

    const token0Address = vaultContract.token0();
    const token1Address = vaultContract.token1();
    const tokenBalances = vaultContract.getUnderlyingBalances();

    getOrCreateToken(token0Address);
    getOrCreateToken(token1Address);

    underlyingToken = new _UnderlyingToken(vaultId);
    underlyingToken.token0 = token0Address.toHex();
    underlyingToken.lastAmount0 = tokenBalances.value0;
    underlyingToken.token1 = token1Address.toHex();
    underlyingToken.lastAmount1 = tokenBalances.value1;
    underlyingToken.lastAmountBlockNumber = BIGINT_ZERO;
    underlyingToken.save();
  }
  return underlyingToken;
}

export function createVaultFee(
  feeType: string,
  feePercentage: BigDecimal,
  vaultId: string
): VaultFee {
  let vaultFee = new VaultFee(feeType.concat("-").concat(vaultId));
  vaultFee.feePercentage = feePercentage;
  vaultFee.feeType = feeType;
  vaultFee.save();

  return vaultFee;
}