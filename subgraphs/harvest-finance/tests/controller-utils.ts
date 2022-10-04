import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { createMockedFunction, newMockCall, assert } from "matchstick-as";
import { AddVaultAndStrategyCall } from "../generated/Controller/ControllerContract";

export function mockCall(
  vault: Address,
  strategy: Address
): AddVaultAndStrategyCall {
  let to = Address.fromString("0x222412af183bceadefd72e4cb1b71f1889953b1c");
  let from = Address.fromString("0x0000000000000000000000000000000000000001");
  let call = newMockCall();
  call.to = to;
  call.from = from;
  call.inputValues = [
    new ethereum.EventParam("vault", ethereum.Value.fromAddress(vault)),
    new ethereum.EventParam("strategy", ethereum.Value.fromAddress(strategy)),
  ];

  return changetype<AddVaultAndStrategyCall>(call);
}

export function mockERC20(
  address: Address,
  name: string,
  symbol: string,
  decimals: i32
): void {
  createMockedFunction(address, "name", "name():(string)").returns([
    ethereum.Value.fromString(name),
  ]);
  createMockedFunction(address, "symbol", "symbol():(string)").returns([
    ethereum.Value.fromString(symbol),
  ]);
  createMockedFunction(address, "decimals", "decimals():(uint8)").returns([
    ethereum.Value.fromI32(decimals),
  ]);
}

export function mockChainLink(
  contractAddress: Address,
  baseAddress: Address,
  quoteAddress: Address,
  value: BigInt,
  decimals: i32
): void {
  createMockedFunction(
    contractAddress,
    "latestRoundData",
    "latestRoundData(address,address):(uint80,int256,uint256,uint256,uint80)"
  )
    .withArgs([
      ethereum.Value.fromAddress(baseAddress),
      ethereum.Value.fromAddress(quoteAddress),
    ])
    .returns([
      ethereum.Value.fromI32(0),
      ethereum.Value.fromUnsignedBigInt(value),
      ethereum.Value.fromI32(0),
      ethereum.Value.fromI32(0),
      ethereum.Value.fromI32(0),
    ]);

  createMockedFunction(
    contractAddress,
    "decimals",
    "decimals(address,address):(uint8)"
  )
    .withArgs([
      ethereum.Value.fromAddress(baseAddress),
      ethereum.Value.fromAddress(quoteAddress),
    ])
    .returns([ethereum.Value.fromI32(decimals)]);
}

export function mockUniswapRouter(
  contractAddress: Address,
  amountIn: BigInt,
  path: Address[],
  amountOut: BigInt
): void {
  createMockedFunction(
    contractAddress,
    "getAmountsOut",
    "getAmountsOut(uint256,address[]):(uint256[])"
  )
    .withArgs([
      ethereum.Value.fromUnsignedBigInt(amountIn),
      ethereum.Value.fromAddressArray(path),
    ])
    .returns([ethereum.Value.fromUnsignedBigIntArray([amountIn, amountOut])]);
}

export function mockYearnLens(
  contractAddress: Address,
  tokenAddress: Address,
  usdcValue: BigInt
): void {
  createMockedFunction(
    contractAddress,
    "getPriceUsdcRecommended",
    "getPriceUsdcRecommended(address):(uint256)"
  )
    .withArgs([ethereum.Value.fromAddress(tokenAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(usdcValue)]);
}

export function assertERC20(
  entity: string,
  address: Address,
  name: string,
  symbol: string,
  decimals: BigInt | null
): void {
  assert.fieldEquals(
    entity,
    address.toHexString(),
    "id",
    address.toHexString()
  );
  assert.fieldEquals(entity, address.toHexString(), "name", name);
  assert.fieldEquals(entity, address.toHexString(), "symbol", symbol);

  if (decimals)
    assert.fieldEquals(
      entity,
      address.toHexString(),
      "decimals",
      decimals.toString()
    );
}

export function assertToken(
  address: Address,
  name: string,
  symbol: string,
  decimals: BigInt
): void {
  assertERC20("Token", address, name, symbol, decimals);
}

export function assertVault(
  address: Address,
  name: string,
  symbol: string,
  inputToken: Address,
  outputToken: Address,
  depositLimit: BigInt,
  createdTimestamp: BigInt,
  createdBlockNumber: BigInt,
  totalValueLockedUSD: BigDecimal,
  inputTokenBalance: BigInt,
  protocol: string
): void {
  assertERC20("Vault", address, name, symbol, null);
  assert.fieldEquals(
    "Vault",
    address.toHexString(),
    "inputToken",
    inputToken.toHexString()
  );
  assert.fieldEquals(
    "Vault",
    address.toHexString(),
    "outputToken",
    outputToken.toHexString()
  );
  assert.fieldEquals(
    "Vault",
    address.toHexString(),
    "depositLimit",
    depositLimit.toString()
  );
  assert.fieldEquals(
    "Vault",
    address.toHexString(),
    "createdTimestamp",
    createdTimestamp.toString()
  );
  assert.fieldEquals(
    "Vault",
    address.toHexString(),
    "createdBlockNumber",
    createdBlockNumber.toString()
  );
  assert.fieldEquals(
    "Vault",
    address.toHexString(),
    "totalValueLockedUSD",
    totalValueLockedUSD.toString()
  );
  assert.fieldEquals(
    "Vault",
    address.toHexString(),
    "inputTokenBalance",
    inputTokenBalance.toString()
  );
  assert.fieldEquals("Vault", address.toHexString(), "protocol", protocol);
}

export function assertProtocol(
  address: Address,
  name: string,
  slug: string,
  schemaVersion: string,
  subgraphVersion: string,
  methodologyVersion: string,
  network: string,
  type: string,
  totalValueLockedUSD: BigDecimal,
  protocolControlledValueUSD: BigDecimal,
  cumulativeSupplySideRevenueUSD: BigDecimal,
  cumulativeProtocolSideRevenueUSD: BigDecimal,
  cumulativeTotalRevenueUSD: BigDecimal,
  cumulativeUniqueUsers: i32
): void {
  assert.fieldEquals("YieldAggregator", address.toHexString(), "name", name);
  assert.fieldEquals("YieldAggregator", address.toHexString(), "slug", slug);
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "schemaVersion",
    schemaVersion
  );
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "subgraphVersion",
    subgraphVersion
  );
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "methodologyVersion",
    methodologyVersion
  );
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "network",
    network
  );
  assert.fieldEquals("YieldAggregator", address.toHexString(), "type", type);

  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "totalValueLockedUSD",
    totalValueLockedUSD.toString()
  );
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "protocolControlledValueUSD",
    protocolControlledValueUSD.toString()
  );
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "cumulativeSupplySideRevenueUSD",
    cumulativeSupplySideRevenueUSD.toString()
  );
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "cumulativeProtocolSideRevenueUSD",
    cumulativeProtocolSideRevenueUSD.toString()
  );

  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "cumulativeTotalRevenueUSD",
    cumulativeTotalRevenueUSD.toString()
  );
  assert.fieldEquals(
    "YieldAggregator",
    address.toHexString(),
    "cumulativeUniqueUsers",
    cumulativeUniqueUsers.toString()
  );
}
