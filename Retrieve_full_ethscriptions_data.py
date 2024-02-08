import requests
import json

# API endpoint
url = "https://api.ethscriptions.com/api/ethscriptions/"

# Ethscription numbers to query
ethscription_numbers = [1600]

# Loop through each ethscription number and make a GET request to the API
for ethscription_number in ethscription_numbers:
    # Construct the request URL
    query_url = url + str(ethscription_number)
    
    # Make the GET request
    response = requests.get(query_url)
    
    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Parse the JSON response
        data = response.json()
        
        # Save the data for each ethscription number to a separate JSON file
        output_file = f"ethscription_{ethscription_number}.json"
        with open(output_file, "w") as f:
            json.dump(data, f)
        
        print(f"Data for ethscription {ethscription_number} saved to {output_file}")
    else:
        print(f"Failed to retrieve data for ethscription number {ethscription_number}")
