import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Vault, VaultFee } from "../../generated/schema";
import { SettVault } from "../../generated/templates";
import { BadgerController } from "../../generated/VaultRegistry/BadgerController";
import { BadgerSett } from "../../generated/VaultRegistry/BadgerSett";
import { BadgerStrategy } from "../../generated/VaultRegistry/BadgerStrategy";
import { NewVault } from "../../generated/VaultRegistry/VaultRegistry";
import {
  BIGDECIMAL_HUNDRED,
  DEFAULT_PERFORMANCE_FEE,
  DEFAULT_WITHDRAWAL_FEE,
  NULL_ADDRESS,
  VaultFeeType,
} from "../constant";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateVault } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { getPriceOfStakedTokens } from "./price";
import { createToken } from "./tokens";

export function handleNewVault(event: NewVault): void {
  initializeVault(event.params.vault, event.block);

  // starting template indexing
  SettVault.create(event.params.vault);
}

/**
 * creates aya new vault if it doesnt exists, initializes all the static values
 * called when a new vault event is emitted or when transfer is called on
 * transfer event of any sett token
 */
export function initializeVault(address: Address, block: ethereum.Block): Vault {
  let vault = Vault.load(address.toHex());
  log.debug("[BADGER] found vault: {}", [address.toHex()]);

  // existing vault
  if (vault) {
    return vault;
  }

  vault = getOrCreateVault(address, block);
  log.debug("[BADGER] handling new vault: {}", [address.toHex()]);
  let sett = BadgerSett.bind(address);
  let name = readValue<string>(sett.try_name(), "");

  // checking if it is a sett/vault
  if (name.length > 0) {
    let tokenAddress = readValue<Address>(sett.try_token(), NULL_ADDRESS);
    let token = createToken(tokenAddress);

    log.debug("[BADGER] Vault found: {} Input Token: {}", [address.toHex(), tokenAddress.toHex()]);

    vault.protocol = getOrCreateProtocol().id;
    vault.inputTokens = vault.inputTokens.concat([token.id]);
    vault.inputTokenBalances = vault.inputTokenBalances.concat([BigInt.zero()]);
    vault.outputToken = getOrCreateToken(address).id;
    vault.depositLimit = readValue<BigInt>(sett.try_max(), BigInt.zero());
    vault.outputTokenSupply = readValue<BigInt>(sett.try_totalSupply(), BigInt.zero());
    vault.outputTokenPriceUSD = getPriceOfStakedTokens(
      address,
      tokenAddress,
      BigInt.fromI32(token.decimals),
    ).toBigDecimal();
    vault.name = name;
    vault.symbol = token.symbol;
    vault.fees = getFees(sett, tokenAddress).map<string>(fee => fee.id);
    vault.rewardTokens = getRewards(sett);
    vault.save();
  } else {
    log.debug("[BADGER] Not a vault: {} ...skipping", [address.toHex()]);
  }

  return vault;
}

/**
 * tries to get fees from sett -> controller -> strategy
 * events of fees could be handled : TODO
 */
function getFees(sett: BadgerSett, token: Address): VaultFee[] {
  let fees: VaultFee[] = [];

  log.debug("[BADGER] getting fees", []);
  let controller = readValue<Address>(sett.try_controller(), NULL_ADDRESS);
  if (controller.equals(NULL_ADDRESS)) {
    return [];
  }

  log.debug("[BADGER] controller found {}", [controller.toHex()]);
  let controllerContract = BadgerController.bind(controller);
  let strategy = readValue<Address>(controllerContract.try_strategies(token), NULL_ADDRESS);
  if (strategy.equals(NULL_ADDRESS)) {
    return [];
  }

  log.debug("[BADGER] strategy found {}", [strategy.toHex()]);
  let strategyContract = BadgerStrategy.bind(strategy);
  let withdrawFee = getVaultFee(
    strategy
      .toHex()
      .concat("-")
      .concat("withdraw"),
    strategyContract.try_withdrawalFee(),
    DEFAULT_WITHDRAWAL_FEE,
    VaultFeeType.WITHDRAWAL_FEE,
  );
  let performanceFee = getVaultFee(
    strategy
      .toHex()
      .concat("-")
      .concat("performance"),
    strategyContract.try_performanceFeeGovernance(),
    DEFAULT_PERFORMANCE_FEE,
    VaultFeeType.PERFORMANCE_FEE,
  );

  fees.push(withdrawFee);
  fees.push(performanceFee);

  return fees;
}

function getVaultFee(id: string, try_fee: ethereum.CallResult<BigInt>, defFee: BigInt, feeType: string): VaultFee {
  let vaultFee = new VaultFee(id);

  let feePercentage = readValue<BigInt>(try_fee, defFee)
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);

  vaultFee.feePercentage = feePercentage;
  vaultFee.feeType = feeType;
  vaultFee.save();

  return vaultFee;
}

function getRewards(sett: BadgerSett): string[] {
  let controller = readValue<Address>(sett.try_controller(), NULL_ADDRESS);
  if (controller.equals(NULL_ADDRESS)) {
    return [];
  }

  let controllerContract = BadgerController.bind(controller);
  let reward = readValue<Address>(controllerContract.try_rewards(), NULL_ADDRESS);

  if (NULL_ADDRESS) {
    return [];
  }

  return [reward.toHex()];
}
