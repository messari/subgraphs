import json
import os

try:
    import pandas as pd
except ImportError:
    print("Warning: pandas is not installed. Using built-in CSV writing.")
    pd = None

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
                    "protocol name": project_data["protocol"],
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

if pd is not None:
    # Create DataFrame
    df_general = pd.DataFrame(rows)

    ## order by protocol type and deployment name
    df_general = df_general.sort_values(by=["protocol type", "deployment name"])

    # Save to CSV
    csv_file_path_general = "decentralized_network_deployments.csv"
    df_general.to_csv(csv_file_path_general, index=False)

    # Print Deployment Statistics
    df_prod = df_general[df_general['status'] == 'prod']
    distinct_protocols = df_prod['protocol name'].nunique()
    non_governance_protocols = df_prod[~df_prod['protocol name'].str.contains('governance', case=False, na=False)]['protocol name'].nunique()
    distinct_networks = df_prod['network'].nunique()

    print(f"Number of distinct protocols in production: {distinct_protocols}")
    print(f"Number of non-governance protocols in production: {non_governance_protocols}")
    print(f"Number of distinct networks deployed on: {distinct_networks}")

    # Print number of protocols for each type
    protocol_type_counts = df_prod.groupby("protocol type")["protocol name"].nunique()
    print("\nNumber of protocols for each type:")
    for protocol_type, count in protocol_type_counts.items():
        print(f"{protocol_type}: {count}")

else:
    # Fallback to built-in CSV writing and manual counting
    import csv
    from collections import defaultdict

    with open("decentralized_network_deployments.csv", "w", newline="") as csvfile:
        fieldnames = ["deployment name", "protocol name", "protocol type", "network", "status", "slug", "query-id"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    protocol_counts = defaultdict(set)
    distinct_protocols = set()
    non_governance_protocols = set()
    distinct_networks = set()

    for row in rows:
        if row["status"] == "prod":
            protocol_type = row["protocol type"]
            protocol_name = row["protocol name"]
            network = row["network"]
            protocol_counts[protocol_type].add(protocol_name)
            distinct_protocols.add(protocol_name)
            distinct_networks.add(network)
            if "governance" not in protocol_name.lower():
                non_governance_protocols.add(protocol_name)

    print(f"Number of distinct protocols in production: {len(distinct_protocols)}")
    print(f"Number of non-governance protocols in production: {len(non_governance_protocols)}")
    print(f"Number of distinct networks deployed on: {len(distinct_networks)}")

    print("\nNumber of protocols for each type:")
    for protocol_type, protocols in protocol_counts.items():
        print(f"{protocol_type}: {len(protocols)}")
