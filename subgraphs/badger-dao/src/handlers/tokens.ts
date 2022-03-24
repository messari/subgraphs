import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { RewardToken, Token, VaultDailySnapshot } from '../../generated/schema';
import { ERC20 } from '../../generated/templates/SettVault/ERC20';
import { BadgerSett, Transfer } from '../../generated/VaultRegistry/BadgerSett';
import { DEFAULT_DECIMALS, NULL_ADDRESS } from '../constant';
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateVaultDailySnapshot,
} from '../entities/Metrics';
import { getOrCreateProtocol } from '../entities/Protocol';
import { getOrCreateReward, getOrCreateToken } from '../entities/Token';
import { getOrCreateDeposit, getOrCreateWithdraw } from '../entities/Transaction';
import { getOrCreateUser } from '../entities/User';
import { getOrCreateVault } from '../entities/Vault';
import { readValue } from '../utils/contracts';
import { getDay } from '../utils/numbers';
import { updateFinancialMetrics, updateUsageMetrics, updateVaultMetrics } from './common';

export function handleSettTransfer(event: Transfer): void {
  //note: sett address : event.address
  log.debug('[BADGER] handling vault transfer: {}', [event.address.toHex()]);

  let vault = getOrCreateVault(event.address, event.block);
  let protocol = getOrCreateProtocol();

  let sett = BadgerSett.bind(event.address);
  let tokenAddress = readValue<Address>(sett.try_token(), NULL_ADDRESS);
  if (tokenAddress.equals(NULL_ADDRESS)) {
    log.debug('[BADGER] vault had no token: {}', [event.address.toHex()]);
    return;
  }

  let token = createToken(tokenAddress);
  let vaultMetrics = createVaultSnapshot(event.address, event.block.timestamp);

  // deposit
  if (event.params.from.equals(NULL_ADDRESS)) {
    log.debug('[BADGER] Deposit found for token : {}', [tokenAddress.toHex()]);
    let user = getOrCreateUser(event.params.to);
    let deposit = getOrCreateDeposit(event.transaction.hash, event.logIndex);

    deposit.asset = token.id;
    deposit.protocol = protocol.id;
    deposit.to = vault.id;
    deposit.from = user.id;
    deposit.vault = vault.id;
    deposit.amount = event.params.value;
    deposit.amountUSD = BigDecimal.zero(); // TODO: calc
    deposit.save();

    updateUsageMetrics(user, event.block);
    updateVaultMetrics(vaultMetrics, event.params.value, true, event.block);
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
    withdrawal.amount = event.params.value;
    withdrawal.amountUSD = BigDecimal.zero(); // TODO: calc
    withdrawal.save();

    updateUsageMetrics(user, event.block);
    updateVaultMetrics(vaultMetrics, event.params.value, false, event.block);
  }

  // TODO: 3rd condition, normal transfer, mange financial
  let financialMetric = getOrCreateFinancialsDailySnapshot(getDay(event.block.timestamp));
  updateFinancialMetrics(financialMetric, protocol, event.block);
}

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex());

  if (!token) {
    createToken(event.address);
  }
}

export function handleReward(event: Transfer): void {
  let token = RewardToken.load(event.address.toHex());

  if (!token) {
    token = createRewardToken(event.address);
  }
}

function createToken(address: Address): Token {
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

function createRewardToken(address: Address): RewardToken {
  let token = getOrCreateReward(address);

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

function createVaultSnapshot(vault: Address, timestamp: BigInt): VaultDailySnapshot {
  let vaultMetrics = getOrCreateVaultDailySnapshot(vault, getDay(timestamp));

  if (vaultMetrics.outputTokenSupply.equals(BigInt.zero())) {
    let sett = BadgerSett.bind(vault);
    vaultMetrics.outputTokenSupply = readValue<BigInt>(
      sett.try_totalSupply(),
      BigInt.zero(),
    );
  }

  return vaultMetrics;
}
