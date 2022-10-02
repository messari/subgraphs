# OpenSea Marketplace Subgraph (Wyvern Exchange)

| Name                        | Subgraph Deployment                                                                                     | Status                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| OpenSea: Wyvern Exchange V1 | [messari/opensea-v1-ethereum](https://thegraph.com/hosted-service/subgraph/messari/opensea-v1-ethereum) | [Okgraph](https://okgraph.xyz/?q=messari%2Fopensea-v1-ethereum) |
| OpenSea: Wyvern Exchange V2 | [messari/opensea-v2-ethereum](https://thegraph.com/hosted-service/subgraph/messari/opensea-v2-ethereum) | [Okgraph](https://okgraph.xyz/?q=messari%2Fopensea-v2-ethereum) |

## Relevant Info

| Contract                                     | Contract Address                                                                                                      | Start Block |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- |
| `WyvernExchange` (v2.2)                      | [0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b](https://etherscan.io/address/0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b) | `5774644`   |
| `WyvernExchangeWithBulkCancellations` (v2.3) | [0x7f268357A8c2552623316e2562D90e642bB538E5](https://etherscan.io/address/0x7f268357a8c2552623316e2562d90e642bb538e5) | `14120913`  |
| `WyvernAtomicizer`                           | [0xc99f70bfd82fb7c8f8191fdfbfb735606b15e5c5](https://etherscan.io/address/0xc99f70bfd82fb7c8f8191fdfbfb735606b15e5c5) | `5220302`   |
| `MerkleValidator`                            | [0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7](https://etherscan.io/address/0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7) | `14128524`  |

## Methodology

### Event Handlers vs Call Handlers

For the OpenSea `WyvernExchange` contracts, the events emitted do not provide enough information to index with Messari's standardized schema. The event that indicates a trade has been made is `OrdersMatched` but it only surfaces a few fields:

```js
event OrdersMatched(bytes32 buyHash, bytes32 sellHash, address indexed maker, address indexed taker, uint price, bytes32 indexed metadata)
```

which only contains hashes of the orders an not the underlying `Order` struct.
In order to pull more relevant information for the schema, call handlers have to be used to peek into what the `Order` struct contains.

### Order Struct

Order struct as found in the Project Wyvern official source
https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L92

```js
struct Order {
  /* Exchange address, intended as a versioning mechanism. */
  address exchange;
  /* Order maker address. */
  address maker;
  /* Order taker address, if specified. */
  address taker;
  /* Maker relayer fee of the order, unused for taker order. */
  uint makerRelayerFee;
  /* Taker relayer fee of the order, or maximum taker fee for a taker order. */
  uint takerRelayerFee;
  /* Maker protocol fee of the order, unused for taker order. */
  uint makerProtocolFee;
  /* Taker protocol fee of the order, or maximum taker fee for a taker order. */
  uint takerProtocolFee;
  /* Order fee recipient or zero address for taker order. */
  address feeRecipient;
  /* Fee method (protocol token or split fee). */
  FeeMethod feeMethod;
  /* Side (buy/sell). */
  SaleKindInterface.Side side;
  /* Kind of sale. */
  SaleKindInterface.SaleKind saleKind;
  /* Target. */
  address target;
  /* HowToCall. */
  AuthenticatedProxy.HowToCall howToCall;
  /* Calldata. */
  bytes calldata;
  /* Calldata replacement pattern, or an empty byte array for no replacement. */
  bytes replacementPattern;
  /* Static call target, zero-address for no static call. */
  address staticTarget;
  /* Static call extra data. */
  bytes staticExtradata;
  /* Token used to pay for the order, or the zero-address as a sentinel value for Ether. */
  address paymentToken;
  /* Base price of the order (in paymentTokens). */
  uint basePrice;
  /* Auction extra parameter - minimum bid increment for English auctions, starting/ending price difference. */
  uint extra;
  /* Listing timestamp. */
  uint listingTime;
  /* Expiration timestamp - 0 for no expiry. */
  uint expirationTime;
  /* Order salt, used to prevent duplicate hashes. */
  uint salt;
  /* NOTE: uint nonce is an additional component of the order but is read from storage */
}
```

### Order Flow

There are 2 main styles of order flows (i.e. how a trade is made):

- Sell side order: Seller (maker) lists NFT on OpenSea, Buyer (taker) buys NFT
- Buy side order: Buyer (maker) bids/makes offer on NFT on Opensea, Seller (taker) accepts offer

In either case, when a taker (buyer/seller) accepts a price, an order is matched and a trade is facilitated.

### Order Matching

> Buy-side and sell-side orders each provide calldata (bytes) - for a sell-side order, the state transition for sale, for a buy-side order, the state transition to be bought.
>
> Along with the calldata, orders provide `replacementPattern`: a bytemask indicating which bytes of the calldata can be changed (e.g. NFT destination address).
>
> When a buy-side and sell-side order are matched, the desired calldatas are unified, masked with the bytemasks, and checked for agreement.
>
> This alone is enough to implement common simple state transitions, such as "transfer my CryptoKitty to any address" or "buy any of this kind of nonfungible token".

When an order (trade) is matched, OpenSea calls the method `atomicMatch_` (can be inspected on Etherscan). Using the inputs from `atomicMatch_`:
https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/Exchange.sol#L317

```js
atomicMatch_(
  address[14] addrs,
  uint[18] uints,
  uint8[8] feeMethodsSidesKindsHowToCalls,
  bytes calldataBuy,
  bytes calldataSell,
  bytes replacementPatternBuy,
  bytes replacementPatternSell,
  bytes staticExtradataBuy,
  bytes staticExtradataSell,
  uint8[2] vs,
  bytes32[5] rssMetadata
)
```

it constructs `Order` structs for `buy` side and `sell` side to make a call to `atomicMatch`.
https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L665

```js
function atomicMatch(Order memory buy, Sig memory buySig, Order memory sell, Sig memory sellSig, bytes32 metadata)
```

Here is the lookup table for variables corresponding to the call inputs:

| `address[14] addrs` | Corresponding Variable |
| ------------------- | ---------------------- |
| `addrs[0]`          | `buy.exchange`         |
| `addrs[1]`          | `buy.maker`            |
| `addrs[2]`          | `buy.taker`            |
| `addrs[3]`          | `buy.feeRecipient`     |
| `addrs[4]`          | `buy.target`           |
| `addrs[5]`          | `buy.staticTarget`     |
| `addrs[6]`          | `buy.paymentToken`     |
| `addrs[7]`          | `sell.exchange`        |
| `addrs[8]`          | `sell.maker`           |
| `addrs[9]`          | `sell.taker`           |
| `addrs[10]`         | `sell.feeRecipient`    |
| `addrs[11]`         | `sell.target`          |
| `addrs[12]`         | `sell.staticTarget`    |
| `addrs[13]`         | `sell.paymentToken`    |

| `uint[18] uints` | Corresponding Variable  |
| ---------------- | ----------------------- |
| `uints[0]`       | `buy.makerRelayerFee`   |
| `uints[1]`       | `buy.takerRelayerFee`   |
| `uints[2]`       | `buy.makerProtocolFee`  |
| `uints[3]`       | `buy.takerProtocolFee`  |
| `uints[4]`       | `buy.basePrice`         |
| `uints[5]`       | `buy.extra`             |
| `uints[6]`       | `buy.listingTime`       |
| `uints[7]`       | `buy.expirationTime`    |
| `uints[8]`       | `buy.salt`              |
| `uints[9]`       | `sell.makerRelayerFee`  |
| `uints[10]`      | `sell.takerRelayerFee`  |
| `uints[11]`      | `sell.makerProtocolFee` |
| `uints[12]`      | `sell.takerProtocolFee` |
| `uints[13]`      | `sell.basePrice`        |
| `uints[14]`      | `sell.extra`            |
| `uints[15]`      | `sell.listingTime`      |
| `uints[16]`      | `sell.expirationTime`   |
| `uints[17]`      | `sell.salt`             |

| `uint8[8] feeMethodsSidesKindsHowToCalls` | Corresponding Variable |
| ----------------------------------------- | ---------------------- |
| `feeMethodsSidesKindsHowToCalls[0]`       | `buy.feeMethod`        |
| `feeMethodsSidesKindsHowToCalls[1]`       | `buy.side`             |
| `feeMethodsSidesKindsHowToCalls[2]`       | `buy.saleKind`         |
| `feeMethodsSidesKindsHowToCalls[3]`       | `buy.howToCall`        |
| `feeMethodsSidesKindsHowToCalls[4]`       | `sell.feeMethod`       |
| `feeMethodsSidesKindsHowToCalls[5]`       | `sell.side`            |
| `feeMethodsSidesKindsHowToCalls[6]`       | `sell.saleKind`        |
| `feeMethodsSidesKindsHowToCalls[7]`       | `sell.howToCall`       |

### Call Handler Flow

The subgraph call handler flow can be broken down into several steps:

1. Inspect `sell.target` to determine whether the trade is a single sale or bundle sale. This is the contract the the `calldata` is sent to be executed (via `delegatecall`). Known `sell.target` addresses:

   - `WyvernAtomicizer` ([0xc99f70bfd82fb7c8f8191fdfbfb735606b15e5c5](https://etherscan.io/address/0xc99f70bfd82fb7c8f8191fdfbfb735606b15e5c5))
   - `MerkleValidator` ([0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7](https://etherscan.io/address/0xBAf2127B49fC93CbcA6269FAdE0F7F31dF4c88a7))
   - Actual NFT (ERC721/ERC1155) Contract

   If `sell.target` is `WyvernAtomicizer`, the trade is a bundle sale (`calldata` broken down into separate calls to their respective contracts and executed atomically).

   For single sales, `sell.target` is `MerkleValidator` or the actual ERC721/ERC1155 contracts.

   Note that `MerkleValidator` is deployed at block `14128524` after `WyvernExchangeWithBulkCancellations` at block `14120913`, meaning prior to block `14128524`, `WyvernExchangeWithBulkCancellations` interacts directly with ERC721/ERC1155 contracts with their respective `transferFrom` and `safeTransferFrom` calls. `WyvernExchange` interacts directly with ERC721/ERC1155 contracts.

2. If single sale, merge `buy.calldata` and `sell.calldata` together with `guardedArrayReplace` and decode single NFT into relevant fields with function signature.

   Note that `guardedArrayReplace`, as described in the `WyvernExchange` contracts, replaces bytes in an array with bytes in another array, guarded by a bitmask. If an order is matched, the merged `calldata` can be found via:

   ```js
   guardedArrayReplace(calldataBuy, calldataSell, replacementPatternBuy);
   // or
   guardedArrayReplace(calldataSell, calldataBuy, replacementPatternSell);
   ```

   which should be the same. This recreates the `calldata` sent to `sell.target`.

   To ensure that `calldata` can be decoded via the Ethereum API, the function selector/signature (first 4 bytes of `calldata`) needs to be validated using `validateCallDataFunctionSelector` as one that is recognized.

   Here is the lookup table for relevant function selectors:

   | Function Selector | Text Signature                                                                                |
   | ----------------- | --------------------------------------------------------------------------------------------- |
   | `0x23b872dd`      | `transferFrom(address,address,uint256)`                                                       |
   | `0x42842e0e`      | `safeTransferFrom(address,address,uint256)`                                                   |
   | `0xf242432a`      | `safeTransferFrom(address,address,uint256,uint256,bytes)`                                     |
   | `0xfb16a595`      | `matchERC721UsingCriteria(address,address,address,uint256,bytes32,bytes32[])`                 |
   | `0xc5a0236e`      | `matchERC721WithSafeTransferUsingCriteria(address,address,address,uint256,bytes32,bytes32[])` |
   | `0x96809f90`      | `matchERC1155UsingCriteria(address,address,address,uint256,uint256,bytes32,bytes32[])`        |

   Additional function selectors can be found using the [Ethereum Signature Database](https://www.4byte.directory/).

   Decoding the transfer `calldata` yields:

   ```js
   address from,
   address to,
   IERC721 token,
   uint256 tokenId,
   uint256 amount, // for ERC1155 transfers
   ```

   Note that since the `calldata` for `MerkleValidator` contains dynamic data, `ethabi` (library that `graph-ts` uses for the Ethereum API) has difficulty recognizing/decoding the data unless the prefix `0000000000000000000000000000000000000000000000000000000000000020` is added. Read more [here](https://medium.com/@r2d2_68242/indexing-transaction-input-data-in-a-subgraph-6ff5c55abf20) and [`ethabi` docs](https://github.com/rust-ethereum/ethabi).

   For direct ERC721/ERC1155 transfers, decoding the `calldata` yields:

   ```js
   address from,
   address to,
   uint256 tokenId,
   uint256 amount, // for ERC1155 transfers
   ```

   Note that direct transfers not using `MerkleValidator`, `calldata` does not yield token contract address. Token contract address is `sell.target` in the Order struct.

   If bundle sale, decode bundle NFT data sent to `WyvernAtomicizer` in the `atomicize` method.

   https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/WyvernAtomicizer.sol#L18

   ```js
   function atomicize (address[] addrs, uint[] values, uint[] calldataLengths, bytes calldatas)
   ```
   
   Note that there is no need to validate function selector using `validateCallDataFunctionSelector` since `WyvernAtomicizer` only contains one method. 
   
   Decoding the `atomicize` method returns a list of targets (ERC721/ERC1155 contract addresses), `calldata` lengths, and `calldata` blob which can be split up into a list of individual contract calls.

   Similar to how single NFTs are decoded, the "atomicized" list of `calldata` can be decoded into individual transfers.

3. Calculate trade price.

   Trade price (for `FixedPrice` and `DutchAuction` trades) is calculated according to `calculateMatchPrice` and `calculateFinalPrice` as found in the `WyvernExchange` contracts:

   https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/ExchangeCore.sol#L460

   ```js
   function calculateMatchPrice(Order memory buy, Order memory sell)
   ```

   https://github.com/ProjectWyvern/wyvern-ethereum/blob/bfca101b2407e4938398fccd8d1c485394db7e01/contracts/exchange/SaleKindInterface.sol#L70

   ```js
   function calculateFinalPrice(Side side, SaleKind saleKind, uint basePrice, uint extra, uint listingTime, uint expirationTime)
   ```

4. Extract other call inputs to create new `Trade` entity.

- `sell.saleKind` denotes if sale strategy is `FixedPrice` or `DutchAuction`
  - `0` for `FixedPrice`
  - `1` for `DutchAuction`
- `sell.paymentToken` denotes ERC20 token transacted as payment
  - `0x0000000000000000000000000000000000000000` for native ETH
  - `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2` for WETH
  - Subgraph does not track other currencies currently
- `buy.basePrice`/`sell.basePrice` denotes base trade price
  - Note that Dutch Auction sales use `calculateMatchPrice` to determine trade price
- `buy.maker` denotes the NFT buyer (sale taker/bid maker)

  Known Exceptions:

  - [Genie swaps](https://www.genie.xyz/)
    - `buy.maker`: Genie: GenieSwap ([`0x0a267cf51ef038fc00e71801f5a524aec06e4f07`](https://etherscan.io/address/0x0a267cf51ef038fc00e71801f5a524aec06e4f07))
    - NFT receiver: NFT buyer
  - [Gem swaps](https://www.gem.xyz/)
    - `buy.maker`: Gem: GemSwap / Gem: GemSwap 2 ([`0xf24629fbb477e10f2cf331c2b7452d8596b5c7a5`](https://etherscan.io/address/0xf24629fbb477e10f2cf331c2b7452d8596b5c7a5)/[`0x83c8f28c26bf6aaca652df1dbbe0e1b56f8baba2`](https://etherscan.io/address/0x83c8f28c26bf6aaca652df1dbbe0e1b56f8baba2))
    - NFT receiver: NFT buyer
  - [Nifty Gateway](https://www.niftygateway.com/)
    - `buy.maker`: [`0x8279648470eb92cbcd00ceb8ca30c2adfac20740`](https://etherscan.io/address/0x8279648470eb92cbcd00ceb8ca30c2adfac20740)
    - NFT receiver: [Nifty Gateway: Omnibus](https://help.niftygateway.com/hc/en-us/articles/4409003713299-An-Explanation-of-Nifty-Gateway-s-Custody-Option) ([`0xe052113bd7d7700d623414a0a4585bcae754e9d5`](https://etherscan.io/address/0xe052113bd7d7700d623414a0a4585bcae754e9d5))

- `sell.maker` denotes the NFT seller (sale maker/bid taker)

5. Update `Collection`/`Marketplace` entities.

   Royalty/Revenue Fees calculated by taking fee payment and subtracting known OpenSea marketplace fee (2.5% on all trades)

   1. Determine whether trade is buy side or sell side

   - `sell.feeRecipient` is not zero address: sell side
   - `sell.feeRecipient` is zero address: buy side

   2. Get `sell.makerRelayerFee` or `buy.takerRelayerFee` (in basis points).

   This fee percentage subtracted by known OpenSea marketplace fee yields collection royalty fee/creator revenue.

Note that this does not seem to be the case for bundle sales (need to inspect bundle sales more granularly).

## Example Transactions

[Single ERC721 Sale](https://etherscan.io/tx/0xd5998f56b9f1d0308d572a4b15e4ef6348ebb26a7f37d88c82c20ada769bda39)

[Single ERC1155 Sale](https://etherscan.io/tx/0xec609f42a3050d233342f60cc55c91b01356437921df880cbd67082e2697a929)

[Bundle ERC721 Sale](https://etherscan.io/tx/0x9b16c3448cf2c7db57169d2bda94add45c2cb12cd9c36d385ee86803d5e42964)

[Single ERC721 Bid Sale](https://etherscan.io/tx/0xe3d8b51e72d156c7cc65948f0f524a3d357cbfb7be46f3489174935fdd2b4454)
