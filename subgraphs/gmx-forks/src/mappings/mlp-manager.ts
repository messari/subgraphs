import {
  AddLiquidity as AddLiquidityEvent,
  RemoveLiquidity as RemoveLiquidityEvent,
} from "../../generated/MlpManager/MlpManager";
import * as constants from "../common/constants";
import * as utils from "../common/utils";
import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleAddLiquidity(event: AddLiquidityEvent): void {
  const accountAddress = event.params.account;
  const amount = event.params.amount;
  const vaultTVL = event.params.aumInUsdg;
  const mlpSupply = event.params.glpSupply;
  const mintAmount = event.params.mintAmount;
  const tokenAddress = event.params.token;

  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(event, sdk);
  const account = getOrCreateAccount(accountAddress, pool, sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);

  utils.checkAndUpdateInputTokens(pool, token, amount);

  const poolInputTokens = pool.getInputTokens();
  const idx = pool.getInputTokens().indexOf(token.id);
  const amountsArray = new Array<BigInt>(poolInputTokens.length).fill(
    constants.BIGINT_ZERO
  );
  amountsArray[idx] = amount;
  pool.setTotalValueLocked(
    utils.bigIntToBigDecimal(vaultTVL, constants.DEFAULT_DECIMALS)
  );
  pool.setOutputTokenSupply(mlpSupply);
  pool.setStakedOutputTokenAmount(mlpSupply);
  account.deposit(pool, amountsArray, mintAmount, true);
}

export function handleRemoveLiquidity(event: RemoveLiquidityEvent): void {
  const accountAddress = event.params.account;
  const amount = event.params.amountOut;
  const vaultTVL = event.params.aumInUsdg;
  const mlpSupply = event.params.glpSupply;
  const mintAmount = event.params.glpAmount;
  const tokenAddress = event.params.token;
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(event, sdk);
  const account = getOrCreateAccount(accountAddress, pool, sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);

  utils.checkAndUpdateInputTokens(pool, token);
  const poolInputTokens = pool.getInputTokens();
  const idx = pool.getInputTokens().indexOf(token.id);
  const amountsArray = new Array<BigInt>(poolInputTokens.length).fill(
    constants.BIGINT_ZERO
  );
  amountsArray[idx] = amount;
  pool.setTotalValueLocked(
    utils.bigIntToBigDecimal(vaultTVL, constants.DEFAULT_DECIMALS)
  );
  pool.setOutputTokenSupply(mlpSupply);
  pool.setStakedOutputTokenAmount(mlpSupply);
  account.withdraw(pool, amountsArray, mintAmount, true);
}
