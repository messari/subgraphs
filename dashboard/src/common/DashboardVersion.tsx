import { styled } from "@mui/material";

const DashboardTag = styled("div")`
  position: fixed;
  left: 0;
  bottom: 0;
  background: #333;
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  font-size: 14px;
  border-top-right-radius: 8px;
  z-index: 2;
`;

export const DashboardVersion = () => {
  return <DashboardTag>v1.3.0</DashboardTag>;
};
