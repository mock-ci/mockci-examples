import { DeleteItemCommand, DynamoDBClient, GetItemCommand, ListTablesCommand, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
require('dotenv').config()

export type UserEntry = {
    userId: string
    name: string
    email: string
}

export const USERS_TABLE = 'users'

export default class UserStore {
    private dynamodb: DynamoDBClient;

    constructor(dynamodb: DynamoDBClient) {
        this.dynamodb = dynamodb
    }

    async getUser(userId: string): Promise<UserEntry | null> {
        let result = await this.dynamodb.send(new GetItemCommand({
            TableName: USERS_TABLE,
            Key: {
                userId: {S: userId}
            }
        }))
        if(!result.Item) {
            return null
        }
        return unmarshall(result.Item) as UserEntry
    }

    async listUsers(): Promise<UserEntry[]> {
        let result = await this.dynamodb.send(new ScanCommand({
            TableName: USERS_TABLE
        }))
        if(!result.Items) {
            return []
        }
        return result.Items.map(d => unmarshall(d) as UserEntry)
    }

    async deleteUser(userId: string): Promise<void> {
        await this.dynamodb.send(new DeleteItemCommand({
            TableName: USERS_TABLE,
            Key: {
                userId: {S: userId}
            }
        }))
    }

    async getUserFromEmail(email: string): Promise<UserEntry[]> {
        let result = await this.dynamodb.send(new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': {S: email}
            }
        }))
        if(!result.Items) {
            return []
        }
        return result.Items.map(d => unmarshall(d) as UserEntry)
    }

    async storeUser(item: UserEntry): Promise<void> {
        await this.dynamodb.send(new PutItemCommand({
            TableName: USERS_TABLE,
            Item: marshall(item),
        }))
    }
}