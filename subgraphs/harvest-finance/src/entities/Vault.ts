import { Address, BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/ControllerListener/Vault";
import { UniswapPair as UniswapPairContract } from "../../generated/ControllerListener/UniswapPair";
import { ERC20} from "../../generated/ControllerListener/ERC20";
import { Vault, Token, YieldAggregator } from "../../generated/schema";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";
import { getOrCreateProtocol } from "./Protocol";
import { getOrCreateToken } from "./Token";
import { VaultListener } from '../../generated/templates';
import * as constants from "./../constant";
import { getUsdPrice } from "./../Prices";
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
  let symbol = vault_contract.symbol();

  if (!underlying_addr_call.reverted) {
    let underlying_token = getOrCreateToken(<Address> underlying_addr_call.value);
    let f_token = getOrCreateToken(id);

    vault.inputToken = underlying_token.id;
    vault.outputToken = f_token.id;
    vault.save();
    
    if(symbol == 'fUNI-V2'){
      let pair_contract = UniswapPairContract.bind(<Address> underlying_addr_call.value);
      let token0_addr = pair_contract.token0();
      let token1_addr = pair_contract.token1();

      let token0_contract = ERC20.bind(token0_addr);
      let token0_symbol = token0_contract.symbol();

      let token1_contract = ERC20.bind(token1_addr);
      let token1_symbol = token1_contract.symbol();

      underlying_token.name = underlying_token.name + ' ' + token0_symbol + '-' + token1_symbol;
      f_token.name = f_token.name + ' ' + token0_symbol + '-' + token1_symbol;

      underlying_token.save();
      f_token.save();

    }

    vault.name = protocol.name + ' - ' + underlying_token.name;

  }

  let vaultFee = getOrCreateVaultFee(vault, block);
  let fees = vault.fees;
  fees.push(vaultFee.id);
  vault.fees = fees;
  vault.save();

  VaultListener.create(id);

  protocol.save();

  return vault as Vault;
}

export function updateVaultPrices(event: ethereum.Event, vault: Vault): void{

  let vaultAddress = Address.fromString(vault.id);
  let vault_contract = VaultContract.bind(vaultAddress);

  let inputTokenAddress = Address.fromString(vault.inputToken)
  // exist because vault create it
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken.decimals as u8);

  vault.outputTokenSupply = readValue<BigInt>(vault_contract.try_totalSupply(), constants.BIGINT_ZERO);

  vault.pricePerShare = readValue<BigInt>(vault_contract.try_getPricePerFullShare(), constants.BIGINT_ZERO).toBigDecimal();
  vault.save();

  let protocol = getOrCreateProtocol();

  updateProtocolAndVaulTotalValueLockedUSD(event, protocol, vault, inputTokenDecimals, inputTokenAddress, inputToken);

  updateVaultSnapshots(event, vault);
  updateFinancialSnapshot(event);
}

function updateProtocolAndVaulTotalValueLockedUSD(event: ethereum.Event, protocol: YieldAggregator, vault: Vault,
  inputTokenDecimals: BigInt, inputTokenAddress: Address, inputToken: Token
  ): void{
  let protocolTotalValueLockedUSD = protocol.totalValueLockedUSD;

  let lastPriceUSD = getUsdPrice(inputTokenAddress, BigDecimal.fromString("1"));
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
