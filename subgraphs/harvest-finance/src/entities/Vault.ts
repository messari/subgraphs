import { Address, BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/ControllerListener/Vault";
import { Vault, Token, YieldAggregator } from "../../generated/schema";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";
import { getOrCreateProtocol } from "./Protocol";
import { getOrCreateToken } from "./Token";
import { VaultListener } from '../../generated/templates';
import * as constants from "./../constant";
import { getUsdPricePerToken } from "./../Prices";
import { updateVaultSnapshots, updateFinancialSnapshot } from './Metrics'
import { getOrCreateVaultFee } from './VaultFee'
import { CustomPriceType } from "../Prices/common/types";


export function getOrCreateVault(id: Address, block: ethereum.Block): Vault {
  let vault = Vault.load(id.toHex());
  let protocol = getOrCreateProtocol();

  if (vault) {
    return vault as Vault;
  }

  vault = new Vault(id.toHex());

  vault.protocol = protocol.id;
  vault.inputToken = "";
  vault.outputToken = "";
  vault.rewardTokens = [];
  vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
  //vault.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
  vault.inputTokenBalance = constants.BIGINT_ZERO;
  vault.outputTokenSupply = constants.BIGINT_ZERO;
  vault.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
  vault.pricePerShare = constants.BIGDECIMAL_ZERO;
  vault.rewardTokenEmissionsAmount = [];
  vault.rewardTokenEmissionsUSD = [];
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.name = "";
  vault.symbol = "";
  vault.depositLimit = constants.BIGINT_ZERO;
  vault.fees = [];
  vault.save();

  // storing vault ids
  //let vaultIds = protocol._vaultIds;
  //vaultIds.push(vault.id);

  //protocol._vaultIds = vaultIds;


  let vault_contract = VaultContract.bind(id);
  let underlying_addr_call = vault_contract.try_underlying();

  if (underlying_addr_call.reverted) {
    // this is a Uniswap vault
  } else {
    let underlying_token = getOrCreateToken(<Address> underlying_addr_call.value);
    let f_token = getOrCreateToken(id);

    vault.inputToken = underlying_token.id;
    vault.outputToken = f_token.id;
    vault.save();
  }

  getOrCreateVaultFee(vault);
  VaultListener.create(id);

  protocol.save();

  return vault as Vault;
}

export function updateVaultPrices(event: ethereum.Event, vault: Vault): void{

  let vaultAddress = Address.fromString(vault.id);
  let vault_contract = VaultContract.bind(vaultAddress);

  let inputTokenAddress = Address.fromString(vault.inputToken)
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  // exist because vault create it
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken.decimals as u8);

  vault.outputTokenSupply = readValue<BigInt>(vault_contract.try_totalSupply(), constants.BIGINT_ZERO);

  vault.pricePerShare = readValue<BigInt>(vault_contract.try_getPricePerFullShare(), constants.BIGINT_ZERO).toBigDecimal();
  vault.save();

  let protocol = getOrCreateProtocol();

  updateProtocolAndVaulTotalValueLockedUSD(event, protocol, vault, inputTokenDecimals, inputTokenPrice, inputToken);

  updateVaultSnapshots(event, vault);
  updateFinancialSnapshot(event);
}

function updateProtocolAndVaulTotalValueLockedUSD(event: ethereum.Event, protocol: YieldAggregator, vault: Vault,
  inputTokenDecimals: BigInt, inputTokenPrice: CustomPriceType, inputToken: Token
  ): void{
  let protocolTotalValueLockedUSD = protocol.totalValueLockedUSD;

  let lastPriceUSD = (<BigDecimal> inputTokenPrice.usdPrice).div(inputTokenPrice.decimals.toBigDecimal());
  let pricePerShare_nu = (<BigDecimal> vault.pricePerShare).div(inputTokenDecimals.toBigDecimal());
  let supply = vault.inputTokenBalance.toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());

  inputToken.lastPriceUSD = lastPriceUSD;
  inputToken.lastPriceBlockNumber = event.block.number;
  inputToken.save();

  protocol.totalValueLockedUSD = protocolTotalValueLockedUSD.minus(vault.totalValueLockedUSD);

  vault.totalValueLockedUSD = lastPriceUSD
    .times(pricePerShare_nu)
    .times(supply);
  vault.save();

  protocolTotalValueLockedUSD = protocol.totalValueLockedUSD;
  protocol.totalValueLockedUSD = protocolTotalValueLockedUSD.plus(vault.totalValueLockedUSD);
  protocol.save();

}
