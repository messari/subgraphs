import {
  Token,
  Account,
  Position as PositionSchema,
  LiquidityPool as LiquidityPoolSchema,
} from "../../../../generated/schema";
import { Pool } from "./pool";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import { Bytes } from "@graphprotocol/graph-ts";
import * as constants from "../../util/constants";

export class PositionManager {
  protocol: Perpetual;
  tokens: TokenManager;

  constructor(protocol: Perpetual, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadPosition(id: Bytes): Pool {
    let entity = LiquidityPoolSchema.load(id);
    if (entity) return new Pool(this.protocol, entity, this.tokens);

    entity = new LiquidityPoolSchema(id);
    entity.protocol = this.protocol.getBytesID();

    const pool = new Pool(this.protocol, entity, this.tokens);
    pool.isInitialized = false;
    return pool;
  }
}

export class Position {
  pool: Pool;
  protocol: Perpetual;
  position: PositionSchema;

  constructor(pool: Pool, protocol: Perpetual, position: PositionSchema) {
    this.pool = pool;
    this.protocol = protocol;
    this.position = position;
  }

  private save(): void {
    this.position.save();
  }

  initialize(
    account: Account,
    asset: Token,
    collateral: Token,
    positionSide: constants.PositionSide
  ): void {
    // " { Account address }-{ Market address }-{ Position Side }-{ Counter } "
    const positionId = Bytes.empty();
    let position = new PositionSchema(positionId);

    position.account = account.id;
    position.liquidityPool = this.pool.getBytesID();
    position.collateral = collateral.id;
    position.asset = asset.id;
    position.side = positionSide;
    position.fundingrateOpen = constants.BIGDECIMAL_ZERO;
    position.fundingrateClosed = constants.BIGDECIMAL_ZERO;
    position.leverage = constants.BIGDECIMAL_ZERO;

    position.balance = constants.BIGINT_ZERO;
    position.balanceUSD = constants.BIGDECIMAL_ZERO;

    position.collateralBalance = constants.BIGINT_ZERO;
    position.collateralBalanceUSD = constants.BIGDECIMAL_ZERO;

    position.collateralInCount = 0;
    position.collateralOutCount = 0;

    this.save();
  }
}
