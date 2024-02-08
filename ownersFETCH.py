import requests
import json

# Load transaction hashes from txhashes.json
with open('txhashes.json', 'r') as f:
    tx_hashes = json.load(f)['transactionHashes']

owners = []

# Query API for each transaction hash
for idx, tx_hash in enumerate(tx_hashes, 1):
    url = f"https://api.ethscriptions.com/api/ethscriptions/{tx_hash}"
    response = requests.get(url)
    
    # Print status message
    print(f"Processing transaction hash {idx}/{len(tx_hashes)}: {tx_hash}")
    
    # Check if request was successful
    if response.status_code == 200:
        data = response.json()
        current_owner = data.get('current_owner', 'Not found')
        owners.append({'transaction_hash': tx_hash, 'current_owner': current_owner})
    else:
        print(f"Failed to fetch data for transaction hash {tx_hash}")

# Save results to Owners.json
with open('Owners.json', 'w') as f:
    json.dump(owners, f, indent=4)

print("Data saved to Owners.json")
