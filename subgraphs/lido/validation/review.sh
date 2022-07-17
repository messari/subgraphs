#!/bin/bash
# set -x

# vars
GRAPH_API_URL=$1

## Let's say I enter three timestamps
# 2022-07-01
# 2022-01-01
# 2021-06-01
for each in "${@:2}"
    do 
        printf "=================== %s" "$each"
        # Timestamp
        ZULU_TODAY=`gdate -d $each --utc +%FT%T.%3NZ`
        ZULU_TT_TODAY="`printf $ZULU_TODAY | cut -d'T' -f1`T00:00:00.000Z"
        ZULU_TT_YESTERDAY=`gdate --date "$ZULU_TT_TODAY - 1 day" --utc +%FT%T.%3NZ`
        EPOCH_TODAY=`gdate --date "$ZULU_TT_TODAY"  +%s`
        EPOCH_YESTERDAY=`gdate --date "$ZULU_TT_TODAY - 1 day" +%s`

        printf "\n[+] Timestamps................"
        printf "\n...Input Timestamp: $each"
        printf "\n...Zulu (Input): $ZULU_TODAY"
        printf "\n...Zulu Today Timestamp for Token Terminal: $ZULU_TT_TODAY"
        printf "\n...Zulu Yesterday Timestamp for Token Terminal: $ZULU_TT_YESTERDAY"
        printf "\n...Epoch Today Timestamp for Subgraph Query: $EPOCH_TODAY"
        printf "\n...Epoch Yesterday Timestamp for Subgraph Query: $EPOCH_YESTERDAY"
        printf "\n"


        cat << EOF > query.json
        { 
            "query": "{
                protocols {
                    id
                    name
                    slug
                    schemaVersion
                    subgraphVersion
                    methodologyVersion
                    network
                    type
                    totalValueLockedUSD
                    protocolControlledValueUSD
                    cumulativeSupplySideRevenueUSD
                    cumulativeProtocolSideRevenueUSD
                    cumulativeTotalRevenueUSD
                    cumulativeUniqueUsers
                    totalPoolCount
                    financialMetrics (where: {timestamp_gt: $EPOCH_YESTERDAY, timestamp_lt: $EPOCH_TODAY }) { 
                        id
                        protocol { id }
                        totalValueLockedUSD
                        protocolControlledValueUSD
                        dailySupplySideRevenueUSD
                        dailyProtocolSideRevenueUSD
                        dailyTotalRevenueUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                        blockNumber
                        timestamp

                    }
                    dailyUsageMetrics (where: {timestamp_gt: $EPOCH_YESTERDAY, timestamp_lt: $EPOCH_TODAY }) { 
                        id
                        dailyActiveUsers
                        cumulativeUniqueUsers
                        dailyTransactionCount
                        totalPoolCount
                        blockNumber
                        timestamp
                    }
                    hourlyUsageMetrics (orderBy: id, orderDirection: desc, first: 1, where: {timestamp_gt: $EPOCH_YESTERDAY, timestamp_lt: $EPOCH_TODAY }) { 
                        id
                        hourlyActiveUsers
                        cumulativeUniqueUsers
                        hourlyTransactionCount
                        blockNumber
                        timestamp
                    }
                    pools {
                        id
                        protocol { id }
                        name
                        symbol
                        inputTokens { id lastPriceUSD }
                        outputToken { id lastPriceUSD }
                        rewardTokens { id }
                        createdTimestamp
                        createdBlockNumber
                        totalValueLockedUSD
                        cumulativeSupplySideRevenueUSD
                        cumulativeProtocolSideRevenueUSD
                        cumulativeTotalRevenueUSD
                        inputTokenBalances
                        outputTokenSupply
                        outputTokenPriceUSD
                        stakedOutputTokenAmount
                        rewardTokenEmissionsAmount
                        rewardTokenEmissionsUSD
                        dailySnapshots (where: {timestamp_gt: $EPOCH_YESTERDAY, timestamp_lt: $EPOCH_TODAY }) { 
                            id 
                            blockNumber
                            timestamp
                            totalValueLockedUSD
                            dailySupplySideRevenueUSD
                            dailyProtocolSideRevenueUSD
                            dailyTotalRevenueUSD
                            cumulativeSupplySideRevenueUSD
                            cumulativeProtocolSideRevenueUSD
                            cumulativeTotalRevenueUSD
                            inputTokenBalances
                            outputTokenSupply
                            outputTokenPriceUSD
                            stakedOutputTokenAmount
                            rewardTokenEmissionsAmount
                            rewardTokenEmissionsUSD
                        }
                        hourlySnapshots (where: {timestamp_gt: $EPOCH_YESTERDAY, timestamp_lt: $EPOCH_TODAY }) {
                            id
                            blockNumber
                            timestamp
                            totalValueLockedUSD
                            hourlySupplySideRevenueUSD
                            hourlyProtocolSideRevenueUSD
                            hourlyTotalRevenueUSD
                            cumulativeSupplySideRevenueUSD
                            cumulativeProtocolSideRevenueUSD
                            cumulativeTotalRevenueUSD
                            inputTokenBalances
                            outputTokenSupply
                            outputTokenPriceUSD
                            stakedOutputTokenAmount
                            rewardTokenEmissionsAmount
                            rewardTokenEmissionsUSD

                        }
                    }
                }
            }"
        }
