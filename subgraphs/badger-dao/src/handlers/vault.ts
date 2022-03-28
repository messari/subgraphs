import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Vault, VaultFee } from "../../generated/schema";
import { SettVault } from "../../generated/templates";
import { BadgerController } from "../../generated/templates/SettVault/BadgerController";
import { BadgerStrategy } from "../../generated/templates/SettVault/BadgerStrategy";
import { BadgerSett } from "../../generated/VaultRegistry/BadgerSett";
import { NewVault } from "../../generated/VaultRegistry/VaultRegistry";
import { NULL_ADDRESS } from "../constant";
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
 * creates a new vault if it doesnt exists, initializes all the static values
 * called when a new vault event is emitted or when transfer is called on
 * transfer event of any sett token
 */
export function initializeVault(address: Address, block: ethereum.Block): Vault {
  let vault = Vault.load(address.toHex());

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
    vault.save();
  }

  return vault;
}

/**
 * tries to get fees from sett -> controlerr -> strategy
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
  let withDrawFee = new VaultFee(
    strategy
      .toHex()
      .concat("-")
      .concat("withdraw"),
  );
  withDrawFee.feeType = "WITHDRAWAL_FEE";
  withDrawFee.feePercentage = readValue<BigInt>(strategyContract.try_withdrawalFee(), BigInt.zero()).toBigDecimal();
  fees.push(withDrawFee);

  let performanceFee = new VaultFee(
    strategy
      .toHex()
      .concat("-")
      .concat("performance"),
  );
  performanceFee.feeType = "PERFORMANCE_FEE";
  performanceFee.feePercentage = readValue<BigInt>(
    strategyContract.try_performanceFeeGovernance(),
    BigInt.zero(),
  ).toBigDecimal();
  fees.push(performanceFee);

  return fees;
}
