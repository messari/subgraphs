import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { Vault, VaultFee } from '../../generated/schema';
import { SettVault } from '../../generated/templates';
import { BadgerController } from '../../generated/templates/SettVault/BadgerController';
import { BadgerStrategy } from '../../generated/templates/SettVault/BadgerStrategy';
import { BadgerSett } from '../../generated/VaultRegistry/BadgerSett';
import { NewVault } from '../../generated/VaultRegistry/VaultRegistry';
import { DEFAULT_DECIMALS, NULL_ADDRESS } from '../constant';
import { getOrCreateProtocol } from '../entities/Protocol';
import { getOrCreateToken } from '../entities/Token';
import { getOrCreateVault } from '../entities/Vault';
import { readValue } from '../utils/contracts';

export function handleNewVault(event: NewVault): void {
  const address = event.params.vault;
  let vault = Vault.load(address.toHex());

  if (vault === null) {
    let sett = BadgerSett.bind(address);
    let name = readValue<string>(sett.try_name(), '');

    // checking if it is a sett/vault
    if (name.length > 0) {
      let tokenAddress = readValue<Address>(sett.try_token(), NULL_ADDRESS);
      let token = getOrCreateToken(tokenAddress);

      token.name = name;
      token.symbol = readValue<string>(sett.try_name(), '');
      token.decimals = readValue<i32>(sett.try_decimals(), DEFAULT_DECIMALS);
      token.save();

      vault = getOrCreateVault(address, event.block);
      vault.protocol = getOrCreateProtocol().id;
      vault.inputTokens = vault.inputTokens.concat([token.id]);
      vault.outputToken = getOrCreateToken(address).id;
      vault.depositLimit = readValue<BigInt>(sett.try_max(), BigInt.zero());
      vault.outputTokenSupply = readValue<BigInt>(
        sett.try_totalSupply(),
        BigInt.zero(),
      ).toBigDecimal();
      vault.outputTokenPriceUSD = BigDecimal.zero(); // TODO: calc
      vault.name = name;
      vault.symbol = token.symbol;
      vault.fees = getFees(sett, tokenAddress).map<string>(fee => fee.id);
      vault.save();

      // starting template indexing
      SettVault.create(address);
    }
  }
}

function getFees(sett: BadgerSett, token: Address): VaultFee[] {
  let fees: VaultFee[] = [];

  let controller = readValue<Address>(sett.try_controller(), NULL_ADDRESS);
  if (controller.equals(NULL_ADDRESS)) {
    return [];
  }

  let controllerContract = BadgerController.bind(controller);
  let strategy = readValue<Address>(
    controllerContract.try_strategies(token),
    NULL_ADDRESS,
  );
  if (strategy.equals(NULL_ADDRESS)) {
    return [];
  }

  let strategyContract = BadgerStrategy.bind(strategy);
  let withDrawFee = new VaultFee(
    strategy
      .toHex()
      .concat('-')
      .concat('withdraw'),
  );
  withDrawFee.feeType = 'WITHDRAWAL_FEE';
  withDrawFee.feePercentage = readValue<BigInt>(
    strategyContract.try_withdrawalFee(),
    BigInt.zero(),
  ).toBigDecimal();
  fees.push(withDrawFee);

  let performanceFee = new VaultFee(
    strategy
      .toHex()
      .concat('-')
      .concat('performance'),
  );
  performanceFee.feeType = 'PERFORMANCE_FEE';
  performanceFee.feePercentage = readValue<BigInt>(
    strategyContract.try_performanceFeeGovernance(),
    BigInt.zero(),
  ).toBigDecimal();
  fees.push(performanceFee);

  return fees;
}
