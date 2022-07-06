package main

import (
	"api_key_example/lib"
	"api_key_example/mockci"
	"fmt"
	"os"
)

// paste your api key here:
const MockCIApiKey = ""

var TableDefinition = mockci.Prefab{
	DynamoDB: mockci.DynamoDBConfig{
		Tables: []mockci.DynamoDBTable{
			{
				Name: "users",
				Attributes: []mockci.DynamoDBAttribute{
					{Name: "userId", Type: "S"},
					{Name: "apiKey", Type: "S"},
				},
				HashKey: "userId",
				SeedData: []map[string]interface{}{
					{"userId": "john", "apiKey": "john's api key"},
					{"userId": "bob", "apiKey": "bob's api key"},
				},
				Indexes: []mockci.DynamoDBIndex{
					{Name: "apiKey-index", HashKey: "apiKey"},
				},
			},
		},
	},
}

func main() {
	fmt.Println("creating MockCI session...")
	mockCiEndpoint, err := mockci.StartSession(MockCIApiKey, TableDefinition)
	if err != nil {
		panic(err)
	}
	err = os.Setenv("MOCKCI_DYNAMODB_ENDPOINT", mockCiEndpoint)
	if err != nil {
		panic(err)
	}

	fmt.Println("\nlisting items...")
	users, err := lib.ListUsers()
	if err != nil {
		panic(err)
	}
	fmt.Println(fmt.Sprintf("\nexisting users: %+v", users))

	fmt.Println("\ndeleting item...")
	err = lib.DeleteUser("john")
	if err != nil {
		panic(err)
	}

	fmt.Println("\ngetting item...")
	user, err := lib.GetUser("bob")
	if err != nil {
		panic(err)
	}
	fmt.Println(fmt.Sprintf("got user: %+v", user))

	fmt.Println("\nstoring new item...")
	err = lib.StoreUser(lib.UserEntry{
		UserId: "camille",
		ApiKey: "camille's api key",
	})
	if err != nil {
		panic(err)
	}

	fmt.Println("\ngetting items from index...")
	users, err = lib.GetUsersFromApiKey("camille's api key")
	if err != nil {
		panic(err)
	}
	fmt.Println(fmt.Sprintf("\nusers with camille's api key: %+v", users))
}
