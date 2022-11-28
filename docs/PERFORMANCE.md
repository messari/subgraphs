# Performance

This document outlines how to increase the indexing performance of subgraphs with data to backup claims.

## Indexing Speed

There are couple things you can do to significantly improve your indexing speed:

- Set a startblock (Use the deployment block of the contracts, [startblock app](https://startblock.vercel.app) may help).
- Avoid call handlers and block handlers. Also depending on the Ethereum node ran by an indexer, call handlers and block handlers may or may not be supported (esp. on alt-EVM chains).
- Limit the number of contract calls you perform. If you do need to perform contract calls, save the data, so you won't have to do repeated calls.

### Using Transaction .receipt

In many cases, an event is a part of a transaction emitting many events and it is helpful to get the information from an event upstream or downstream of current event in the same transaction. One example is in the balancer V2 subgraph, needed OutputTokenAmount info was included in the Transfer event preceding the PoolBalanceChanged event; another example is in the Euler subgraph, we need to know whether a Liquidation event is emitted after a AssetStatus event. Transaction receipt allow us the traverse the information of all events in the same transaction and can help improve performance of subgraphs.

Steps to use transaction receipt:

1. Set `apiVersion: 0.0.7` in subgraph.yaml (or in `templates/<protocol>.template.yaml`);
2. In subgraph.yaml, append a line `receipt: true` after the handler function that uses transaction receipt, see the [euler subgraph.yaml](https://github.com/messari/subgraphs/blob/dc4d674f30fb62efb59664ec7dffb26c5da7b0f3/subgraphs/euler-finance/protocols/euler-finance/config/templates/euler.template.yaml#L49) for an example.
3. In the handler function, you can get an array of logs with `event.receipt!.logs` and iterate it to access all events in the same transaction.

A few tips of using transaction receipts:

- `let currLog = logs.at(i)` gets the log at index `i`;
- `currLog.topics.at(0)` is topic0 and matches the keccak256 signature of the event at the corresponding index;
- topic0 can be checked against the keccak2556 signature of known events to select desired event:
  ```
  const liquidationSig = crypto.keccak256(
      ByteArray.fromUTF8("Liquidation(address,address,address,address,uint256,uint256,uint256,uint256,uint256)"),
    )
  if (currLog.topics.at(0).equals(liquidationSig)) {
    //do something for liquidation event log
  }
  ```
- topic1, topic2, etc corresponds to the indexed arguments of the event and can be accessed with `currLog.topics.at(1)` and decoded with `ethereum.decode("uint256", topic1)`. Un-indexed arguments can be accessed with `currLog.data` and decoded with:
  ```
  const decoded = ethereum.decode("(address,uint256)", currLog.data)!.toTuple();
  const address = decoded.at(0).toAddress();
  const amount = decoded.at(1).toBigInt();
  ```

See [euler subgraph](https://github.com/messari/subgraphs/blob/dc4d674f30fb62efb59664ec7dffb26c5da7b0f3/subgraphs/euler-finance/src/mappings/helpers.ts#L631-L668) and [balancer subgraph](https://github.com/nemani/subgraphs/blob/5a8df9d044b51f64e1999572ce3afa466fcce899/subgraphs/balancer-forks-ext/src/common/creators.ts#L334-L364) for examples of transaction receipt used in actual subgraphs.

## Performance Tests

The following tests are done to compare performance difference with the addition or subtraction of different indexing objectives or the substitution of methods for performing indexing operations.

### Price Oracle Test 1.0

- The purpose of this test is to compare the performance of 2 price oracles in the uniswap v2 subgraph implementation. This is done by deploying nearly identical subgraphs where the only difference is the price oracle.
- The performance can be measured by estimating the blocks per second indexing speed for each subgraph deployment across similar intervals of time. The prices are calculated around each deposit, withdraw, and swap event for both tokens involved.

* Note - the performance should be accurate but not totally precise since the end blocks are not the same. Some blocks index slower than others due to high volume

### Price Oracles:

- Oracle 1 - Pheonix's Oracle used and described in the _reference_ subgraph

- Oracle 2 - Oracle developed by the uniswap team which calculates price using pool ratios

### Checkpoints

#### Oracle 1

- Start time - 1:03:16 PM April 21 2022
- Start block - 10,207,858

* Checkpoint 1 - 2:17:23 PM April 21 2022

  - End block - 10,219,356
  - Seconds between start and end - 4,447
  - Blocks per second - 2.58556

* Checkpoint 2 - 9:58:44 PM April 22 2022

  - End block - 10,309,915
  - Block Difference - 102,057
  - Seconds between start and end - 75,328
  - Blocks per second - 1.3548

* Checkpoint 3 - 10:41:00 PM April 23 2022
  - End block - 10,363,003
  - Block Difference - 155,145
  - Seconds between start and end - 204,928
  - Blocks per second - 1.272

#### Oracle 2

- Start time - 12:48:52 PM April 21 2022
- Start block - 10,207,858

* Checkpoint 1 - 2:14:41 PM April 21 2022

  - End block - 10,224,219
  - Block Difference - 16,361
  - Seconds between start and end - 5,149
  - Blocks per second - 3.17751

* Checkpoint 2 - 9:57:08 AM April 22 2022
  - End block - 10,355,912
  - Block Difference - 148,045
  - Seconds between start and end - 76,096
  - Blocks per second - 1.9463

### Results

- The best comparison to here is between the 3rd checkout of the Oracle 1 test and the 2nd checkout of the Oracle 2 test. This is because the end on blocks on the checkpoints are nearest to each other with a wide time interval.
- The results of this test tell me that that Oracle 1 performs about 35% slower than oracle 2 across a ~150,000 block interval.

## Price Oracle Test 1.1

The purpose of this test is to compare the performance of 2 price oracles in the uniswap v2 subgraph implementation again with 2 modifications to pheonix's price oracle:

1. In the previous test, there were two contract calls made per price calculation - one for chainlink, and the uniswap router. In this test, the chainlink contract call does not occur unless the oracle is available (past block 12864088). Only the uniswap router will be called if it is available.
2. The price will only be calculated once per block for each token. The oracle pheonix developed calculates the token price based on the block number anyways, so calculating multiple times per block is pointless.

### Price Oracles:

- Oracle 1 - Pheonix's Oracle used and described in the _reference_ subgraph

- Oracle 2 - Oracle developed by the uniswap team which calculates price using pool ratios

### Checkpoints

#### Oracle 1

- Start time - 10:58:17 AM April 25 2022
- Start block - 10,207,858

* Checkpoint 1 - 2:26:13 PM April 25 2022

  - End block - 10,233,252
  - Block Difference - 25,394
  - Seconds between start and end - 12,476
  - Blocks per second - 2.0354

* Checkpoint 2 - 9:53:37 PM April 25 2022

  - End block - 10,284,245
  - Block Difference - 76,387
  - Seconds between start and end - 39,320
  - Blocks per second - 1.9427

* Checkpoint 3 - 9:03:45 AM April 26 2022
  - End block - 10,331,012
  - Block Difference - 123,154
  - Seconds between start and end - 79,528
  - Blocks per second - 1.5486

#### Oracle 2

- Start time - 11:00:23 AM April 25 2022
- Start block - 10,207,858

* Checkpoint 1 - 2:25:31 PM April 25 2022

  - End block - 10,233,547
  - Block Difference - 25,689
  - Seconds between start and end - 12,308
  - Blocks per second - 2.0871

* Checkpoint 2 - 9:51:46 PM April 25 2022

  - End block - 10,287,118
  - Block Difference - 79,260
  - Seconds between start and end - 39,083
  - Blocks per second - 2.0278

* Checkpoint 2 - 9:07:27 AM April 25 2022
  - End block - 10,336,413
  - Block Difference - 128,555
  - Seconds between start and end - 79,624
  - Blocks per second - 1.6145

#### Results

- The results after an approximately 22 hour test indicate that the use of Pheonix's oracle in the uniswap v2 subgraph results in a roughly 4% decrease in indexing speed. While this is substantial, it is a much diminished difference in pace when compared to Test 1.0.

## Hourly Metrics Test 1.0

- The purpose of this test is to check how much adding entities that track hourly metrics affects the indexing speed of the uniswap v2 subgraph.
- In this test, I adding hourly metrics for financials, usage, and pools in addition to the daily metrics. The tests were were started at the same block number and near the same time.

### Checkpoints

#### With Hourly Metrics

- Start time - 4:47:00 PM April 23 2022
- Start block - 10,000,834

* Checkpoint 1 - 10:05:54 PM April 23 2022
  - End block - 10,285,287
  - Block Difference - 284,453
  - Seconds between start and end - 62,318
  - Blocks per second - 4.5646

#### Without Hourly Metrics

- Start time - 4:50:00 PM April 23 2022
- Start block - 10,000,834

* Checkpoint 1 - 10:07:25 PM April 23 2022
  - End block - 10,285,442
  - Block Difference - 284,608
  - Seconds between start and end - 62,245
  - Blocks per second - 4.5724

### Results

- The results after a a roughly 5 hour test across about 284,000 is a nearly identical indexing speed. This test tells me that adding hourly metrics will not severely impact the indexing speed of a subgraph.
- An additional insight that I believe can be extracted from this test is that event and call handlers are by far the greatest bottleneck in the indexing speed using The Graph.

### Bytes and Immutables Test 1.0

- The purpose of this test is to check how much changing the id values of entities to Bytes and adding immutable entities where relevant affects indexing performance
- The entities which I added the immutable quality to are the RewardToken, Deposit, Withdraw, Swap, Account, and ActiveAccount

### Checkpoints

https://github.com/steegecs/subgraphs/tree/steegecs/uniswap-forks-IDs

#### Baseline - String IDs and no immutables

- Start time - 3:45:30 PM May 4 2022
- Start block - 10,000,834

* Checkpoint 1 -9:44:02 AM May 5 2022
  - End block - 10,539,781
  - Block Difference - 538,947
  - Seconds between start and end - 64,712
  - Blocks per second - 8.3284

#### Immutables - Added Immutables

https://github.com/steegecs/subgraphs/tree/steegecs/uniswap-forks-IDs

- Start time - 3:46:15 PM May 4 2022
- Start block - 10,000,834

* Checkpoint 1 - 9:46:15 AM May 5 2022
  - End block - 10,506,323
  - Block Difference - 505,489
  - Seconds between start and end - 64,800
  - Blocks per second - 7.8008

#### Bytes - Added Byte IDs

https://github.com/steegecs/subgraphs/tree/steegecs/uniswap-forks-bytes

- Start time - 3:49:39 PM May 4 2022
- Start block - 10,000,834

* Checkpoint 1 - 9:47:03 AM May 5 2022
  - End block - 10,438,534
  - Block Difference - 437,700
  - Seconds between start and end - 64,680
  - Blocks per second - 6.7672

#### Both - Added Immutables and Byte IDs

https://github.com/steegecs/subgraphs/tree/steegecs/uniswap-forks-bytes

- Start time - 3:48:35 PM May 4 2022
- Start block - 10,000,834

* Checkpoint 1 - 9:48:36 AM May 5 2022
  - End block - 10,534,297
  - Block Difference - 533,463
  - Seconds between start and end - 64,801
  - Blocks per second - 8.2323

### Results

- The results of this test indicate that having neither bytes as IDs or immutable entities is the fasted case. This is against our expectations. It was expected to see that adding both immutables and bytes as IDs would improve indexing speed.
- The results are quite strange upon analysis. Adding bytes as IDs only slows down the indexing process quite a lot (-23%) and adding immutables only slows the indexing process by a moderate amount (-6.8%). However when we combine both the addition of immutables and bytes, it only slightly slows down the indexing process (-1.2%).
- These results are far from the expectation of how the addition of immutables and bytes as IDs would impact the speed of indexing in isolation and combination. The results of this test warrant investigation into how the graph handles immutables and bytes as IDs behind the scenes so that we can get results more in line with our expectation and achieve the desired performance improvements.
