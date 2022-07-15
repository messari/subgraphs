#!/bin/bash
# set -x

# Timestamp
ZULU_TODAY=`gdate -d @$1 --utc +%FT%T.%3NZ`
ZULU_TT_TODAY="`printf $ZULU_TODAY | cut -d'T' -f1`T00:00:00.000Z"
ZULU_TT_TOMORROW=`gdate --date "$ZULU_TT_TODAY + 1 day" --utc +%FT%T.%3NZ`
EPOCH_TODAY=`gdate --date "$ZULU_TT_TODAY"  +%s`
EPOCH_TOMORROW=`gdate --date "$ZULU_TT_TODAY + 1 day" +%s`

printf "\n[+] Timestamps................"
printf "\n...Input Timestamp: $1"
printf "\n...Zulu (Input): $ZULU_TODAY"
printf "\n...Zulu Today Timestamp for Token Terminal: $ZULU_TT_TODAY"
printf "\n...Zulu Tomorrow Timestamp for Token Terminal: $ZULU_TT_TOMOROW"
printf "\n...Epoch Timestamp for Subgraph Query: $EPOCH_TODAY"
printf "\n...Epoch +1 day Timestamp for Subgraph Query: $EPOCH_TOMORROW"


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
            financialMetrics (where: {timestamp_gt: $EPOCH_TODAY, timestamp_lt: $EPOCH_TOMORROW }) { 
                id
                protocol { id }
                totalValueLockedUSD
                protocolControlledValueUSD
                dailySupplySideRevenueUSD
                cumulativeSupplySideRevenueUSD
                dailyProtocolSideRevenueUSD
                cumulativeProtocolSideRevenueUSD
                dailyTotalRevenueUSD
                cumulativeTotalRevenueUSD
                blockNumber
                timestamp

            }
            dailyUsageMetrics (where: {timestamp_gt: $EPOCH_TODAY, timestamp_lt: $EPOCH_TOMORROW }) { 
                id
                dailyActiveUsers
                cumulativeUniqueUsers
                dailyTransactionCount
                totalPoolCount
                blockNumber
                timestamp
            }
            hourlyUsageMetrics (orderBy: id, orderDirection: desc, first: 1, where: {timestamp_gt: $EPOCH_TODAY, timestamp_lt: $EPOCH_TOMORROW }) { 
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
                dailySnapshots (where: {timestamp_gt: $EPOCH_TODAY, timestamp_lt: $EPOCH_TOMORROW }) { 
                    id 
                    blockNumber
                    timestamp
                    totalValueLockedUSD
                    cumulativeSupplySideRevenueUSD
                    dailySupplySideRevenueUSD
                    cumulativeProtocolSideRevenueUSD
                    dailyProtocolSideRevenueUSD
                    cumulativeTotalRevenueUSD
                    dailyTotalRevenueUSD
                    inputTokenBalances
                    outputTokenSupply
                    outputTokenPriceUSD
                    stakedOutputTokenAmount
                    rewardTokenEmissionsAmount
                    rewardTokenEmissionsUSD
                }
                hourlySnapshots (where: {timestamp_gt: $EPOCH_TODAY, timestamp_lt: $EPOCH_TOMORROW }) {
                    id
                    blockNumber
                    timestamp
                    totalValueLockedUSD
                    cumulativeSupplySideRevenueUSD
                    hourlySupplySideRevenueUSD
                    cumulativeProtocolSideRevenueUSD
                    hourlyProtocolSideRevenueUSD
                    cumulativeTotalRevenueUSD
                    hourlyTotalRevenueUSD
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
printf "\n\n[+] SUBGRAPH: $2 .................\n"
for each in "${@:3}"; do 
    printf "\n ......getting... $each\n"
    curl -s -L -H "Content-Type: application/json" -X POST -d @query.json $2 | \
        jq --arg param "$each" -r ".[].protocols[] | \
            {\"protocol.$each\": .$each, \
            \"financialMetrics[].$each\": .financialMetrics[].$each, \
            \"pools[].$each\": .pools[].$each, \
            \"pools[].dailySnapshots[].$each\": .pools[].dailySnapshots[].$each, \
            \"pools[].hourlySnapshots[].$each\": .pools[].hourlySnapshots[].$each}"

done

printf "\n ......getting usage metrics... \n"
curl -s -L -H "Content-Type: application/json" -X POST -d @query.json $2 | \
    jq ".[].protocols[] | .dailyUsageMetrics[], .hourlyUsageMetrics[]"
        # {\".dailyUsageMetrics\": .dailyUsageMetrics[], \
        # \".hourlyUsageMetrics\": .hourlyUsageMetrics[]}"


# Print tokenterminal metrics
printf "\n\n[+] TOKEN TERMINAL.............\n"
TIMESTAMP="$ZULU_TT_TOMORROW" jq '.[] | select(.timestamp == env.TIMESTAMP)' metrics-daily-2022-07-10.json | grep "timestamp\|revenue\|tvl"

# There is more magic we can do with shell + jq  here to customize comparison per metric further.


# Cleanup
rm query.json
