import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

interface DevCountTableProps {
  subgraphCounts: any;
}

function DevCountTable({ subgraphCounts }: DevCountTableProps) {
  return (
    <div style={{ width: "98%", margin: "1%" }}>
      <TableContainer sx={{ marginBottom: "20px", fontSize: "12px" }}>
        <Typography variant="h4" align="center" fontWeight={500} fontSize={28} sx={{ padding: "6px", my: 2 }}>
          Subgraph Counts By Type
        </Typography>
        <Table stickyHeader>
          <TableHead sx={{ height: "5px" }}>
            <TableRow sx={{ height: "5px" }}>
              <TableCell style={{ textAlign: "right", padding: "3px" }}> </TableCell>
              {Object.keys(subgraphCounts).map((schemaType) => {
                return (
                  <TableCell style={{ textAlign: "right", padding: "3px" }} key={schemaType + "CountCell"}>
                    <span style={{ fontSize: "14px", textAlign: "right", width: "100%" }}>{schemaType}</span>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell style={{ textAlign: "left", padding: "3px" }}>
                <span style={{ fontSize: "14px", textAlign: "right", width: "100%" }}>Production Ready</span>
              </TableCell>
              {Object.keys(subgraphCounts).map((schemaType) => {
                const deployStats = subgraphCounts[schemaType];
                return (
                  <TableCell style={{ textAlign: "right", padding: "3px" }} key={schemaType + "ProdCountCell"}>
                    <span style={{ fontSize: "14px", textAlign: "right", width: "100%" }}>{deployStats.prodCount}</span>
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell style={{ textAlign: "left", padding: "3px" }}>
                <span style={{ fontSize: "14px", textAlign: "right", width: "100%" }}>In Development</span>
              </TableCell>
              {Object.keys(subgraphCounts).map((schemaType) => {
                const deployStats = subgraphCounts[schemaType];
                return (
                  <TableCell style={{ textAlign: "right", padding: "3px" }} key={schemaType + "DevCountCell"}>
                    <span style={{ fontSize: "14px", textAlign: "right", width: "100%" }}>{deployStats.devCount}</span>
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell style={{ textAlign: "left", padding: "3px" }}>
                <span style={{ fontSize: "14px", textAlign: "right", width: "100%" }}>Total Deployments</span>
              </TableCell>
              {Object.keys(subgraphCounts).map((schemaType) => {
                const deployStats = subgraphCounts[schemaType];
                return (
                  <TableCell style={{ textAlign: "right", padding: "3px" }} key={schemaType + "TotalCountCell"}>
                    <span style={{ fontSize: "14px", textAlign: "right", width: "100%" }}>
                      {deployStats.totalCount}
                    </span>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default DevCountTable;
