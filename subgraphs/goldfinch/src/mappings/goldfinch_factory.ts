import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  RoleGranted,
  PoolCreated,
  GoldfinchFactory,
  CallableLoanCreated,
} from "../../generated/GoldfinchFactory/GoldfinchFactory";
import { MigratedTranchedPool as MigratedTranchedPoolContract } from "../../generated/GoldfinchFactory/MigratedTranchedPool";
import { GoldfinchConfig } from "../../generated/GoldfinchConfig/GoldfinchConfig";
import { getOrInitTranchedPool } from "../entities/tranched_pool";
import {
  TranchedPool as TranchedPoolTemplate,
  CallableLoan as CallableLoanTemplate,
} from "../../generated/templates";
import { TranchedPool as TranchedPoolContract } from "../../generated/templates/TranchedPool/TranchedPool";
import { Account } from "../../generated/schema";
import {
  CONFIG_KEYS_ADDRESSES,
  FIDU_ADDRESS,
  INT_ONE,
  INVALID_POOLS,
  SENIOR_POOL_ADDRESS,
} from "../common/constants";
import {
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateAccount,
  getOrCreateToken,
} from "../common/getters";
import { initCallableLoan } from "./callable_loan/helpers";

export function handleRoleGranted(event: RoleGranted): void {
  // Init GoldfinchConfig and SeniorPool template when GoldfinchFactory grants OWNER_ROLE (initialize())
  const contract = GoldfinchFactory.bind(event.address);
  const OWNER_ROLE = contract.OWNER_ROLE();
  // OWNER_ROLE is granted in _setRoleAdmin() inside initialize()
  // which sets config to the GoldfinchConfig argument
  if (event.params.role == OWNER_ROLE) {
    getOrCreateProtocol();

    // senior pool is a market lender can deposit
    const market = getOrCreateMarket(SENIOR_POOL_ADDRESS, event);
    const FiduToken = getOrCreateToken(Address.fromString(FIDU_ADDRESS));
    market.outputToken = FiduToken.id;
    market.save();
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
  market._isMigratedTranchedPool = isMigratedTranchedPool(event) as boolean;
  market.save();

  let account = Account.load(borrowerAddr);
  if (!account) {
    account = getOrCreateAccount(borrowerAddr);
    protocol.cumulativeUniqueUsers += INT_ONE;
    protocol.cumulativeUniqueBorrowers += INT_ONE;
  }

  protocol.totalPoolCount += INT_ONE;
  protocol.save();

  TranchedPoolTemplate.create(event.params.pool);

  getOrInitTranchedPool(event.params.pool, event.block.timestamp);
}

export function handleCallableLoanCreated(event: CallableLoanCreated): void {
  CallableLoanTemplate.create(event.params.loan);
  const callableLoan = initCallableLoan(event.params.loan, event.block);
  callableLoan.save();

  const protocol = getOrCreateProtocol();
  const marketIDs = protocol._marketIDs ? protocol._marketIDs! : [];
  marketIDs.push(event.params.loan.toHexString());
  protocol._marketIDs = marketIDs;
  protocol.save();
}

function isMigratedTranchedPool(event: PoolCreated): bool {
  const contract = MigratedTranchedPoolContract.bind(event.params.pool);
  const migratedResult = contract.try_migrated();
  if (!migratedResult.reverted && migratedResult.value) {
    log.info("[isMigratedTranchedPool]pool {} is a migrated tranched pool", [
      event.params.pool.toHexString(),
    ]);
    return true;
  }
  return false;
}
