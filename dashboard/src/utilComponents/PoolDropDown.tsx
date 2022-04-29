import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import React from "react";

export const poolDropDown  = (poolId: string, setPoolId: React.Dispatch<React.SetStateAction<string>>, data: any, PoolNames: Record<string, string>) => {
    return (
      <Select
        fullWidth
        sx={{ maxWidth: 1000, margin: 2 }}
        labelId="demo-simple-select-filled-label"
        id="demo-simple-select-filled"
        value={poolId}
        placeholder={"No pool selected"}
        onChange={(event: SelectChangeEvent) => {setPoolId(event.target.value);}}
      >
        <MenuItem value="">
              <em>No Pool Selected</em>
            </MenuItem>
        {
          data[PoolNames[data.protocols[0].type]].map((e:any)=>{
            return (
              <MenuItem value={e.id}>
              <em>{e.id} - {e.name}</em>
            </MenuItem>
            )
          })
        }
      </Select>
    )
}