import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts';
import { RewardToken, Token, VaultDailySnapshot } from '../../generated/schema';
import { ERC20 } from '../../generated/templates/SettVault/ERC20';
import { BadgerSett, Transfer } from '../../generated/VaultRegistry/BadgerSett';
import { DEFAULT_DECIMALS, NULL_ADDRESS } from '../constant';
import { getOrCreateVaultDailySnapshot } from '../entities/Metrics';
import { getOrCreateProtocol } from '../entities/Protocol';
import { getOrCreateReward, getOrCreateToken } from '../entities/Token';
import { getOrCreateDeposit, getOrCreateWithdraw } from '../entities/Transaction';
import { getOrCreateUser } from '../entities/User';
import { getOrCreateVault } from '../entities/Vault';
import { readValue } from '../utils/contracts';
import { getDay, normalizedUsdcPrice } from '../utils/numbers';
import {
  updateFinancialMetrics,
  updateUsageMetrics,
  updateVault,
  updateVaultMetrics,
} from './common';
import { getPriceOfCurveLpToken } from './price';
import { initializeVault } from './vault';

export function handleTransfer(event: Transfer): void {
  //note: sett address : event.address
  log.debug('[BADGER] handling vault token transfer: {}', [event.address.toHex()]);

  let vault = initializeVault(event.address, event.block);
  let vaultMetrics = createVaultSnapshot(event.address, event.block);
  let protocol = getOrCreateProtocol();
  let isDeposit = false;
  let inputTokenAmount = event.params.value;

  let sett = BadgerSett.bind(event.address);
  let tokenAddress = readValue<Address>(sett.try_token(), NULL_ADDRESS);
  if (tokenAddress.equals(NULL_ADDRESS)) {
    log.debug('[BADGER] vault had no token: {}', [event.address.toHex()]);
    return;
  }

  let token = createToken(tokenAddress);
  let tokenPriceUSD = normalizedUsdcPrice(
    getPriceOfCurveLpToken(
      tokenAddress,
      event.params.value,
      BigInt.fromI32(token.decimals),
    ),
  );

  // deposit
  if (event.params.from.equals(NULL_ADDRESS)) {
    isDeposit = true;
    log.debug('[BADGER] Deposit found for token : {}', [tokenAddress.toHex()]);
    let user = getOrCreateUser(event.params.to);
    let deposit = getOrCreateDeposit(event.transaction.hash, event.logIndex);

    deposit.asset = token.id;
    deposit.protocol = protocol.id;
    deposit.to = vault.id;
    deposit.from = user.id;
    deposit.vault = vault.id;
    deposit.amount = inputTokenAmount;
    deposit.amountUSD = tokenPriceUSD.toBigDecimal();
    deposit.save();

    updateUsageMetrics(user, event.block);
  }

  // withdrawal
  if (event.params.to.equals(NULL_ADDRESS)) {
    log.debug('[BADGER] Withdraw found for token : {}', [tokenAddress.toHex()]);
    let user = getOrCreateUser(event.params.from);
    let withdrawal = getOrCreateWithdraw(event.transaction.hash, event.logIndex);

    withdrawal.asset = token.id;
    withdrawal.protocol = protocol.id;
    withdrawal.to = user.id;
    withdrawal.from = vault.id;
    withdrawal.vault = vault.id;
    withdrawal.amount = inputTokenAmount;
    withdrawal.amountUSD = tokenPriceUSD.toBigDecimal();
    withdrawal.save();

    updateUsageMetrics(user, event.block);
  }

  // TODO: 3rd condition, normal transfer, mange financial
  updateVault(vault, token, inputTokenAmount, tokenPriceUSD);
  updateVaultMetrics(
    vault,
    token,
    vaultMetrics,
    inputTokenAmount,
    tokenPriceUSD,
    isDeposit,
    event.block,
  );
  updateFinancialMetrics(protocol, token, tokenPriceUSD, inputTokenAmount, event.block);
}

export function handleReward(event: Transfer): void {
  let token = RewardToken.load(event.address.toHex());

  if (!token) {
    let contract = ERC20.bind(event.address);

    token = getOrCreateReward(event.address);
    token.name = readValue<string>(contract.try_name(), '');
    token.symbol = readValue<string>(contract.try_symbol(), '');
    token.decimals = readValue<i32>(contract.try_decimals(), DEFAULT_DECIMALS);

    token.save();
  }
}

export function createToken(address: Address): Token {
  let token = getOrCreateToken(address);

  if (token.name.length > 0) {
    return token;
  }

  let contract = ERC20.bind(address);
  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), DEFAULT_DECIMALS);

  token.save();
  return token;
}

function createVaultSnapshot(vault: Address, block: ethereum.Block): VaultDailySnapshot {
  let sett = getOrCreateVault(vault, block);
  let vaultMetrics = getOrCreateVaultDailySnapshot(vault, getDay(block.timestamp));

  vaultMetrics.outputTokenPriceUSD = sett.outputTokenPriceUSD;
  vaultMetrics.outputTokenSupply = sett.outputTokenSupply;
  vaultMetrics.save();

  return vaultMetrics;
}
