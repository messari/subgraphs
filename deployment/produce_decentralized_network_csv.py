import json
import pandas as pd


def extract_deployment_info(data):
    rows = []
    for project_name, project_data in data.items():
        schema = project_data.get("schema", "N/A")
        deployments = project_data.get("deployments", {})
        for deployment_name, deployment_data in deployments.items():
            if "decentralized-network" in deployment_data["services"]:
                decentralized_network = deployment_data["services"]["decentralized-network"]
                row = {
                    "deployment name": deployment_name,
                    "protocol type": schema,
                    "network": deployment_data["network"],
                    "status": deployment_data["status"],
                    "slug": decentralized_network["slug"],
                    "query-id": decentralized_network["query-id"]
                }
                rows.append(row)
    return rows

with open('deployment.json', 'r') as file:
    general_data = json.load(file)
    
# Extract information
rows = extract_deployment_info(general_data)

# Create DataFrame
df_general = pd.DataFrame(rows)

## order by protocol type and deployment name
df_general = df_general.sort_values(by=["protocol type", "deployment name"])

# Save to CSV
csv_file_path_general = "decentralized_network_deployments.csv"
df_general.to_csv(csv_file_path_general, index=False)
