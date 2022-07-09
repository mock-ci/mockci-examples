import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import UserStore from "./UserStore"


export type Role = 'owner' | 'admin' | 'user'
export type AccountMember = {
    userId: string
    role: Role
}
export type AccountEntry = {
    accountId: string
    members: AccountMember[]
}

export const ACCOUNTS_TABLE = 'accounts'

export default class AccountStore {
    private dynamodb: DynamoDBClient
    private userStore: UserStore

    constructor(dynamodb: DynamoDBClient) {
        this.dynamodb = dynamodb
        this.userStore = new UserStore(dynamodb)
    }

    async createAccount(accountId: string, members: AccountMember[]): Promise<void> {
        for(let member of members) {
            let user = await this.userStore.getUser(member.userId)
            if(!user){
                throw new Error(`User ${member.userId} does not exist`)
            }
        }
        //make sure there is an owner
        let ownerFound = members.find(m => m.role === 'owner')
        if(!ownerFound) {
            throw new Error(`No owner found for account ${accountId}`)
        }
        let account = {
            accountId,
            members
        }
        await this.dynamodb.send(new PutItemCommand({
            TableName: ACCOUNTS_TABLE,
            Item: marshall(account)
        }))
    }

    async addMember(accountId: string, member: AccountMember): Promise<void> {
        let account = await this.getAccount(accountId)
        if(!account) {
            throw new Error(`Account ${accountId} does not exist`)
        }
        let user = await this.userStore.getUser(member.userId)
        if(!user) {
            throw new Error(`User ${member.userId} does not exist`)
        }
        //make sure there is only one owner for the account
        if(member.role === 'owner') {
            for(let m of account.members) {
                if(m.role === 'owner') {
                    throw new Error(`Account ${accountId} already has an owner`)
                }
            }
        }

        account.members.push(member)
        await this.dynamodb.send(new PutItemCommand({
            TableName: ACCOUNTS_TABLE,
            Item: marshall(account)
        }))
    }

    async getAccount(accountId: string): Promise<AccountEntry | null> {
        let result = await this.dynamodb.send(new GetItemCommand({
            TableName: ACCOUNTS_TABLE,
            Key: {
                accountId: {S: accountId}
            }
        }))
        if(!result.Item) {
            return null
        }
        return unmarshall(result.Item) as AccountEntry
    }

    async setOwner(accountId: string, userIdOfNewOwner: string): Promise<void> {
        let account = await this.getAccount(accountId)
        if(!account) {
            throw new Error(`Account ${accountId} does not exist`)
        }
        let user = await this.userStore.getUser(userIdOfNewOwner)
        if(!user) {
            throw new Error(`User ${userIdOfNewOwner} does not exist`)
        }

        //make sure the new owner is in the account
        let newOwnerFound = account.members.find(m => m.userId === userIdOfNewOwner)
        if(!newOwnerFound) {
            throw new Error(`User ${userIdOfNewOwner} is not a member of account ${accountId}`)
        }
        if(newOwnerFound.role === 'owner') {
            throw new Error(`User ${userIdOfNewOwner} is already an owner of account ${accountId}`)
        }
        newOwnerFound.role = 'owner'

        //make sure there is only one owner for the account
        for(let m of account.members) {
            if(m.role === 'owner') {
                m.role = 'admin'
            }
        }
        await this.dynamodb.send(new PutItemCommand({
            TableName: ACCOUNTS_TABLE,
            Item: marshall(account)
        }))
    }
}