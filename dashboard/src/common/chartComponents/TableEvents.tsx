import { Tooltip } from "@material-ui/core";
import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { convertTokenDecimals, toDate } from "../../../src/utils/index";
import { PoolName } from "../../constants";
import { CopyLinkToClipboard } from "../utilComponents/CopyLinkToClipboard";

const tableCellTruncate: any = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

interface TableEventsProps {
  datasetLabel: string;
  data: any;
  eventName: string;
}

export const TableEvents = ({ datasetLabel, data, eventName }: TableEventsProps) => {
  const dataTable = data[eventName];
  const protocolType = data.protocols[0].type;
  const poolName = PoolName[protocolType];
  if (!data[poolName]) {
    return null;
  }
  if (dataTable && dataTable[0]) {
    const tableData: any[] = [];
    for (let i = 0; i < dataTable.length; i++) {
      const currentData = { ...dataTable[i] };
      if (currentData?.amountInUSD) {
        currentData.amountInUSD = "$" + Number(Number(currentData.amountInUSD).toFixed(2)).toLocaleString();
      }
      if (currentData?.amountOutUSD) {
        currentData.amountOutUSD = "$" + Number(Number(currentData.amountOutUSD).toFixed(2)).toLocaleString();
      }
      if (currentData?.amountUSD) {
        currentData.amountUSD = "$" + Number(Number(currentData.amountUSD).toFixed(2)).toLocaleString();
      }
      if (data[poolName]?.inputToken) {
        const convertedAmt = convertTokenDecimals(currentData.amount, data[poolName].inputToken.decimals);
        currentData.amount = convertedAmt;
        tableData.push({ id: i, date: toDate(dataTable[i].timestamp), ...currentData });
      }
      if (data[poolName]?.inputTokens) {
        if (currentData.inputTokenAmounts) {
          const inputTokensDecimal = currentData.inputTokenAmounts.map((amt: string, idx: number) => {
            return convertTokenDecimals(amt, currentData.inputTokens[idx].decimals);
          });
          const outputTokenDecimal = convertTokenDecimals(
            currentData.outputTokenAmount,
            currentData.outputToken.decimals,
          );
          currentData.inputTokenAmounts = inputTokensDecimal;
          currentData.outputTokenAmount = outputTokenDecimal;
          currentData.inputTokens = currentData.inputTokens
            .map((tok: any) => {
              return tok.id;
            })
            .join(", ");
          currentData.outputToken = JSON.stringify(currentData.outputToken.id);
        } else if (currentData.amount) {
          currentData.amount = convertTokenDecimals(currentData.amount, data[poolName].inputTokens[0].decimals);
        }
        tableData.push({ id: i, date: toDate(dataTable[i].timestamp), ...currentData });
      }
      if (currentData?.tokenIn) {
        const amountIn = convertTokenDecimals(currentData.amountIn, currentData.tokenIn.decimals);
        const amountOut = convertTokenDecimals(currentData.amountOut, currentData.tokenOut.decimals);
        currentData.amountIn = amountIn;
        currentData.amountOut = amountOut;
        currentData.tokenIn = currentData.tokenIn.id;
        currentData.tokenOut = currentData.tokenOut.id;
        tableData.push({ id: i, date: toDate(currentData.timestamp), ...currentData });
      }
    }
    const columns = Object.entries(dataTable[0])
      .filter(function ([k, val]) {
        if (k.includes("typename")) {
          return false;
        }
        return true;
      })
      .map(([k, val]) => {
        let field = k;
        if (field === "timestamp") {
          field = "date";
        }
        return {
          field: field,
          headerName: field,
          width: 250,
          renderCell: (params: any) => {
            let valueStr = params.value;
            if (field === "date") {
              valueStr = params.value;
            }
            let onClick = undefined;
            if (valueStr.length > 20) {
              valueStr = `${params.value.slice(0, 10)}...${params.value.slice(
                params.value.length - 15,
                params.value.length,
              )}`;
            }
            if (k.toUpperCase() === "HASH") {
              onClick = () => (window.location.href = "https://etherscan.io/tx/" + params.value);
            }
            return (
              <Tooltip title={params.value}>
                <span onClick={onClick} style={tableCellTruncate}>
                  {valueStr}
                </span>
              </Tooltip>
            );
          },
        };
      });

    return (
      <Box height={750} py={6} id={eventName}>
        <CopyLinkToClipboard link={window.location.href} scrollId={eventName}>
          <Typography fontSize={20}>
            <b>{datasetLabel.toUpperCase()}</b>
          </Typography>
        </CopyLinkToClipboard>
        <DataGrid
          pageSize={10}
          initialState={{
            sorting: {
              sortModel: [{ field: "timestamp", sort: "desc" }],
            },
          }}
          rows={tableData}
          columns={columns}
        />
      </Box>
    );
  }
  return null;
};
