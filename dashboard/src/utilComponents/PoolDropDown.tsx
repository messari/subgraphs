import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import React from "react";

export const poolDropDown  = (poolId: string, setPoolId: React.Dispatch<React.SetStateAction<string>>, markets: [], PoolNames: Record<string, string>) => {
  console.log('drop markets', markets)  
  return (
    <>
      <h3 style={{marginLeft: "16px"}}>Select a pool</h3>
      <Select
        fullWidth
        sx={{ maxWidth: 1000, margin: 2 }}
        labelId="demo-simple-select-filled-label"
        id="demo-simple-select-filled"
        value={poolId}
        onChange={(event: SelectChangeEvent) => {setPoolId(event.target.value)}}
      >
        <MenuItem value="">
              <em>No Pool Selected</em>
            </MenuItem>
        {
          markets.map((market:any)=>{
            return (
              <MenuItem value={market.id}>
              <em>{market.id} - {market.name}</em>
            </MenuItem>
            )
          })
        }
      </Select>
    </>)
}