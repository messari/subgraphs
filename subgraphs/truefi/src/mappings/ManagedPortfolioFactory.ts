import { PortfolioCreated } from "../../generated/ManagedPortfolioFactory/ManagedPortfolioFactory";
import { ManagedPortfolio } from "../../generated/templates";

export function handlePortfolioCreated(event: PortfolioCreated): void {
  ManagedPortfolio.create(event.params.newPortfolio);
}
