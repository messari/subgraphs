import { Box, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect } from "react";
import { useNavigate } from "react-router";

interface TableChartProps {
  datasetLabel: string;
  dataTable: any;
  protocolType: string;
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  skipAmt: number;
  setIssues: React.Dispatch<{ message: string; type: string; level: string; fieldName: string }[]>;
  issueProps: { message: string; type: string; level: string; fieldName: string }[];
}

const tableCellTruncate: any = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const TablePoolOverview = ({
  datasetLabel,
  dataTable,
  protocolType,
  handleTabChange,
  setPoolId,
  skipAmt,
  setIssues,
  issueProps,
}: TableChartProps) => {
  const navigate = useNavigate();
  let issues: { message: string; type: string; level: string; fieldName: string }[] = issueProps;
  useEffect(() => {
    if (JSON.stringify(issues) !== JSON.stringify(issueProps)) {
      setIssues(issues);
    }
  });
  if (dataTable) {
    const optionalFields = [];
    let baseFieldCol = false;
    let inputTokenLabel = "Input Token";
    let inputTokenColWidth = 160;
    if (protocolType === "EXCHANGE") {
      inputTokenLabel = "Input Tokens";
      inputTokenColWidth = 220;
      optionalFields.push({
        field: "baseYield",
        headerName: "Base Yield %",
        width: 180,
        renderCell: (params: any) => {
          let value = "%" + params.value.toFixed(2);
          return (
            <Tooltip title={value}>
              <span style={tableCellTruncate}>{value}</span>
            </Tooltip>
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
        width: 180,
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
          let poolIdStr = params.value;
          if (poolIdStr.length > 40) {
            poolIdStr = `${params.value.slice(0, 14)}...${params.value.slice(
              params.value.length - 15,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span
                onClick={() => (window.location.href = "https://etherscan.io/address/" + params.value)}
                style={tableCellTruncate}
              >
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
          let inputTokenStr = params.value;
          if (inputTokenStr.length > 23) {
            inputTokenStr = `${params.value.slice(0, 12)}...${params.value.slice(
              params.value.length - 12,
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
        renderCell: (params: any) => {
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
        renderCell: (params: any) => {
          let rewardTokenStr = params.value;
          if (rewardTokenStr.length > 18) {
            rewardTokenStr = `${params.value.slice(0, 8)}...${params.value.slice(
              params.value.length - 7,
              params.value.length,
            )}`;
          }
          return (
            <Tooltip title={params.value}>
              <span style={tableCellTruncate}>{rewardTokenStr}</span>
            </Tooltip>
          );
        },
      },
    ];
    columns = columns.concat(optionalFields);
    const tableData = dataTable.map((pool: any, i: any) => {
      let inputTokenSymbol = pool?.inputToken?.symbol;
      if (pool.inputTokens) {
        inputTokenSymbol = pool.inputTokens.map((tok: any) => tok.symbol).join(", ");
      }

      const returnObj: { [x: string]: any } = {
        id: i + 1 + skipAmt,
        idx: i + 1 + skipAmt,
        name: pool.name || "N/A",
        poolId: pool.id,
        inputToken: inputTokenSymbol,
        tvl: Number(pool.totalValueLockedUSD),
        rewardTokens: "",
      };
      if (
        Number(pool.totalValueLockedUSD) > 1000000000000 &&
        issues.filter((x) => x.fieldName === `#${i + 1 + skipAmt} - ${pool.name || "N/A"}`).length === 0
      ) {
        issues.push({
          type: "TVL+",
          message: "",
          level: "warning",
          fieldName: `#${i + 1 + skipAmt} - ${pool.name || "N/A"}`,
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
        if (tokenFieldDiff !== 0 && issues.filter((x) => x.fieldName === `${pool.name || '#' + i + 1 + skipAmt}[${tokenFieldDiff}]` && x.type === "TOK").length === 0
        ) {
          issues.push({
            type: "TOK",
            level: "error",
            fieldName: `${pool.name || '#' + i + 1 + skipAmt}[${tokenFieldDiff}]`,
            message: `rewardTokens [${tokenFieldDiff}]`,
          });
        }


        const rewardAPYs = pool.rewardTokenEmissionsUSD.map((val: string, idx: number) => {
          let apr = 0;
          if (protocolType === "LENDING") {
            if (
              !Number(pool.totalDepositBalanceUSD) &&
              !Number(pool.totalValueLockedUSD) &&
              issues.filter((x) => x.fieldName === `${pool.name || '#' + i + 1 + skipAmt}-pool value`).length === 0
            ) {
              issues.push({
                type: "VAL",
                message: `${pool.name || '#' + i + 1 + skipAmt} does not have a valid 'totalDepositBalanceUSD' nor 'totalValueLockedUSD' value. Neither Reward APY nor Base Yield could be properly calculated.`,
                level: "critical",
                fieldName: `${pool.name || '#' + i + 1 + skipAmt}-pool value`,
              });
            } else if (pool.totalDepositBalanceUSD) {
              apr = (Number(val) / Number(pool.totalDepositBalanceUSD)) * 100 * 365;
            } else if (Number(pool.totalValueLockedUSD)) {
              apr = (Number(val) / Number(pool.totalValueLockedUSD)) * 100 * 365;
            }
          } else {
            let outputStakedFactor = Number(pool?.stakedOutputTokenAmount) / Number(pool?.outputTokenSupply);
            if (!outputStakedFactor) {
              outputStakedFactor = 1;
            }
            apr = (Number(val) / (Number(pool.totalValueLockedUSD) * outputStakedFactor)) * 100 * 365;
          }
          if (
            Number(apr) === 0 &&
            issues.filter((x) => x.fieldName === `#${i + 1 + skipAmt}-${rewardTokenSymbol[idx] || "N/A"} RewardAPY`)
              .length === 0
          ) {
            issues.push({
              type: "RATEZERO",
              message: "",
              level: "warning",
              fieldName: `#${i + 1 + skipAmt}-${rewardTokenSymbol[idx] || "N/A"} RewardAPY`,
            });
          }
          if (
            isNaN(apr) &&
            issues.filter((x) => x.fieldName === `#${i + 1 + skipAmt}-${rewardTokenSymbol[idx] || "N/A"} RewardAPY`)
              .length === 0
          ) {
            issues.push({
              type: "NAN",
              message: "",
              level: "critical",
              fieldName: `#${i + 1 + skipAmt}-${rewardTokenSymbol[idx] || "N/A"} RewardAPY`,
            });
          }
          if (
            Number(apr) < 0 &&
            issues.filter((x) => x.fieldName === `#${i + 1 + skipAmt}-${rewardTokenSymbol[idx] || "N/A"} RewardAPY`)
              .length === 0
          ) {
            issues.push({
              type: "RATENEG",
              message: "",
              level: "critical",
              fieldName: `#${i + 1 + skipAmt}-${rewardTokenSymbol[idx] || "N/A"} RewardAPY`,
            });
          }
          return Number(apr).toFixed(2) + "%";
        });
        const rewardTokenCell = rewardTokenSymbol.map((tok: string, idx: number) => {
          let str = `0.00 % ${tok}`;
          if (rewardAPYs[idx]) {
            str = `${rewardAPYs[idx]} ${tok}`;
          }
          return str;
        });
        returnObj.rewardTokens = rewardTokenCell.join(", ");
      } else {
        returnObj.rewardTokens = "No Reward Token";
      }
      if (baseFieldCol) {
        returnObj.baseYield = 0;
        if (Object.keys(pool?.fees)?.length > 0 && pool?.totalValueLockedUSD) {
          // CURRENTLY THE FEE IS BASED OFF OF THE POOL RATHER THAN THE TIME SERIES. THIS IS TEMPORARY
          const supplierFee = pool.fees.find((fee: { [x: string]: string }) => {
            return fee.feeType === "FIXED_LP_FEE" || fee.feeType === "DYNAMIC_LP_FEE";
          });
          let feePercentage = 0;
          if (supplierFee) {
            feePercentage = Number(supplierFee.feePercentage);
          }
          const volumeUSD = Number(pool.cumulativeVolumeUSD);
          let value = ((feePercentage * volumeUSD) / Number(pool.totalValueLockedUSD)) * 100;
          if (!value || !Number(pool.totalValueLockedUSD)) {
            value = 0;
            if (
              issues.filter((x) => x.fieldName === `${pool.name || '#' + i + 1 + skipAmt} Base Yield`).length === 0
            ) {
              issues.push({
                type: "NAN",
                message: "",
                level: "critical",
                fieldName: `${pool.name || '#' + i + 1 + skipAmt} Base Yield`,
              });
            }
          }
          if (
            value < 0 &&
            issues.filter((x) => x.fieldName === `${pool.name || '#' + i + 1 + skipAmt} Base Yield`).length === 0
          ) {
            issues.push({
              type: "RATENEG",
              message: "",
              level: "critical",
              fieldName: `${pool.name || '#' + i + 1 + skipAmt} Base Yield`,
            });
          }
          returnObj.baseYield = value;
        }
      }
      return returnObj;
    });
    return (
      <Box height={52 * (tableData.length + 1.5)} py={6} id={"tableID"}>
        <DataGrid
          sx={{ textOverflow: "clip" }}
          onRowClick={(row) => {
            const href = new URL(window.location.href);
            const p = new URLSearchParams(href.search);
            p.set("tab", "pool");
            p.set("poolId", row.row.poolId);
            navigate("?" + p.toString());
            setPoolId(row.row.poolId);
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
