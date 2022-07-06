package lib

import (
	"encoding/json"
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/pkg/errors"
	"os"
	"time"
)

var region = os.Getenv("AWS_REGION")

func GetSession() (*session.Session, error) {
	if region == "" {
		region = "us-east-1"
	}
	config := &aws.Config{
		Region: aws.String(region),
	}
	if v, ok := os.LookupEnv("MOCKCI_DYNAMODB_ENDPOINT"); ok {
		config.Endpoint = aws.String(v)
	}
	sess, err := session.NewSession(config)
	if err != nil {
		return nil, errors.Wrap(err, "error creating AWS session")
	}
	if sess.Config.Endpoint != nil {
		fmt.Println("[DynamoDB]> Using endpoint:", *sess.Config.Endpoint)
	}
	return sess, nil
}

func DeleteDDBItem(item interface{}, table string) error {
	sess, err := GetSession()
	if err != nil {
		return err
	}
	dynamoClient := dynamodb.New(sess)

	b, err := json.Marshal(item)
	if err != nil {
		return errors.Wrap(err, "Failed to marshal item")
	}
	fmt.Println(fmt.Sprintf("[DDB DeleteItem %v]> %v", table, string(b)))

	ddb, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return errors.Wrap(err, "error marshalling item to ddb format")
	}

	_, err = dynamoClient.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: &table,
		Key:       ddb,
	})
	if err != nil {
		return errors.Wrap(err, "error deleting ddb item")
	}
	return nil
}

func GetDDBItem(item interface{}, table string, output interface{}) error {
	sess, err := GetSession()
	if err != nil {
		return err
	}
	dynamoClient := dynamodb.New(sess)

	b, err := json.Marshal(item)
	if err != nil {
		return errors.Wrap(err, "Failed to marshal item")
	}
	fmt.Println(fmt.Sprintf("[DDB GetItem %v]> %v", table, string(b)))

	ddb, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return errors.Wrap(err, "error marshalling item to ddb format")
	}

	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(table),
		Key:       ddb,
	})
	if err != nil {
		return errors.Wrap(err, "error getting item from dynamodb")
	}
	if result.Item == nil {
		return nil
	}

	err = dynamodbattribute.UnmarshalMap(result.Item, output)
	if err != nil {
		return errors.Wrap(err, "error unmarshaling dynamodb result")
	}
	return nil
}

func ScanDDBItems(table string, output interface{}) error {
	sess, err := GetSession()
	if err != nil {
		return err
	}
	dynamoClient := dynamodb.New(sess)

	fmt.Println(fmt.Sprintf("[DDB ScanItems %v]>", table))

	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName: aws.String(table),
	})
	if err != nil {
		return errors.Wrap(err, "error getting item from dynamodb")
	}
	if len(result.Items) == 0 {
		return nil
	}

	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, output)
	if err != nil {
		return errors.Wrap(err, "error unmarshalling dynamodb result")
	}
	return nil
}

func StoreDDBItem(item interface{}, table string) error {
	b, err := json.Marshal(item)
	if err != nil {
		return errors.Wrap(err, "Failed to marshal item")
	}
	fmt.Println(fmt.Sprintf("[DDB PutItem %v]> %v", table, string(b)))

	sess, err := GetSession()
	if err != nil {
		return err
	}
	dynamoClient := dynamodb.New(sess)

	ddb, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return errors.Wrap(err, "error marshalling item to ddb format")
	}

	t := time.Now()
	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(table),
		Item:      ddb,
	})
	fmt.Println("[DDB PutItem "+table+"]< in ", time.Since(t))
	if err != nil {
		return errors.Wrap(err, "error creating ddb item")
	}
	return nil
}
