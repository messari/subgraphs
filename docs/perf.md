The following tests are done to compare performance difference with the addition or subtraction of different indexing objectives or the substitution of methods for performinging indexing operations.

Test 1.1
The purpose of this test is to compare the performance of 2 price oracles in the uniswap v2 subgraph implementation. This is done by deploy nearly identical subgraphs where the only difference is the price oracle.
The performance can be measured by estimating the blocks per second that is indexed by each of similar intervals of time. The prices are calculated around each deposit, withdraw, and swap event for both tokens involved.

- Note - the performance should be accurate but not totally precise since the end blocks are not the same. Some blocks index slower than others due to high volume

Price Oracles:
Oracle 1 - Pheonix's Oracle used and described in the _reference_ subgraph
Oracle 2 - Oracle developed by the uniswap team which calculates price using pool ratios

- Oracle 1
  Start time - 1:03:16 PM April 21 2022
  Start block - 10,207,858

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

- Oracle 2
  Start time - 12:48:52 PM April 21 2022
  Start block - 10,207,858

* Checkpoint 1 - 2:14:41 PM April 21 2022
  - End block - 10,224,219
  - Block Difference - 16,361
  - Seconds between start and end - 5,149
  - Blocks per second - 3.17751 blocks per seconds
* Checkpoint 2 - 9:57:08 AM April 22 2022
  - End block - 10,355,912
  - Block Difference - 148,045
  - Seconds between start and end - 76,096
  - Blocks per second - 1.9463 Blocks per second

Results - Test 1.1
The best comparison to here is between the 3rd checkout of the Oracle 1 test and the 2nd checkout of the Oracle 2 test. This is because the end on blocks on the checkpoints are nearest to each other with a wide time interval. The results of this test tell me that that Oracle 1 performs about 35% slower than oracle 2 across a ~150,000 block interval.

Test 1.1
The purpose of this test is to compare the performance of 2 price oracles in the uniswap v2 subgraph implementation again with 2 modifications to pheonix's price oracle.

1. In the previous test, there were two contract calls made per price calculation - one for chainlink, and the uniswap router. In this test, the chainlink contract call does not occur unless the oracle is available (past block 12864088). Only the uniswap router will be called for the duration of this test.
2. The price will only be calculated once per block for each token

- Oracle 1
  Start time - 10:58:17 AM April 25 2022
  Start block - 10,207,858

* Checkpoint 1 - 2:26:13 PM April 21 2022
  - End block - 10,233,252
  - Block Difference - 25,394
  - Seconds between start and end - 12,476
  - Blocks per second - 2.0354 blocks per seconds

- Oracle 2
  Start time - 11:00:23 AM April 21 2022
  Start block - 10,207,858

* Checkpoint 1 - 2:25:31 PM April 21 2022
  - End block - 10,233,547
  - Block Difference - 25,689
  - Seconds between start and end - 12,308
  - Blocks per second - 2.0871 blocks per seconds

10207858

- 10000834

4:47:00 - with hourly metrics

- 10:05:54
  - 10285287
  - 62318
  - 4.5646 Blocks per second

4:50:00 - without

- 10:07:25
  - 10285442
  - 62245
  - 4.5724 Blocks per second

Pheonix’s Oracle (0)

- 10:58:17
- 12:54:26 - 10223075 - 6969 seconds - 2.1835 blocks per second
  Pheonix’s Oracle (1)
- 10:59:06
- 12:55:45 - 10223075
  Oracle from pools
- 11:00:23
- 12:54:21
  - 10223260
  - 6838 seconds
  - 2.2524 blocks per second
