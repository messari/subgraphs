import { Box, CircularProgress, Tooltip } from "@mui/material";
import { DataGrid, GridColumnHeaderParams } from "@mui/x-data-grid";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { blockExplorers } from "../../constants";
import { formatIntToFixed2, tableCellTruncate } from "../../utils";

interface TablePoolOverviewProps {
  datasetLabel: string;
  dataTable: any;
  protocolType: string;
  protocolNetwork: string;
  skipAmt: number;
  tablePoolOverviewLoading: boolean;
  issueProps: { message: string; type: string; level: string; fieldName: string }[];
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  setIssues: React.Dispatch<{ message: string; type: string; level: string; fieldName: string }[]>;
}

export const TablePoolOverview = ({
  datasetLabel,
  dataTable,
  protocolType,
  protocolNetwork,
  skipAmt,
  tablePoolOverviewLoading,
  issueProps,
  handleTabChange,
  setPoolId,
  setIssues,
}: TablePoolOverviewProps) => {
  const navigate = useNavigate();
  const issues: { message: string; type: string; level: string; fieldName: string }[] = [...issueProps];
  useEffect(() => {
    if (JSON.stringify(issues) !== JSON.stringify(issueProps)) {
      setIssues(issues);
    }
  });
  if (dataTable) {
    const optionalFields = [];
    let baseFieldCol = false;
    let inputTokenLabel = "Input Token";
    let inputTokenColWidth = 210;
    if (protocolType === "EXCHANGE" || protocolType === "GENERIC" || protocolType === "PERPETUAL") {
      inputTokenLabel = "Input Tokens";
      inputTokenColWidth = 220;
    }
    if (protocolType === "EXCHANGE" || protocolType === "GENERIC" || protocolType === "YIELD") {
      optionalFields.push({
        field: "baseYield",
        headerName: "Base Yield %",
        type: "number",
        width: 180,
        renderCell: (params: any) => {
          let value = Number(params?.value);
          value = Number(formatIntToFixed2(value));
          const cellStyle = { ...tableCellTruncate };
          cellStyle.width = "100%";
          cellStyle.textAlign = "right";
          let hoverText = params?.row?.BYFactorsStr;
          if (params?.row?.dailyVolumeUSD === null && params?.row?.dailySupplySideRevenueUSD === null) {
            return (
              <span style={cellStyle}>
                <CircularProgress size={30} />
              </span>
            );
          }
          return (
            <Tooltip title={hoverText}>
              <span style={cellStyle}>{value + (isNaN(Number(value)) ? "" : "%")}</span>
            </Tooltip>
          );
        },
        renderHeader: (params: GridColumnHeaderParams) => {
          return (
            <span style={{ width: "180px", textAlign: "right", marginRight: "10px", fontWeight: "500" }}>
              Base Yield %
            </span>
          );
        },
      });
      baseFieldCol = true;
    }
    let columns = [
      { field: "idx", headerName: "#", width: 12 },
      {
        field: "name",
        headerName: "Name",
        width: 200,
        renderCell: (params: any) => {
          let nameStr = params.value;
          if (nameStr.length > 20) {
            nameStr = `${params.value.slice(0, 9)}...${params.value.slice(
              params.value.length - 10,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{nameStr}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "poolId",
        headerName: "Pool ID",
        width: 280,
        renderCell: (params: any) => {
          let poolIdStr = params?.value;
          if (poolIdStr?.length > 40) {
            poolIdStr = `${params?.value?.slice(0, 14)}...${params?.value?.slice(
              params.value.length - 15,
              params.value.length,
            )}`;
          }
          let onClick = undefined;
          const blockExplorerUrlBase = blockExplorers[protocolNetwork?.toUpperCase()];
          if (blockExplorerUrlBase) {
            onClick = () => (window.location.href = blockExplorerUrlBase + "address/" + params.value);
          }
          return (
            <Tooltip title={params.value}>
              <span onClick={onClick} style={tableCellTruncate}>
                {poolIdStr}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "inputToken",
        headerName: inputTokenLabel,
        width: inputTokenColWidth,
        renderCell: (params: any) => {
          if (!params?.row?.inputTokens && !params?.row?.inputToken) {
            return (
              <span>
                <CircularProgress size={30} />
              </span>
            );
          }
          let inputTokenStr = params?.value;
          if (inputTokenStr?.length > 23) {
            inputTokenStr = `${params.value.slice(0, 10)}...${params.value.slice(
              params.value.length - 10,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{inputTokenStr}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "tvl",
        headerName: "TVL (USD)",
        width: 180,
        renderCell: (params: { [x: string]: any }) => {
          const val = "$" + Number(params.value.toFixed(2)).toLocaleString();
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{val}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "rewardTokens",
        headerName: "Reward Tokens",
        width: inputTokenColWidth,
        renderCell: (params: { [x: string]: any }) => {
          if (params?.row?.rewardTokens === null || params?.row?.rewardTokens === undefined) {
            return (
              <span>
                <CircularProgress size={30} />
              </span>
            );
          }
          let rewardTokenStr = params.value.split("//")[0];
          if (rewardTokenStr.length > 18) {
            rewardTokenStr = `${rewardTokenStr.slice(0, 8)}...${rewardTokenStr.slice(
              rewardTokenStr.length - 7,
              rewardTokenStr.length,
            )}`;
          }
          let hoverStr = rewardTokenStr;
          if (params.value.split("//").length > 1) {
            hoverStr = params.value.split("//")[1];
          }
          return (
            <Tooltip title={hoverStr}>
              <span style={tableCellTruncate}>{rewardTokenStr}</span>
            </Tooltip>
          );
        },
      },
    ];
    columns = columns.concat(optionalFields);
    const tableData = dataTable.map((pool: { [x: string]: any }, idx: number) => {
      let inputTokenSymbol = pool?.inputToken?.symbol;
      if (pool.inputTokens) {
        inputTokenSymbol = pool.inputTokens.map((tok: { [x: string]: any }) => tok.symbol).join(", ");
      }
      const returnObj: { [x: string]: any } = {
        id: idx + 1 + skipAmt,
        idx: idx + 1 + skipAmt,
        name: pool.name || "N/A",
        poolId: pool.id,
        inputToken: inputTokenSymbol,
        tvl: Number(pool.totalValueLockedUSD),
        rewardTokens: "",
      };
      if (
        Number(pool.totalValueLockedUSD) > 1000000000000 &&
        issues.filter((iss: { [x: string]: any }) => iss.fieldName === `#${idx + 1 + skipAmt} - ${pool.name || "N/A"}`)
          .length === 0
      ) {
        issues.push({
          type: "TVL+",
          message: "",
          level: "warning",
          fieldName: `#${idx + 1 + skipAmt} - ${pool.name || "N/A"}`,
        });
      }

      if (pool.rewardTokens?.length > 0) {
        const rewardTokenSymbol = pool.rewardTokens.map((tok: any) => {
          if (tok?.symbol) {
            return tok.symbol;
          } else if (tok?.token?.symbol) {
            return tok?.token?.symbol;
          }
          return "N/A";
        });
        const tokenFieldDiff = pool.rewardTokens?.length - pool.rewardTokenEmissionsUSD?.length;
        if (
          tokenFieldDiff !== 0 &&
          issues.filter((iss: { [x: string]: any }) => iss.type === "TOK" && iss.fieldName.includes(pool.name))
            .length === 0
        ) {
          if (pool.rewardTokens?.length > pool.rewardTokenEmissionsUSD?.length) {
            issues.push({
              type: "TOK",
              level: "error",
              fieldName: `${pool.name}-rewardTokens///${pool.rewardTokens?.length - 1}`,
              message: `rewardTokenEmissionsUSD///(${pool.rewardTokenEmissionsUSD?.length - 1})`,
            });
          } else if (pool.rewardTokens?.length < pool.rewardTokenEmissionsUSD?.length) {
            issues.push({
              type: "TOK",
              level: "error",
              fieldName: `${pool.name}-rewardTokenEmissionsUSD///${pool.rewardTokenEmissionsUSD?.length - 1}`,
              message: `rewardTokens///${pool.rewardTokens?.length - 1}`,
            });
          }
        }

        const rewardFactors: string[] = [];
        let rewardFactorsStr = "N/A";
        let rewardAPRs: string[] = pool?.rewardTokenEmissionsUSD?.map((val: string, idx: number) => {
          let apr = 0;
          if (
            protocolType === "LENDING" &&
            (pool.rewardTokens[idx]?.type?.includes("BORROW") ||
              pool.rewardTokens[idx]?.token?.type?.includes("BORROW"))
          ) {
            if (
              !Number(pool.totalBorrowBalanceUSD) &&
              issues.filter(
                (iss: { [x: string]: any }) =>
                  iss.fieldName === `${pool.name || "#" + idx + 1 + skipAmt}-totalBorrowBalanceUSD-pool value`,
              ).length === 0
            ) {
              issues.push({
                type: "VAL",
                message: `${
                  pool.name || "#" + idx + 1 + skipAmt
                } does not have a valid 'totalBorrowBalanceUSD' value. Reward APR (BORROWER) could not be properly calculated.`,
                level: "critical",
                fieldName: `${pool.name || "#" + idx + 1 + skipAmt}-totalBorrowBalanceUSD-pool value`,
              });
            } else if (Number(pool.totalBorrowBalanceUSD)) {
              apr = (Number(val) / Number(pool.totalBorrowBalanceUSD)) * 100 * 365;
              rewardFactorsStr = `(${Number(val).toFixed(2)} (Daily Reward Emissions) / ${Number(
                pool.totalBorrowBalanceUSD,
              ).toFixed(2)} (Borrow balance)) * 100 * 365 = ${apr.toFixed(2)}%`;
            }
          } else if (protocolType === "LENDING") {
            if (
              !Number(pool.totalDepositBalanceUSD) &&
              !Number(pool.totalValueLockedUSD) &&
              issues.filter(
                (iss: { [x: string]: any }) =>
                  iss.fieldName ===
                  `${pool.name || "#" + idx + 1 + skipAmt} - totalDepositBalanceUSD / totalValueLockedUSD - pool value`,
              ).length === 0
            ) {
              issues.push({
                type: "VAL",
                message: `${
                  pool.name || "#" + idx + 1 + skipAmt
                } does not have a valid 'totalDepositBalanceUSD' nor 'totalValueLockedUSD' value. Neither Reward APR (DEPOSITOR) nor Base Yield could be properly calculated.`,
                level: "critical",
                fieldName: `${
                  pool.name || "#" + idx + 1 + skipAmt
                } - totalDepositBalanceUSD / totalValueLockedUSD - pool value`,
              });
            } else if (pool.totalDepositBalanceUSD) {
              apr = (Number(val) / Number(pool.totalDepositBalanceUSD)) * 100 * 365;
              rewardFactorsStr = `(${Number(val).toFixed(2)}(Daily Reward Emissions) / ${Number(
                pool.totalDepositBalanceUSD,
              ).toFixed(2)} (Deposit balance)) * 100 * 365 = ${apr.toFixed(2)}% `;
            } else if (Number(pool.totalValueLockedUSD)) {
              apr = (Number(val) / Number(pool.totalValueLockedUSD)) * 100 * 365;
              rewardFactorsStr = `(${Number(val).toFixed(2)}(Daily Reward Emissions) / ${Number(
                pool.totalValueLockedUSD,
              ).toFixed(2)} (TVL)) * 100 * 365 = ${apr.toFixed(2)}% `;
            }
          } else {
            let outputStakedFactor = Number(pool?.stakedOutputTokenAmount) / Number(pool?.outputTokenSupply);
            if (!outputStakedFactor) {
              outputStakedFactor = 1;
            }
            apr = (Number(val) / (Number(pool.totalValueLockedUSD) * outputStakedFactor)) * 100 * 365;
            rewardFactorsStr = `(${Number(val).toFixed(2)}(Daily Reward Emissions) / (${Number(
              pool.totalValueLockedUSD,
            ).toFixed(2)} (TVL) * (${Number(pool?.stakedOutputTokenAmount)} (Staked Output Token) / ${Number(
              pool?.outputTokenSupply,
            )} (Output Token Supply)))) * 100 * 365 = ${apr.toFixed(2)}% `;
          }
          if (
            Number(apr) === 0 &&
            issues.filter(
              (iss: { [x: string]: any }) =>
                iss.fieldName ===
                `${pool.name || "Pool " + idx + 1 + skipAmt} ${rewardTokenSymbol[idx] || "N/A"} RewardAPR`,
            ).length === 0
          ) {
            issues.push({
              type: "RATEZERO",
              message: "",
              level: "warning",
              fieldName: `${pool.name || "Pool " + idx + 1 + skipAmt} ${rewardTokenSymbol[idx] || "N/A"} RewardAPR`,
            });
          }
          if (
            isNaN(apr) &&
            issues.filter(
              (iss: { [x: string]: any }) =>
                iss.fieldName ===
                `${pool.name || "Pool " + idx + 1 + skipAmt} ${rewardTokenSymbol[idx] || "N/A"} RewardAPR`,
            ).length === 0
          ) {
            issues.push({
              type: "NAN",
              message: "",
              level: "critical",
              fieldName: `${pool.name || "Pool " + idx + 1 + skipAmt} ${rewardTokenSymbol[idx] || "N/A"} RewardAPR`,
            });
          }
          if (
            Number(apr) < 0 &&
            issues.filter(
              (iss: { [x: string]: any }) =>
                iss.fieldName ===
                `${pool.name || "Pool " + idx + 1 + skipAmt} ${rewardTokenSymbol[idx] || "N/A"} RewardAPR`,
            ).length === 0
          ) {
            issues.push({
              type: "RATENEG",
              message: "",
              level: "critical",
              fieldName: `${pool.name || "Pool " + idx + 1 + skipAmt} ${rewardTokenSymbol[idx] || "N/A"} RewardAPR`,
            });
          }
          rewardFactors.push("Token [" + idx + "] " + rewardFactorsStr);
          return Number(apr).toFixed(2) + "%";
        });
        if (!rewardAPRs) {
          rewardAPRs = [];
        }
        const rewardTokenCell = rewardTokenSymbol.map((tok: string, idx: number) => {
          let str = `0.00 % ${tok} `;
          if (rewardAPRs[idx]) {
            str = `${rewardAPRs[idx]} ${tok} `;
          }
          return str;
        });

        returnObj.rewardTokens = rewardTokenCell.join(", ") + "//" + rewardFactors.join("  ||  ");
      } else if (Object.keys(pool).includes("rewardTokens")) {
        returnObj.rewardTokens = "No Reward Token";
      } else {
        returnObj.rewardTokens = null;
      }
      if (baseFieldCol) {
        returnObj.dailyVolumeUSD = null;
        returnObj.dailySupplySideRevenueUSD = null;

        returnObj.baseYield = 0;
        if (pool?.totalValueLockedUSD && (pool?.dailyVolumeUSD || pool?.dailySupplySideRevenueUSD)) {
          returnObj.dailyVolumeUSD = pool?.dailyVolumeUSD;
          returnObj.dailySupplySideRevenueUSD = pool?.dailySupplySideRevenueUSD;
          if (pool?.fees?.length > 0 && !pool?.dailySupplySideRevenueUSD) {
            // CURRENTLY THE FEE IS BASED OFF OF THE POOL RATHER THAN THE TIME SERIES. THIS IS TEMPORARY
            const supplierFee = pool.fees.find((fee: { [x: string]: string }) => {
              return fee.feeType === "FIXED_LP_FEE" || fee.feeType === "DYNAMIC_LP_FEE";
            });
            let feePercentage = 0;
            if (supplierFee) {
              feePercentage = Number(supplierFee.feePercentage);
            }
            if (
              feePercentage < 1 &&
              feePercentage !== 0 &&
              issues.filter(
                (iss: { [x: string]: any }) => iss.fieldName === `${pool.name || "#" + idx + 1 + skipAmt} LP Fee`,
              ).length === 0
            ) {
              issues.push({
                type: "RATEDEC",
                message: "1%",
                level: "error",
                fieldName: `${pool.name || "#" + idx + 1 + skipAmt} LP Fee`,
              });
            }
            const volumeUSD = Number(pool?.dailyVolumeUSD) || 0;
            let value = (feePercentage * volumeUSD * 365) / Number(pool.totalValueLockedUSD);
            const factorsStr = `(${feePercentage.toFixed(2)} (LP Fee) * ${volumeUSD.toFixed(
              2,
            )} (Volume 24h) * 365) / ${Number(pool.totalValueLockedUSD).toFixed(2)} (TVL) = ${value.toFixed(2)}%`;
            if ((!value || !Number(pool.totalValueLockedUSD)) && value !== 0) {
              value = 0;
              if (
                issues.filter(
                  (iss: { [x: string]: any }) => iss.fieldName === `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
                ).length === 0
              ) {
                issues.push({
                  type: "NAN",
                  message: "",
                  level: "critical",
                  fieldName: `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
                });
              }
            }
            if (
              value < 0 &&
              issues.filter(
                (iss: { [x: string]: any }) => iss.fieldName === `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
              ).length === 0
            ) {
              issues.push({
                type: "RATENEG",
                message: "",
                level: "critical",
                fieldName: `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
              });
            }
            returnObj.baseYield = value;
            returnObj.BYFactorsStr = factorsStr;
          } else if (pool?.dailySupplySideRevenueUSD) {
            let value = (Number(pool?.dailySupplySideRevenueUSD) * 36500) / Number(pool.totalValueLockedUSD);
            const factorsStr = `(${Number(pool?.dailySupplySideRevenueUSD).toFixed(
              2,
            )} (Daily Supply Side Revenue) * 365 * 100) / ${Number(pool.totalValueLockedUSD).toFixed(
              2,
            )} (TVL) = ${value.toFixed(2)}%`;
            if ((!value || !Number(pool.totalValueLockedUSD)) && value !== 0) {
              value = 0;
              if (
                issues.filter(
                  (iss: { [x: string]: any }) => iss.fieldName === `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
                ).length === 0
              ) {
                issues.push({
                  type: "NAN",
                  message: "",
                  level: "critical",
                  fieldName: `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
                });
              }
            }
            returnObj.baseYield = value;
            returnObj.BYFactorsStr = factorsStr;
          } else {
            if (
              issues.filter(
                (iss: { [x: string]: any }) =>
                  iss.message ===
                  `${pool.name} does not have anything in the "fees" array field. Base yield could not be calculated.`,
              ).length === 0 &&
              issues.filter(
                (iss: { [x: string]: any }) => iss.message === `${pool.name} Base yield could not be calculated.`,
              ).length === 0 &&
              (Object.keys(pool?.fees)?.length === 0 || !pool?.fees)
            ) {
              issues.push({
                type: "val",
                message: `${pool.name} does not have anything in the "fees" array field. Base yield could not be calculated.`,
                level: "critical",
                fieldName: `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
              });
            } else if (
              issues.filter(
                (iss: { [x: string]: any }) =>
                  iss.message ===
                  `${pool.name} does not have anything in the "fees" array field. Base yield could not be calculated.`,
              ).length === 0 &&
              issues.filter(
                (iss: { [x: string]: any }) => iss.message === `${pool.name} Base yield could not be calculated.`,
              ).length === 0
            ) {
              issues.push({
                type: "val",
                message: `${pool.name} Base yield could not be calculated.`,
                level: "critical",
                fieldName: `${pool.name || "#" + idx + 1 + skipAmt} Base Yield`,
              });
            }
            returnObj.baseYield = "N/A";
            returnObj.BYFactorsStr = "Base Yield could not be calculated, no fees or supply side revenue provided.";
          }
        } else {
          returnObj.baseYield = "N/A";
          returnObj.BYFactorsStr = "Base Yield could not be calculated, no fees or supply side revenue provided.";
        }
      }
      return returnObj;
    });
    if (dataTable.length === 0 && tablePoolOverviewLoading) {
      if (issues.filter((iss: { [x: string]: any }) => iss.fieldName === "poolOverview").length === 0) {
        issues.push({
          message: "No pools returned in pool overview.",
          type: "POOL",
          level: "error",
          fieldName: "poolOverview",
        });
      }
    } else if (issues.filter((iss: { [x: string]: any }) => iss.fieldName === "poolOverview").length > 0) {
      const idx = issues.findIndex((iss: { [x: string]: any }) => iss.fieldName === "poolOverview");
      issues.splice(idx, 1);
    }
    return (
      <Box height={52 * (tableData.length + 1.5)} py={6} id={"tableID"}>
        <DataGrid
          sx={{ textOverflow: "clip" }}
          onRowClick={(event) => {
            const href = new URL(window.location.href);
            const p = new URLSearchParams(href.search);
            p.set("tab", "pool");
            p.set("poolId", event.row.poolId);
            navigate("?" + p.toString().split("%2F").join("/"));
            setPoolId(event.row.poolId);
            handleTabChange(null, "3");
          }}
          columnBuffer={7}
          initialState={{
            sorting: {
              sortModel: [{ field: "tvl", sort: "desc" }],
            },
          }}
          hideFooter={true}
          rows={tableData}
          columns={columns}
        />
      </Box>
    );
  }
  return null;
};
