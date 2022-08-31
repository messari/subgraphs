import axios from "axios";

export const lendingPoolLevel = async (deployments) => {
    const endpointsList = [];
    Object.keys(deployments).forEach((depo) => {
        if (
            !deployments[depo].indexingError &&
            deployments[depo].protocolType.toUpperCase() === "LENDING"
        ) {
            endpointsList.push(deployments[depo].url);
        }
    });

    console.log(endpointsList)
    const baseQuery = `
    query MyQuery {
        protocols {
            id
            name
            type
            schemaVersion
        }
      markets(first: 10) {
        id
        name
        totalValueLockedUSD
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        cumulativeDepositUSD
        cumulativeBorrowUSD
        cumulativeLiquidateUSD
        totalBorrowBalanceUSD
        totalDepositBalanceUSD
        outputTokenSupply
        outputTokenPriceUSD
      }
    }`;

    const promiseArr = [];

    endpointsList.forEach((endpoint) => {
        promiseArr.push(
            axios.post(
                endpoint,
                { query: baseQuery },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
        );
    });

    let marketLevelData = [];
    await Promise.all(promiseArr)
        .then(
            (response) =>
            (marketLevelData = response.map((marketData) => {
                return {
                    markets: marketData?.data?.data?.markets || [],
                    url: marketData.config.url,
                    deployment: Object.keys(deployments).find((key) => deployments[key].url === marketData.config.url) || marketData.config.url.split("messari/")[1],
                };
            }))
        )
        .catch((err) => console.log(err));

    marketLevelData.forEach((protocol, idx) => {
        console.log('marketLevelData', protocol.deployment, idx)
        if (!protocol?.markets) return;
        const data = protocol.markets;
        if (!data?.length) return;
        const url = protocol.url;
        // const dataFields = Object.keys(data)

        const deploymentName = protocol.deployment;
        const deployment = { ...deployments[deploymentName] };

        const issuesArrays = { ...deployment.poolErrors };

        data.forEach((instance) => {
            const buildIssue = (value) => instance.id;
            let currentIssueField = "totalValueLockedUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) > 1000 &&
                    parseFloat(instance[currentIssueField]) < 100000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeSupplySideRevenueUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 100 &&
                    parseFloat(instance[currentIssueField]) <= 10000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeProtocolSideRevenueUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 100 &&
                    parseFloat(instance[currentIssueField]) <= 10000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeTotalRevenueUSD";
            if (
                (
                    parseFloat(instance.cumulativeProtocolSideRevenueUSD) +
                    parseFloat(instance.cumulativeSupplySideRevenueUSD)
                ).toFixed(2) !== parseFloat(instance[currentIssueField]).toFixed(2) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                const value = ((parseFloat(instance.cumulativeProtocolSideRevenueUSD) +
                    parseFloat(instance.cumulativeSupplySideRevenueUSD)) +
                    "||" +
                    parseFloat(data[currentIssueField]).toFixed(2) +
                    "=" +
                    parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2) +
                    "+" +
                    parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2))
                issuesArrays[currentIssueField].push(buildIssue(value));
            }

            currentIssueField = "cumulativeDepositUSD";
            if (!(parseFloat(instance[currentIssueField]) > 100) && !issuesArrays[currentIssueField]?.includes(instance.id)) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField])));
            }

            if (
                !(
                    parseFloat(instance.cumulativeDepositUSD) >=
                    parseFloat(instance.cumulativeBorrowUSD)
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays.cumulativeBorrowUSD.push(buildIssue(instance.cumulativeBorrowUSD + " > " + instance.cumulativeDepositUSD));
            }

            currentIssueField = "cumulativeLiquidateUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) <=
                    parseFloat(instance.cumulativeBorrowUSD)
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]) + " > " + parseFloat(instance.cumulativeBorrowUSD)));
            }

            currentIssueField = "totalBorrowBalanceUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) <=
                    parseFloat(instance.cumulativeBorrowUSD)
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField] + " < " + instance.cumulativeBorrowUSD));
            }

            currentIssueField = "totalDepositBalanceUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >=
                    parseFloat(instance.totalBorrowBalanceUSD)
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField] + " < " + instance.totalBorrowBalanceUSD));
            }

            currentIssueField = "outputTokenSupply";
            if (!(parseFloat(instance[currentIssueField]) >= 0) && !issuesArrays[currentIssueField]?.includes(instance.id)) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField]));
            }

            currentIssueField = "outputTokenPriceUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 0 &&
                    parseFloat(instance[currentIssueField]) <= 100000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField]));
            }

        })

        deployments[deploymentName].poolErrors = issuesArrays;
    });

    const depoHolder = {};
    Object.keys(deployments).forEach((x) => {
        depoHolder[x] = { ...deployments[x] };
        const key = depoHolder[x].poolErrors;
        Object.keys(key).forEach((y) => {
            if (key[y].length !== 0) {
                depoHolder[x].poolErrors[y] = key[y];
            }
        });
    });
    return depoHolder;
}
