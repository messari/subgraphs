import { getNetworkConfigurations } from "./configurations/configurations";
import { Deploy } from "./configurations/deploy";

let deployment = Deploy.{{ deployment }};

export const NetworkConfigs = getNetworkConfigurations(deployment);
