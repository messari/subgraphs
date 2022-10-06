import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  RoleGranted,
  PoolCreated,
  GoldfinchFactory,
} from "../generated/GoldfinchFactory/GoldfinchFactory";
import { CreditLine as CreditLineContract } from "../generated/GoldfinchFactory/CreditLine";
import {
  GoldfinchConfig,
  GoListed,
  NoListed,
} from "../generated/GoldfinchConfig/GoldfinchConfig";
import {
  GoldfinchConfig as GoldfinchConfigTemplate,
  SeniorPool as SeniorPoolTemplate,
  TranchedPool as TranchedPoolTemplate,
} from "../generated/templates";
import {
  User,
  Account,
  LendingProtocol,
  CreditLine,
} from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  CONFIG_KEYS_ADDRESSES,
  FACTORY_ADDRESS,
  FIDU_ADDRESS,
  INT_ONE,
  INT_ZERO,
  LendingType,
  Network,
  ProtocolType,
  RewardTokenType,
  RiskType,
} from "./common/constants";
import {
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateAccount,
  getOrCreateUser,
  getOrCreateRewardToken,
} from "./common/getters";
import { TranchedPool } from "../generated/templates/TranchedPool/TranchedPool";
import { getOrInitSeniorPool } from "./entities/senior_pool";

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
    // TODO: needed?
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

    //getOrInitSeniorPool(seniorPoolAddress);

    // senior pool is a market lender can deposit
    const market = getOrCreateMarket(seniorPoolAddress.toHexString(), event);
    market.outputToken = FIDU_ADDRESS;
    market.rewardTokens = [rewardToken.id];
    market.save();

    SeniorPoolTemplate.create(seniorPoolAddress);
  }
}

export function handlePoolCreated(event: PoolCreated): void {
  // init TranchedPool tempate
  const poolAddress = event.params.pool;
  const protocol = getOrCreateProtocol();
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

  const market = getOrCreateMarket(poolAddress.toHexString(), event);
  market.rewardTokens = [rewardToken.id];

  // CreditLineCreated event is not avaiable in deployed smartcontract
  // Call the contract function instead
  // TODO: tranchedPool Paused/Locked
  const poolContract = TranchedPool.bind(event.params.pool);
  const creditLineAddress = poolContract.creditLine();
  market._creditLine = creditLineAddress.toHexString();
  // TODO: what is the best way to handle creditLine.setLimit() call?
  const creditLineContract = CreditLineContract.bind(creditLineAddress);
  if (creditLineContract.currentLimit().gt(BIGINT_ONE)) {
    market.isActive = true;
    market.canBorrowFrom = true;
  }
  market.save();
  TranchedPoolTemplate.create(poolAddress);
}

/////// DELETE //////////
// GoldfinchConfig address updated
export function handleAddressUpdated(event: AddressUpdated): void {
  // updating address of senior pool
  if (event.params.index.equals(BigInt.fromI32(15))) {
    GoldfinchConfigTemplate.create(event.params.newValue);
  }
}

export function handleGoListed(event: GoListed): void {
  const userAddr = event.params.member.toHexString();
  getOrCreateUser(userAddr);
  getOrCreateAccount(userAddr);
}

export function handleNoListed(event: NoListed): void {
  const userAddr = event.params.member.toHexString();
  const user = getOrCreateUser(userAddr);
  //
  user.save();
  const account = getOrCreateAccount(userAddr);
  //
  account.save();
}
