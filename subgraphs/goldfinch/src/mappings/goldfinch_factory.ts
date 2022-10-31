import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  RoleGranted,
  PoolCreated,
  GoldfinchFactory,
} from "../../generated/GoldfinchFactory/GoldfinchFactory";
import { CreditLine as CreditLineContract } from "../../generated/GoldfinchFactory/CreditLine";
import { GoldfinchConfig } from "../../generated/GoldfinchConfig/GoldfinchConfig";
import { getOrInitTranchedPool } from "../entities/tranched_pool";
import { TranchedPool as TranchedPoolTemplate } from "../../generated/templates";
import { Account } from "../../generated/schema";
import {
  BIGINT_ONE,
  CONFIG_KEYS_ADDRESSES,
  FIDU_ADDRESS,
  INT_ONE,
  RewardTokenType,
} from "../common/constants";
import {
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateAccount,
  getOrCreateRewardToken,
} from "../common/getters";
import { TranchedPool } from "../../generated/templates/TranchedPool/TranchedPool";

export function handleRoleGranted(event: RoleGranted): void {
  // Init GoldfinchConfig and SeniorPool template when GoldfinchFactory grants OWNER_ROLE (initialize())
  const contract = GoldfinchFactory.bind(event.address);
  const OWNER_ROLE = contract.OWNER_ROLE();
  // OWNER_ROLE is granted in _setRoleAdmin() inside initialize()
  // which sets config to the GoldfinchConfig argument
  if (event.params.role == OWNER_ROLE) {
    const protocol = getOrCreateProtocol();

    const configAddress = contract.config();
    log.info(
      "[handleRoleGranted]Init GoldfinchConfig template at {} by tx {}",
      [configAddress.toHexString(), event.transaction.hash.toHexString()]
    );
    protocol._GoldfinchConfig = configAddress.toHexString();
    protocol.save();
    //GoldfinchConfigTemplate.create(configAddress);

    const configContract = GoldfinchConfig.bind(configAddress);
    //Addresses enum defined in ConfigOptions.sol
    const seniorPoolAddress = configContract.getAddress(
      BigInt.fromI32(CONFIG_KEYS_ADDRESSES.SeniorPool)
    );
    const rewardTokenAddress = configContract.getAddress(
      BigInt.fromI32(CONFIG_KEYS_ADDRESSES.StakingRewards)
    );
    const rewardToken = getOrCreateRewardToken(
      rewardTokenAddress,
      RewardTokenType.DEPOSIT
    );
    log.info("[handleRoleGranted]Init SeniroPool template at {} by tx {}", [
      seniorPoolAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]);

    // senior pool is a market lender can deposit
    const market = getOrCreateMarket(seniorPoolAddress.toHexString(), event);
    market.outputToken = FIDU_ADDRESS;
    market.rewardTokens = [rewardToken.id];
    market.save();

    //SeniorPoolTemplate.create(seniorPoolAddress);

    //
    //getOrInitSeniorPool(seniorPoolAddress);
  }
}

export function handlePoolCreated(event: PoolCreated): void {
  // init TranchedPool tempate
  const poolAddress = event.params.pool;
  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(poolAddress.toHexString(), event);
  const borrowerAddr = event.params.borrower.toHexString();
  let account = Account.load(borrowerAddr);
  if (!account) {
    account = getOrCreateAccount(borrowerAddr);
    protocol.cumulativeUniqueUsers += INT_ONE;
    protocol.cumulativeUniqueBorrowers += INT_ONE;
  }
  protocol.totalPoolCount += INT_ONE;
  protocol.save();

  const configContract = GoldfinchConfig.bind(
    Address.fromString(protocol._GoldfinchConfig!)
  );
  const rewardTokenAddress = configContract.getAddress(
    BigInt.fromI32(CONFIG_KEYS_ADDRESSES.StakingRewards)
  );
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddress,
    RewardTokenType.DEPOSIT
  );

  market.rewardTokens = [rewardToken.id];

  market._poolToken = configContract
    .addresses(BigInt.fromI32(CONFIG_KEYS_ADDRESSES.PoolTokens))
    .toHexString();

  // CreditLineCreated event is not avaiable in deployed smartcontract
  // Call the contract function instead
  const poolContract = TranchedPool.bind(event.params.pool);
  const creditLineAddress = poolContract.creditLine();
  market._creditLine = creditLineAddress.toHexString();
  const creditLineContract = CreditLineContract.bind(creditLineAddress);
  if (creditLineContract.currentLimit().gt(BIGINT_ONE)) {
    market.isActive = true;
    market.canBorrowFrom = true;
  }
  market.save();
  TranchedPoolTemplate.create(poolAddress);

  //
  TranchedPoolTemplate.create(event.params.pool);
  getOrInitTranchedPool(event.params.pool, event.block.timestamp);
}
