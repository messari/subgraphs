import { AutocompleteRenderInputParams, TextField } from "@mui/material";

interface ComboBoxInputProps {
  setTextInput: any;
  params: AutocompleteRenderInputParams;
  label: string;
  style?: any;
}

export const ComboBoxInput = ({ setTextInput, params, label, style = {} }: ComboBoxInputProps) => {
  return (
    <TextField
      sx={style}
      onFocus={() => setTextInput("")}
      onChange={(inp) => setTextInput(inp.target.value)}
      {...params}
      label={label}
      variant="outlined"
    />
  );
};
