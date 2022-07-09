import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBTable, MockCIPrefab, MockCISession } from "mockci";
import { AccountEntry, ACCOUNTS_TABLE } from './AccountStore';
import { UserEntry } from './UserStore';
import { UserTableDefinition } from "./UserStore.test";
import AccountStore from './AccountStore';

export const AccountTableDefinition: DynamoDBTable = {
    name: ACCOUNTS_TABLE,
    hashKey: 'accountId',
    attributes: [
        { name: 'accountId', type: 'S' }
    ]
}

const makeConfiguredUserStore = async (accounts: AccountEntry[], users: UserEntry[]) => {
    const prefab: MockCIPrefab = {
        dynamodb: {
            tables: [
                {...UserTableDefinition, seedData: users},
                {...AccountTableDefinition, seedData: accounts}
            ],
        }
    }

    //this is needed to convince jest we dont have an open handle
    await process.nextTick(() => {});
    const session = await MockCISession.start({ 
        prefab,
        apiKey: process.env.MOCKCI_API_KEY 
    })
    const client = new DynamoDBClient({ endpoint: session.dynamodbEndpoint });
    return new AccountStore(client)
}

jest.setTimeout(30000)
test.concurrent('createAccount with existing users', async () => {
    const accountStore = await makeConfiguredUserStore([], [
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'},
        {userId: 'user2', name: 'User 2', email: 'def@example.com'},
    ])
    await accountStore.createAccount('account1', [
        {userId: 'user1', role: 'owner'},
        {userId: 'user2', role: 'user'},
    ])
    expect(await accountStore.getAccount('account1')).not.toBeNull()
});

test.concurrent('createAccount but there is no owner', async () => {
    const accountStore = await makeConfiguredUserStore([], [
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'},
    ])
    await expect(accountStore.createAccount('account1', [
        {userId: 'user1', role: 'user'},
    ])).rejects.toThrow()
});

test.concurrent('createAccount with inexisting user', async () => {
    const accountStore = await makeConfiguredUserStore([], [])
    await expect(accountStore.createAccount('account1', [
        {userId: 'user1', role: 'owner'},
    ])).rejects.toThrow()
});

test.concurrent('getAccount that exists', async () => {
    const accountStore = await makeConfiguredUserStore([
        {
            accountId: 'account1', 
            members: [
                {userId: 'user1', role: 'owner'},
                {userId: 'user2', role: 'user'},
            ]
        },
    ], [])
    let account = await accountStore.getAccount('account1')
    expect(account).not.toBeNull()
    expect(account.accountId).toBe('account1')
    expect(account.members.length).toBe(2)
    expect(account.members[0].userId).toBe('user1')
    expect(account.members[0].role).toBe('owner')
    expect(account.members[1].userId).toBe('user2')
    expect(account.members[1].role).toBe('user')
});

test.concurrent('getAccount that doesnt exist', async () => {
    const accountStore = await makeConfiguredUserStore([], [])
    let account = await accountStore.getAccount('account1')
    expect(account).toBeNull()
});

test.concurrent('addMember that exists', async () => {
    const accountStore = await makeConfiguredUserStore([
        {
            accountId: 'account1', 
            members: [
                {userId: 'user1', role: 'owner'},
            ]
        },
    ], [
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'},
        {userId: 'user2', name: 'User 2', email: 'def@example.com'},
    ])
    await accountStore.addMember('account1', {
        userId: 'user2',
        role: 'user',
    })
    let account = await accountStore.getAccount('account1')
    expect(account).not.toBeNull()
    expect(account.accountId).toBe('account1')
    expect(account.members.length).toBe(2)
    expect(account.members[0].userId).toBe('user1')
    expect(account.members[0].role).toBe('owner')
    expect(account.members[1].userId).toBe('user2')
    expect(account.members[1].role).toBe('user')
});

test.concurrent('addMember that doesnt exist', async () => {
    const accountStore = await makeConfiguredUserStore([
        {
            accountId: 'account1', 
            members: [
                {userId: 'user1', role: 'owner'},
            ]
        },
    ], [])
    await expect(accountStore.addMember('account1', {
        userId: 'user2',
        role: 'user',
    })).rejects.toThrow()
});

test.concurrent('addMember owner', async () => {
    const accountStore = await makeConfiguredUserStore([
        {
            accountId: 'account1', 
            members: [
                {userId: 'user1', role: 'owner'},
            ]
        },
    ], [
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'},
        {userId: 'user2', name: 'User 2', email: 'def@example.com'},
    ])
    await expect(accountStore.addMember('account1', {
        userId: 'user2',
        role: 'owner',
    })).rejects.toThrow()
});

test.concurrent('setOwner that doesnt exist', async () => {
    const accountStore = await makeConfiguredUserStore([
        {
            accountId: 'account1', 
            members: [
                {userId: 'user1', role: 'owner'},
            ]
        },
    ], [])
    await expect(accountStore.setOwner('account1', 'user2')).rejects.toThrow()
});