import {
  dataSource,
  BigInt,
  DataSourceContext,
  BigDecimal,
  Address,
} from "@graphprotocol/graph-ts";
import { Wrapper, WrapperMint, WrapperBurn } from "../../generated/schema";
import { WrapperTemplate } from "../../generated/templates";
import { getLatestRate, strToBytes, toDecimal } from "./lib/helpers";
import { getContractDeployment } from "../../protocols/addresses";
import { AddressResolver } from "../../generated/SystemSettings_0/AddressResolver";
import {
  Burned as BurnedEvent,
  Minted as MintedEvent,
} from "../../generated/templates/WrapperTemplate/Wrapper";
import {
  WrapperMaxTokenAmountUpdated as WrapperMaxTokenAmountUpdatedEvent,
  EtherWrapperMaxETHUpdated as EtherWrapperMaxETHUpdatedEvent,
} from "../../generated/SystemSettings_0/SystemSettings";
import { Wrapper as WrapperContract } from "../../generated/templates/WrapperTemplate/Wrapper";
import { WrapperCreated as WrapperCreatedEvent } from "../../generated/WrapperFactory_0/WrapperFactory";
import { BIGDECIMAL_ZERO } from "../utils/constants";

export function handleWrapperCreated(event: WrapperCreatedEvent): void {
  const context = new DataSourceContext();
  context.setString("tokenAddress", event.params.token.toHexString());
  context.setString("currencyKey", event.params.currencyKey.toString());
  WrapperTemplate.createWithContext(event.params.wrapperAddress, context);
}

export function handleMinted(event: MintedEvent): void {
  // Create Mint
  const mintEntity = new WrapperMint(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  mintEntity.account = event.params.account.toHexString();
  mintEntity.principal = toDecimal(event.params.principal);
  mintEntity.fee = toDecimal(event.params.fee);
  mintEntity.amountIn = toDecimal(event.params.amountIn);
  mintEntity.timestamp = event.block.timestamp;
  mintEntity.wrapperAddress = event.address.toHexString();
  mintEntity.save();

  // Update Wrapper
  const wrapper = getOrCreateWrapper(event.address.toHexString());

  wrapper.amount = wrapper.amount.plus(toDecimal(event.params.amountIn));
  wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

  const txHash = event.transaction.hash.toString();
  const latestRate = getLatestRate(wrapper.currencyKey, txHash);
  if (latestRate) {
    wrapper.amountInUSD = wrapper.amount.times(latestRate);
    wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
  }

  wrapper.save();

  // // A mint is basically a deposit + borrow
  // // Principal + Fee = AmountIn
  // const market = getOrCreateMarket(wrapper.tokenAddress, event);
  // market.cumulativeProtocolSideRevenueUSD = wrapper.totalFeesInUSD;
  // market.cumulativeTotalRevenueUSD = market.cumulativeProtocolSideRevenueUSD;

  // market.totalValueLockedUSD = wrapper.amountInUSD;
  // market.totalDepositBalanceUSD = wrapper.amountInUSD;
  // market.totalBorrowBalanceUSD = wrapper.amountInUSD;

  // addMarketDepositVolume(event, toDecimal(event.params.amountIn), market);
  // addMarketBorrowVolume(event, toDecimal(event.params.amountIn), market);

  // market.inputTokenBalance = market.inputTokenBalance.plus(
  //   event.params.principal
  // );
  // market.inputTokenPriceUSD = latestRate!;

  // // principal + fee = (amountOut == amountIn)
  // // amountOut is minted, fee as outputToken is sent to fee address.
  // market.outputTokenSupply = market.outputTokenSupply.plus(
  //   event.params.amountIn
  // );
  // market.outputTokenPriceUSD = latestRate!;

  // // Handle Market Positions
  // market.save();
}

export function handleBurned(event: BurnedEvent): void {
  // Create Burn
  const burnEntity = new WrapperBurn(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  burnEntity.account = event.params.account.toHex();
  burnEntity.principal = toDecimal(event.params.principal);
  burnEntity.fee = toDecimal(event.params.fee);
  burnEntity.amountOut = toDecimal(event.params.amountIn);
  burnEntity.timestamp = event.block.timestamp;
  burnEntity.wrapperAddress = event.address.toHexString();
  burnEntity.save();

  // Update Wrapper
  const wrapper = getOrCreateWrapper(event.address.toHexString());

  wrapper.amount = wrapper.amount.minus(toDecimal(event.params.principal));
  wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

  const txHash = event.transaction.hash.toString();
  const latestRate = getLatestRate(wrapper.currencyKey, txHash);
  if (latestRate) {
    wrapper.amountInUSD = wrapper.amount.times(latestRate);
    wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
  }

  wrapper.save();

  // // A burn is basically a repay and withdraw
  // const market = getOrCreateMarket(wrapper.tokenAddress, event);
  // market.cumulativeProtocolSideRevenueUSD = wrapper.totalFeesInUSD;
  // market.cumulativeTotalRevenueUSD = market.cumulativeProtocolSideRevenueUSD;

  // market.totalValueLockedUSD = wrapper.amountInUSD;
  // market.totalDepositBalanceUSD = wrapper.amountInUSD;
  // market.totalBorrowBalanceUSD = wrapper.amountInUSD;

  // addMarketWithdrawVolume(event, toDecimal(event.params.principal), market);
  // addMarketRepayVolume(event, toDecimal(event.params.principal), market);

  // market.inputTokenBalance = market.inputTokenBalance.minus(
  //   event.params.principal
  // );
  // market.inputTokenPriceUSD = latestRate!;

  // // principal + fee = (amountOut == amountIn)
  // // principal is burnt, fee is sent to fee address.
  // market.outputTokenSupply = market.outputTokenSupply.minus(
  //   event.params.principal
  // );
  // market.outputTokenPriceUSD = latestRate!;

  // // Handle Market Positions
  // market.save();
}

export function handleWrapperMaxTokenAmountUpdated(
  event: WrapperMaxTokenAmountUpdatedEvent
): void {
  const wrapper = Wrapper.load(event.params.wrapper.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxTokenAmount);
    wrapper.save();
  }
}

export function handleEtherWrapperMaxETHUpdated(
  event: EtherWrapperMaxETHUpdatedEvent
): void {
  const addressResolverAddress = getContractDeployment(
    "AddressResolver",
    dataSource.network(),
    BigInt.fromI32(1000000000)
  )!;
  const resolver = AddressResolver.bind(addressResolverAddress);
  const etherWrapperAddress = resolver.try_getAddress(
    strToBytes("EtherWrapper", 32)
  );
  if (etherWrapperAddress.reverted) {
    return;
  }
  const wrapperAddress = etherWrapperAddress.value;

  const wrapper = Wrapper.load(wrapperAddress.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxETH);
    wrapper.save();
  }
}

