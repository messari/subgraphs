import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { toDate } from "../App";

export const TableEvents = (_datasetLabel: string, dataTable: any) => {
    if (dataTable && dataTable[0]) {
      const tableData: any[] = [];
      for (let i = dataTable.length-1; i > 0; i--) {
        tableData.push({id:i ,date: toDate(dataTable[i].timestamp),...dataTable[i]})
      }
      const columns = Object.entries(dataTable[0]).filter(function([k, val]) {
        if(k.includes("typename")){
          return false 
        }
        return true;
      }).map(([k, val])=> {
        
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