EOF

        # Print fortysevenlabs/lido subgraph metrics
        printf "\n[+] SUBGRAPH: $2 ................."
        printf "\n... getting subgraph ..."
        curl -s -L -H "Content-Type: application/json" -X POST -d @query.json $GRAPH_API_URL > subgraph_output.json


        # for each in pools; do 
        #     printf "\n ......getting... $each\n"
        #     curl -s -L -H "Content-Type: application/json" -X POST -d @query.json $2 > subgraph_output.json
        #         jq --arg param "$each" -r ".[].protocols[] | \
        #             {\"protocol.$each\": .$each, \
        #             \"financialMetrics[].$each\": .financialMetrics[].$each, \
        #             \"pools[].$each\": .pools[].$each, \
        #             \"pools[].dailySnapshots[].$each\": .pools[].dailySnapshots[].$each, \
        #             \"pools[].hourlySnapshots[].$each\": .pools[].hourlySnapshots[].$each}"
        # done


        printf "\n... Financial metrics...\n"
        jq '.[].protocols[0].financialMetrics[0]' subgraph_output.json
        printf "\n... Protocol Daily Usage ...\n"
        jq '.[].protocols[0].dailyUsageMetrics[0]' subgraph_output.json
        printf "\n... Protocol Hourly Usage...\n"
        jq '.[].protocols[0].hourlyUsageMetrics[0]' subgraph_output.json
        printf "\n... Pool Daily Snapshot ...\n"
        jq '.[].protocols[0].pools[].dailySnapshots[]' subgraph_output.json
        printf "\n... Pool Hourly Snapshot ...\n"
        jq '.[].protocols[0].pools[].hourlySnapshots[]' subgraph_output.json

        # Print tokenterminal metrics
        printf "\n\n[+] TOKEN TERMINAL.............\n"
        # daily
        # TIMESTAMP="$ZULU_TT_TODAY" jq '.[] | select(.timestamp == env.TIMESTAMP)' metrics-daily-2022-07-10.json | grep "timestamp\|revenue\|tvl"
        TODAY_TOTAL_REVENUE=`TIMESTAMP="$ZULU_TT_TODAY" jq '.[] | select(.timestamp == env.TIMESTAMP) | .revenue_total' metrics-daily-2022-07-10.json`
        TODAY_PROTOCOL_REVENUE=`TIMESTAMP="$ZULU_TT_TODAY" jq '.[] | select(.timestamp == env.TIMESTAMP) | .revenue_protocol' metrics-daily-2022-07-10.json`
        TODAY_SUPPLY_REVENUE=`TIMESTAMP="$ZULU_TT_TODAY" jq '.[] | select(.timestamp == env.TIMESTAMP) | .revenue_supply_side' metrics-daily-2022-07-10.json`
        D_TVL=`TIMESTAMP="$ZULU_TT_TODAY" jq '.[] | select(.timestamp == env.TIMESTAMP) | .tvl' metrics-daily-2022-07-10.json`
        # cumulative calculation
        
        CUMULATIVE_TOTAL_REVENUE=`jq '.[].revenue_total' metrics-monthly-2022-07-10.json | jq --slurp '. | add'`
        CUMULATIVE_PROTOCOL_REVENUE=`jq '.[].revenue_protocol' metrics-monthly-2022-07-10.json | jq --slurp '. | add'`
        CUMULATIVE_SUPPLY_REVENUE=`jq '.[].revenue_supply_side' metrics-monthly-2022-07-10.json | jq --slurp '. | add'`
        M_TVL=`TIMESTAMP="$ZULU_TT_TODAY" jq '.[] | select(.timestamp == env.TIMESTAMP) | .tvl' metrics-monthly-2022-07-10.json`

        printf "TODAY_TOTAL_REVENUE: %s\n" "$TODAY_TOTAL_REVENUE"
        printf "TODAY_PROTOCOL_REVENUE: %s\n" "$TODAY_PROTOCOL_REVENUE"
        printf "TODAY_SUPPLY_REVENUE: %s\n" "$TODAY_SUPPLY_REVENUE"
        printf "CUMULATIVE_TOTAL_REVENUE: %s\n" "$CUMULATIVE_TOTAL_REVENUE"
        printf "CUMULATIVE_PROTOCOL_REVENUE: %s\n" "$CUMULATIVE_PROTOCOL_REVENUE"
        printf "CUMULATIVE_SUPPLY_REVENUE: %s\n" "$CUMULATIVE_SUPPLY_REVENUE"
        printf "D_TVL: %s\n" "$D_TVL"
        printf "M_TVL: %s\n" "$M_TVL"

        # Cleanup
        rm subgraph_output.json
        rm query.json
    done
