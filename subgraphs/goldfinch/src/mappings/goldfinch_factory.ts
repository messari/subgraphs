import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  RoleGranted,
  PoolCreated,
  GoldfinchFactory,
} from "../../generated/GoldfinchFactory/GoldfinchFactory";
import { GoldfinchConfig } from "../../generated/GoldfinchConfig/GoldfinchConfig";
import { getOrInitTranchedPool } from "../entities/tranched_pool";
import { TranchedPool as TranchedPoolTemplate } from "../../generated/templates";
import { TranchedPool as TranchedPoolContract } from "../../generated/templates/TranchedPool/TranchedPool";
import { Account } from "../../generated/schema";
import {
  CONFIG_KEYS_ADDRESSES,
  FIDU_ADDRESS,
  GFI_ADDRESS,
  INT_ONE,
  INVALID_POOLS,
  RewardTokenType,
  SENIOR_POOL_ADDRESS,
} from "../common/constants";
import {
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateAccount,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";

export function handleRoleGranted(event: RoleGranted): void {
  // Init GoldfinchConfig and SeniorPool template when GoldfinchFactory grants OWNER_ROLE (initialize())
  const contract = GoldfinchFactory.bind(event.address);
  const OWNER_ROLE = contract.OWNER_ROLE();
  // OWNER_ROLE is granted in _setRoleAdmin() inside initialize()
  // which sets config to the GoldfinchConfig argument
  if (event.params.role == OWNER_ROLE) {
    getOrCreateProtocol();

    /*
    const configAddress = contract.config();
    log.info(
      "[handleRoleGranted]Init GoldfinchConfig template at {} by tx {}",
      [configAddress.toHexString(), event.transaction.hash.toHexString()]
    );
    //protocol._GoldfinchConfig = configAddress.toHexString();
    protocol.save();
    //GoldfinchConfigTemplate.create(configAddress);
    
    const configContract = GoldfinchConfig.bind(configAddress);
    */
    //Addresses enum defined in ConfigOptions.sol

    getOrCreateProtocol();
    const rewardToken = getOrCreateRewardToken(
      Address.fromString(GFI_ADDRESS),
      RewardTokenType.DEPOSIT
    );

    // senior pool is a market lender can deposit
    const market = getOrCreateMarket(SENIOR_POOL_ADDRESS, event);
    const FiduToken = getOrCreateToken(Address.fromString(FIDU_ADDRESS));
    market.outputToken = FiduToken.id;
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
  if (INVALID_POOLS.has(poolAddress.toHexString())) {
    log.warning(
      "[handlePoolCreated]pool {} is included in INVALID_POOLS; skipping",
      [poolAddress.toHexString()]
    );
    return;
  }

  const protocol = getOrCreateProtocol();
  const borrowerAddr = event.params.borrower.toHexString();
  const tranchedPoolContract = TranchedPoolContract.bind(poolAddress);
  const configContract = GoldfinchConfig.bind(tranchedPoolContract.config());
  const poolTokenAddr = configContract
    .getAddress(BigInt.fromI32(CONFIG_KEYS_ADDRESSES.PoolTokens))
    .toHexString();

  const market = getOrCreateMarket(poolAddress.toHexString(), event);
  market._borrower = borrowerAddr;
  market._creditLine = tranchedPoolContract.creditLine().toHexString();
  market._poolToken = poolTokenAddr;
  market.save();

  let account = Account.load(borrowerAddr);
  if (!account) {
    account = getOrCreateAccount(borrowerAddr);
    protocol.cumulativeUniqueUsers += INT_ONE;
    protocol.cumulativeUniqueBorrowers += INT_ONE;
  }
  protocol.totalPoolCount += INT_ONE;
  protocol.save();

  TranchedPoolTemplate.create(poolAddress);

  //
  TranchedPoolTemplate.create(event.params.pool);
  getOrInitTranchedPool(event.params.pool, event.block.timestamp);
}
