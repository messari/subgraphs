# Validation Dashboard

This document contains some instruction on the functionality of the Validation Dashboard

## Deployments Page

### Input Box

This input is used to pull up a subgraph to validate. This box accepts the Query URL specified for your deployment on its Graph page (Under the label `Queries (HTTP)` for the hosted service and under the label `TEMPORARY QUERY URL` for subgraph studio deployments). Alternatively for Hosted Service deployments, you can use the subgraph name string (constructed as `messari/PROTOCOL-VERSION-NETWORK`, for example `messari/uniswap-v3-ethereum`).

### Deployment Tiles

This section contains deployments from a hardcoded list of protocols deployed on the hosted service for easy access. Each protocol section is divided into each network the subgraph has a deployment for. The indexing status is pulled for each subgraph. If there was a fatal error in the indexing process, the deployment tile is highlighted in Red and provides a small amount of information about where/when the error occurred. If a subgraph deployment is not the latest schema version, it is highlighted in yellow. If a subgraph deployment is the latest schema version and has reached 100% indexed status, it is highlighted in green.

Clicking on a tile loads that subgraph into the validation dashboard. Subgraphs with fatal errors cannot validate any data, however clicking on these tiles gives a some more insight into the fatal error.

## Protocol Dashboard

Upon entering a subgraph to query/clicking on a deployment tile, the application loads a query param with the subgraph currently being validated. As the subgraph's data loads, you will see a header with subgraph metadata such as name, schema version, and protocol type. After the data is returned and processed, new header sections appear. If there are warnings/errors detected from the data returned, a box will appear with numbered messages about inconsistencies or issues with the data. Generally, the order of warnings are not based on priority but rather when they came up in execution. Error/warning handling is a work in progress and may miss some fields or show duplicate messages. The next header section are the page tabs. These toggle the view between Protocol level data, Pool level data, and event data. Because of the nature of loading all of the different data between tabs, if clicking on a tab is not immediately responsive wait a few seconds and it should load the correct page. If the Protocol Dashboard is loaded from the deployment screen or from being linked without a specified tab as a query param, the Protocol tab is loaded by default. 

Unless the user is brought to the Validation dashboard by a link with a poolId query param speicified, there is no pool selected by default. If no pool is currently selected, switching to the Pool or Events tabs shows a pool selection input. It is a text input/drop down combo box. Once an option is selected, the query to pull the pool data is sent.

Amongst all of these tabs, every section contains a button with text along the lines of "Copy Link To financialsDailySnapshots-totalValueLockedUSD". This button copies a link to that specific section to make it easier to share and point to a specific chart or table. If this is on pool level/event data, the poolId is loaded into this link to bring the user directly to that element on the specified pool.

### Protocol Tab

Protocol level data involves subgraph data that does not apply to any specific pool. The table at the top of the page displays all of the data on the protocol entity (for DEXs "dexAmmProtocols", for lending "lendingProtocols", and for yield protocols "yieldAggregators"). The left side of the table is the field name followed by its specified type in the schema. The right side is the current value of that field in the protocol entity.

Below the table, timeseries data is divided into their own sections. On the Protocol level the timeseries entities are `financialsDailySnapshots`, `usageMetricsDailySnapshots`, and depending on the subgraph schema version possibly `usageMetricsHourlySnapshots`. All of the fields on these entities are mapped through and rendered into charts plotting each data point on a given snapshot.

### Pool Tab

Before a pool is selected, a text input/drop down box appears prompting selection. Once a pool is selected, a query is sent to pull the appropriate pool data. 

Once pool data is loaded, the top of the page displays a table containing data on the pool entity (for DEXs "liquidityPool", for lending "market", and for yield protocols "vault"). The left side of the table is the field name followed by its specified type in the schema. The right side is the current value of that field in the pool entity.

Below the table, timeseries data is divided into their own sections. On the Pool level the timeseries entities are `...DailySnapshots`, and `...HourlySnapshots` for the given pool. All of the fields on these entities are mapped through and rendered into charts plotting each data point on a given snapshot. Data for fields with multiple indexes are broken down into their own charts. For example, timeseries data involving reward tokens are broken down into a chart for each reward token. The broken down charts are labeled by name or index in the array. 

### Events Tab

Before a pool is selected, a text input/drop down box appears prompting selection. Once a pool is selected, a query is sent to pull the appropriate event data on the pool. 

Once the pool data is loaded, a table for each event type is loaded. The table contains entries for each instance of an event. If an event type for the protocol type has no instances, a message is rendered in place of the event table.

## Troubleshooting

In the case of data appearing differently as expected, here are some things to do to verify and correct the data. If any issues arise or if you suspect something is erroneous on the dashboard, please leave a message in the 'Validation-Dashboard' Discord channel.

-Upon entering a subgraph to validate, if an error is received saying `Required schema fields are missing from this subgraph. Verify that your schema has all of the fields that are in the common ***** schema.`, the specified field is required for the protocol type but is missing from the subgraph. 

-Check the schema for that data field and check that the data is being saved in the correct unit

-For data involving tokens, the Validation assumes that the token amount has not been converted with decimals. Make sure that the tokens on a pool have the correct value for decimals.

-For zero values in the timeseries tables, make sure that the field is being saved on the snapshot

