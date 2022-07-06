const AWS = require('aws-sdk');
const USERS_TABLE = 'users'

module.exports = {
    newUserStore: (dynamodb) => {
        return {
            getUser: async (userId) => {
                let result = await dynamodb.getItem({
                    TableName: USERS_TABLE,
                    Key: {
                        userId: {S: userId}
                    }
                }).promise()
                if(!result.Item) {
                    return null
                }
                return AWS.DynamoDB.Converter.unmarshall(result.Item)
            },

            listUsers: async () => {
                let result = await dynamodb.scan({
                    TableName: USERS_TABLE
                }).promise()
                return result.Items.map(d => AWS.DynamoDB.Converter.unmarshall(d))
            },
        
            deleteUser: async (userId) => {
                await dynamodb.deleteItem({
                    TableName: USERS_TABLE,
                    Key: {
                        userId: {S: userId}
                    }
                }).promise()
            },
        
            getUserWithApiKey: async (apiKey) => {
                let result = await dynamodb.query({
                    TableName: USERS_TABLE,
                    IndexName: 'apiKey-index',
                    KeyConditionExpression: 'apiKey = :apiKey',
                    ExpressionAttributeValues: {
                        ':apiKey': {S: apiKey}
                    }
                }).promise()
                if(!result.Items) {
                    return null
                }
                return result.Items.map(d => AWS.DynamoDB.Converter.unmarshall(d))
            },
        
            storeUser: async (item) => {
                await dynamodb.putItem({
                    TableName: USERS_TABLE,
                    Item: AWS.DynamoDB.Converter.marshall(item),
                }).promise()
            }
        }
    }
}