function getOrCreateWrapper(address: string): Wrapper {
  let wrapper = Wrapper.load(address);

  if (!wrapper) {
    wrapper = new Wrapper(address);
    wrapper.amount = BIGDECIMAL_ZERO;
    wrapper.amountInUSD = BIGDECIMAL_ZERO;
    wrapper.tokenAddress = "";
    wrapper.currencyKey = "ETH";
    wrapper.totalFees = BIGDECIMAL_ZERO;
    wrapper.maxAmount = BIGDECIMAL_ZERO;
    wrapper.totalFeesInUSD = BIGDECIMAL_ZERO!;

    // Assign values from context, for template generated Wrapper entities
    const context = dataSource.context();
    if (context.get("tokenAddress")) {
      const tokenAddress = context.getString("tokenAddress");
      const currencyKey = context.getString("currencyKey");
      if (tokenAddress && tokenAddress.length) {
        wrapper.tokenAddress = tokenAddress;
        wrapper.currencyKey = currencyKey;
      }
    }

    if (
      address == "0xad32aa4bff8b61b4ae07e3ba437cf81100af0cd7" ||
      address == "0x6202a3b0be1d222971e93aab084c6e584c29db70" ||
      address == "0x8a91e92fdd86e734781c38db52a390e1b99fba7c"
    ) {
      const wrapperContract = WrapperContract.bind(Address.fromString(address));
      wrapper.tokenAddress = wrapperContract.token().toHexString();
      wrapper.currencyKey = wrapperContract.currencyKey().toString();
      wrapper.amount = toDecimal(wrapperContract.targetSynthIssued());
      wrapper.maxAmount = toDecimal(wrapperContract.maxTokenAmount());
      wrapper.totalFees = BigDecimal.fromString("0"); // TBD
    }
  }

  return wrapper;
}
