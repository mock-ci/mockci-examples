import boto3
import user_store
import mockci

# paste your api key here
mockci_api_key = ""

table_definition = {
    "dynamodb": {
        "tables": [
            {
                "seedData": [
                    { "userId": "john", "apiKey": "john's api key", "configs": [ { "item1": "abc" } ] },
                    { "userId": "bob", "apiKey": "bob's api key" }
                ],
                "name": "users",
                "attributes": [
                    { "name": "userId", "type": "S" },
                    { "name": "apiKey", "type": "S" }
                ],
                "hashKey": "userId",
                "indexes": [
                    { "name": "apiKey-index", "hashKey": "apiKey" }
                ]
            }
        ]
    }
}

print("Creating MockCI session...")
dynamodb_endpoint = mockci.start_session(
    api_key=mockci_api_key,
    prefab=table_definition
)
print("\nGenerated MockCI DynamoDB endpoint: " + dynamodb_endpoint)

dynamodb = boto3.resource('dynamodb', endpoint_url=dynamodb_endpoint)

#
# This is where you would have your test suite, nothing below here is specific to MockCI
#
store = user_store.UserStore(dynamodb)

print("\nGetting existing item...")
print("john is " + str(store.get_user("john")))

print("\nDeleting existing item...")
store.delete_user("john")
print("john is now " + str(store.get_user("john")))

print("\nCreating new item...")
store.put_user("camille", "camille's api key", [ { "category": "example value" } ])

print("\nListing all items...")
print(store.list_users())