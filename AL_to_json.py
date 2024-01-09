import requests
import json

# Read transaction hashes from the file
with open('ethsc.txt', 'r') as file:
    transaction_hashes = [line.strip() for line in file]

# Initialize an empty dictionary to store results
results = {}

# Define the API endpoint
api_url = "https://api.ethscriptions.com/api/ethscriptions/"

# Iterate through each transaction hash and make API requests
for tx_hash in transaction_hashes:
    # Construct the full API URL with the transaction hash
    full_url = api_url + tx_hash

    # Make the API request
    response = requests.get(full_url)

    # Parse the JSON response
    data = response.json()

    # Extract the current owner information and store in results dictionary
    results[tx_hash] = {
        "current_owner": data.get("current_owner", "Not found")
    }

# Save the results to ethscresults.json
with open('ethscresults.json', 'w') as output_file:
    json.dump(results, output_file, indent=2)

print("Results have been saved to ethscresults.json.")
