import React from "react";
import { useNavigate } from "react-router";
import { styled } from "../styled";
import { Box, Card, CardContent, Typography } from "@mui/material";

const PoolBackground = styled("div")`
  background: rgba(22, 24, 29, 0.95);
  border-radius: 8px;
  flex-grow: 2;
`;

const StyledPool = styled(Card)(() => {
  return `
    background: rgba(22,24,29,0.9);
    background: linear-gradient(0deg, rgba(22,24,29,0.9) 0%, white 95%);
    padding: 1px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    
    &:hover {
      box-shadow: 0 0 2px 1px white;
    }    
  `;
});

const CardRow = styled("div") <{ $warning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  ${({ $warning, theme }) => $warning && `color: ${theme.palette.warning.main}`};
`;

interface PoolProps {
  pool: { [x: string]: any };
  protocolData: { [x: string]: any };
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
}

// This component is for each individual pool
export const Pool = ({ pool, protocolData, handleTabChange, setPoolId }: PoolProps) => {
  const navigate = useNavigate();

  let baseYieldElement = null;
  if (protocolData.type === "EXCHANGE") {
    if (Object.keys(pool.fees)?.length > 0 && pool.totalValueLockedUSD) {
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
      if (!value) {
        value = 0;
      }
      baseYieldElement = (
        <CardRow>
          <span>Base Yield: %{value.toFixed(2)}</span>
        </CardRow>
      );
    }
  }

  let inputTokenLabel = "inputToken";
  let inputTokenSymbol = pool?.inputToken?.symbol;
  if (pool.inputTokens) {
    inputTokenLabel = "inputTokens";
    inputTokenSymbol = pool.inputTokens.map((tok: any) => tok.symbol).join(", ");
  }

  let rewardAprElement = null;
  if (pool.rewardTokens?.length > 0) {
    const rewardTokenSymbol = pool.rewardTokens.map((tok: any) => {
      if (tok?.symbol) {
        return tok.symbol;
      } else if (tok?.token?.symbol) {
        return tok?.token?.symbol;
      }
      return "N/A";
    });

    rewardAprElement = pool.rewardTokenEmissionsUSD.map((val: string, idx: number) => {
      let apr = 0;
      if (pool?.totalDepositBalanceUSD && protocolData.type === "LENDING") {
        apr = (Number(val) / pool.totalDepositBalanceUSD) * 100 * 365;
      } else {
        if (!Number(pool?.stakedOutputTokenAmount) || !Number(pool?.outputTokenSupply)) {
          apr = (Number(val) / Number(pool.totalValueLockedUSD)) * 100 * 365;
        } else {
          apr =
            (Number(val) /
              (Number(pool.totalValueLockedUSD) *
                (Number(pool?.stakedOutputTokenAmount) / Number(pool?.outputTokenSupply)))) *
            100 *
            365;
        }
      }
      return (
        <CardRow>
          <span>
            {rewardTokenSymbol[idx] || "RewardToken [" + idx + "]"} Reward APY: {Number(val).toFixed(5)}%
          </span>
        </CardRow>
      );
    });
  }

  return (
    <StyledPool
      onClick={() => {
        const href = new URL(window.location.href);
        const p = new URLSearchParams(href.search);
        p.set("tab", "pool");
        p.set("poolId", pool.id);
        navigate("?" + p.toString());
        setPoolId(pool.id);
        handleTabChange(null, "2");
      }}
    >
      <PoolBackground>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="h6" align="center">
              {pool.name}
            </Typography>
          </Box>
          <CardRow onClick={() => (window.location.href = "https://etherscan.io/address/" + pool.id)}>
            <span>Pool ID:</span> <span>{pool.id}</span>
          </CardRow>
          <CardRow>
            <span>
              {inputTokenLabel}: {inputTokenSymbol}
            </span>
          </CardRow>
          <CardRow>
            <span>
              Total Value Locked (USD): ${Number(Number(pool.totalValueLockedUSD).toFixed(2)).toLocaleString()}
            </span>
          </CardRow>
          {baseYieldElement}
          {rewardAprElement}
        </CardContent>
      </PoolBackground>
    </StyledPool>
  );
};
