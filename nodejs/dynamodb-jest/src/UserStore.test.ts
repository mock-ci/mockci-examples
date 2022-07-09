import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { MockCISession, MockCIPrefab } from 'mockci';
import { UserTableDefinition } from './Definitions';
import UserStore, { UserEntry } from './UserStore';

const makeConfiguredUserStore = async (seedData: UserEntry[]) => {
    const prefab: MockCIPrefab = {
        dynamodb: {
            tables: [
                {...UserTableDefinition, seedData}
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
    return new UserStore(client)
}

jest.setTimeout(30000)

test.concurrent('getUser that exists', async () => {
    const userStore = await makeConfiguredUserStore([
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'}
    ])
    let user = await userStore.getUser('user1')
    expect(user).not.toBeNull()
    expect(user.userId).toBe('user1')
    expect(user.name).toBe('User 1')
    expect(user.email).toBe('abc@example.com')
});

test.concurrent('getUser that doesnt exist', async () => {
    const userStore = await makeConfiguredUserStore([])
    expect(await userStore.getUser('user1')).toBeNull()
});

test.concurrent('listUsers', async () => {
    const userStore = await makeConfiguredUserStore([
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'},
        {userId: 'user2', name: 'User 2', email: 'def@example.com'},
    ])
    let users = await userStore.listUsers()
    expect(users.length).toBe(2)
});

test.concurrent('deleteUser that exists', async () => {
    const userStore = await makeConfiguredUserStore([
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'},
    ])
    await userStore.deleteUser('user1')
    expect(await userStore.getUser('user1')).toBeNull()
});

test.concurrent('deleteUser that doesnt exist', async () => {
    const userStore = await makeConfiguredUserStore([])
    await userStore.deleteUser('user1')
});

test.concurrent('getUserFromEmail that exists', async () => {
    const userStore = await makeConfiguredUserStore([
        {userId: 'user1', name: 'User 1', email: 'abc@example.com'}
    ])
    let users = await userStore.getUserFromEmail('abc@example.com')
    expect(users.length).toBe(1)
    expect(users[0].userId).toBe('user1')
    expect(users[0].name).toBe('User 1')
    expect(users[0].email).toBe('abc@example.com')
});

test.concurrent('getUserFromEmail that doesnt exist', async () => {
    const userStore = await makeConfiguredUserStore([])
    let users = await userStore.getUserFromEmail('abc@example.com')
    expect(users.length).toBe(0)
});

test.concurrent('storeUser', async () => {
    const userStore = await makeConfiguredUserStore([])
    await userStore.storeUser({
        userId: 'user1',
        name: 'User 1',
        email: 'abc@example.com',
    })
    let user = await userStore.getUser('user1')
    expect(user).not.toBeNull()
});