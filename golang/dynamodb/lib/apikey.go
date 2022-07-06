package lib

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/pkg/errors"
)

type UserEntry struct {
	UserId string `json:"userId,omitempty"`
	ApiKey string `json:"apiKey,omitempty"`
}

const UsersTable = "users"

func StoreUser(item UserEntry) error {
	return StoreDDBItem(item, UsersTable)
}

func DeleteUser(userId string) error {
	return DeleteDDBItem(map[string]string{"userId": userId}, UsersTable)
}

func GetUser(userId string) (*UserEntry, error) {
	var item UserEntry
	err := GetDDBItem(map[string]string{"userId": userId}, UsersTable, &item)
	if err != nil {
		return nil, errors.Wrap(err, "error getting api key")
	}
	if item.ApiKey == "" {
		return nil, nil
	}
	return &item, nil
}

func GetUsersFromApiKey(apiKey string) ([]UserEntry, error) {
	sess, err := GetSession()
	if err != nil {
		return nil, err
	}
	dynamoClient := dynamodb.New(sess)

	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(UsersTable),
		IndexName:              aws.String("apiKey-index"),
		KeyConditionExpression: aws.String("apiKey = :apiKey"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":apiKey": {S: aws.String(apiKey)},
		},
	})
	if err != nil {
		return nil, errors.Wrap(err, "error getting item from dynamodb")
	}
	if len(result.Items) == 0 {
		return nil, nil
	}

	var output []UserEntry
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &output)
	if err != nil {
		return nil, errors.Wrap(err, "error unmarshaling dynamodb result")
	}
	return output, nil
}

func ListUsers() ([]UserEntry, error) {
	var items []UserEntry
	err := ScanDDBItems(UsersTable, &items)
	if err != nil {
		return nil, errors.Wrap(err, "error listing items")
	}
	return items, nil
}
