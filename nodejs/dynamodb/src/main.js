const AWS = require('aws-sdk');
const UserStore = require('./UserStore.js')
const MockCI = require('./MockCI.js')

//paste your api key here
const MOCKCI_API_KEY = ''
const TABLE_DEFINITION = {
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
async function main() {
    console.log('Creating MockCI session...')
    const dynamodbEndpoint = await MockCI.startSession(MOCKCI_API_KEY, TABLE_DEFINITION)
    console.log('Generated MockCI DynamoDB endpoint:', dynamodbEndpoint)
    
    const dynamodb = new AWS.DynamoDB({
        endpoint: dynamodbEndpoint,
        region: 'us-east-1'
    })
    console.log('tables are:', await dynamodb.listTables().promise())
    const userStore = UserStore.newUserStore(dynamodb)

    /*
        This is where you would have your test suite, nothing below here is specific to MockCI
    */
    console.log("\nGetting existing item...")
    console.log("john is " + JSON.stringify(await userStore.getUser('john')))

    console.log("\nDeleting existing item...")
    await userStore.deleteUser("john")
    console.log("john is now " + JSON.stringify(await userStore.getUser("john")))

    console.log("\nCreating new item...")
    await userStore.storeUser({
        userId: 'camille',
        apiKey: 'camille\'s api key',
    })

    console.log("\nListing all items...")
    console.log(await userStore.listUsers())

    console.log("\nQuerying an index...")
    console.log(await userStore.getUserWithApiKey('camille\'s api key'))
}

main()
.then(console.log)
.catch(console.log)