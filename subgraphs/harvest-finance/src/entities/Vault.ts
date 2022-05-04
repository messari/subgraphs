import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/ControllerListener/Vault";
import { Vault, Token } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ZERO, BIGINT_ZERO, VaultFeeType } from "../constant";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";
import { getOrCreateProtocol } from "./Protocol";
import { getOrCreateToken } from "./Token";
import { VaultListener } from '../../generated/templates';

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
  vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  //vault.totalVolumeUSD = BIGDECIMAL_ZERO;
  vault.inputTokenBalance = BIGINT_ZERO;
  vault.outputTokenSupply = BIGINT_ZERO;
  vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  vault.rewardTokenEmissionsAmount = [];
  vault.rewardTokenEmissionsUSD = [];
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.name = "";
  vault.symbol = "";
  vault.depositLimit = BIGINT_ZERO;
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

  VaultListener.create(id);

  protocol.save();

  return vault as Vault;
}

/*
export function updateVaultFees(vault: Vault, strategyAddress: Address): void {
  const strategyContract = Strategy.bind(strategyAddress);
  let numer = readValue<BigInt>(strategyContract.try_withdrawFeeNumer(), BIGINT_ZERO);
  let denom = readValue<BigInt>(strategyContract.try_withdrawFeeDenom(), BIGINT_ZERO);

  let feePercentage = denom.isZero()
    ? BIGDECIMAL_ZERO
    : numer
        .toBigDecimal()
        .times(BIGDECIMAL_HUNDRED)
        .div(denom.toBigDecimal());

  let withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE)
    .concat(strategyAddress.toHex().toLowerCase())
    .concat("-")
    .concat(vault.id);

  createFeeType(withdrawFeeId, VaultFeeType.WITHDRAWAL_FEE, feePercentage);

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  numer = readValue<BigInt>(vaultContract.try_entranceFeeNumer(), BIGINT_ZERO);
  denom = readValue<BigInt>(vaultContract.try_entranceFeeDenom(), BIGINT_ZERO);

  feePercentage = denom.isZero()
    ? BIGDECIMAL_ZERO
    : numer
        .toBigDecimal()
        .times(BIGDECIMAL_HUNDRED)
        .div(denom.toBigDecimal());

  let depositFeeId = enumToPrefix(VaultFeeType.DEPOSIT_FEE)
    .concat(strategyAddress.toHex().toLowerCase())
    .concat("-")
    .concat(vault.id);

  createFeeType(depositFeeId, VaultFeeType.DEPOSIT_FEE, feePercentage);
}

*/
