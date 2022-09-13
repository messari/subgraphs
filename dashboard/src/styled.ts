import { styled as MUIStyled } from "@mui/material";

// @ts-ignore
export const styled: typeof MUIStyled = (tag, options) => {
  return MUIStyled(tag, {
    shouldForwardProp: (propName: PropertyKey) => {
      const hasPrefix = String(propName).startsWith("$");
      return !hasPrefix;
    },
    ...options,
  });
};
