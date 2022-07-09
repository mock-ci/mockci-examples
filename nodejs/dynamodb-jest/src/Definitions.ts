import { DynamoDBTable } from "mockci"
import { ACCOUNTS_TABLE } from "./AccountStore"
import { USERS_TABLE } from "./UserStore"


export const UserTableDefinition: DynamoDBTable = {
    name: USERS_TABLE,
    hashKey: 'userId',
    attributes: [
        { name: 'userId', type: 'S' },
        { name: 'email', type: 'S' },
    ],
    indexes: [
        { name: 'email-index', hashKey: 'email' },
    ]
}

export const AccountTableDefinition: DynamoDBTable = {
    name: ACCOUNTS_TABLE,
    hashKey: 'accountId',
    attributes: [
        { name: 'accountId', type: 'S' }
    ]
}