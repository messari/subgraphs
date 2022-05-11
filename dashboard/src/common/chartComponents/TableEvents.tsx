import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { convertTokenDecimals, toDate } from "../../../src/utils/index";
import { PoolName } from "../../constants";

export const TableEvents = (_datasetLabel: string, data: any, eventName: string) => {
  const dataTable = data[eventName];
  const protocolType = data.protocols[0].type;
  const poolName = PoolName[protocolType];
  if (!data[poolName]) {
    return null;
  }
  if (dataTable && dataTable[0]) {
    const tableData: any[] = [];
    for (let i = dataTable.length - 1; i >= 0; i--) {
      const currentData = { ...dataTable[i] };
      if (data[poolName]?.inputToken) {
        currentData.amount = convertTokenDecimals(currentData.amount, data[poolName].inputToken.decimals);
        tableData.push({ id: i, date: toDate(dataTable[i].timestamp), ...currentData });
      }
      if (currentData?.inputTokens) {
        const inputTokensDecimal = currentData.inputTokenAmounts.map((amt: string, idx: number) => {
          return convertTokenDecimals(amt, currentData.inputTokens[idx].decimals);
        });
        const outputTokenDecimal = convertTokenDecimals(currentData.outputTokenAmount, currentData.outputToken.decimals);
        currentData.inputTokenAmounts = inputTokensDecimal;
        currentData.outputTokenAmount = outputTokenDecimal;
        currentData.inputTokens = currentData.inputTokens.map((tok: any) => { return tok.id }).join(', ');
        currentData.outputToken = JSON.stringify(currentData.outputToken.id);
        tableData.push({ id: i, date: toDate(dataTable[i].timestamp), ...currentData })
      }
      if (dataTable[i]?.tokenIn) {
        const amountIn = convertTokenDecimals(dataTable[i].amountIn, dataTable[i].tokenIn.decimals);
        const amountOut = convertTokenDecimals(dataTable[i].amountOut, dataTable[i].tokenOut.decimals);
        console.log('CHECK CONVERSION', amountIn, dataTable[i].amountIn, dataTable[i].tokenIn, dataTable[i])
        currentData.amountIn = amountIn;
        currentData.amountOut = amountOut;
        currentData.tokenIn = currentData.tokenIn.id;
        currentData.tokenOut = currentData.tokenOut.id;
        tableData.push({ id: i, date: toDate(dataTable[i].timestamp), ...currentData })
      }

    }
    const columns = Object.entries(dataTable[0]).filter(function ([k, val]) {
      if (k.includes("typename")) {
        return false
      }
      return true;
    }).map(([k, val]) => {
      return { field: k, headerName: k, width: 250 }
    })
    columns.push({ field: 'date', headerName: 'date', width: 250 })

    return (
      <Box height={750} margin={6}>
        <Typography fontSize={20}><b>{_datasetLabel.toUpperCase()}</b></Typography>
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