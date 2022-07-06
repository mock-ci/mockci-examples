package mockci

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
)

type Prefab struct {
	DynamoDB DynamoDBConfig `json:"dynamodb"`
}

type DynamoDBConfig struct {
	Tables []DynamoDBTable `json:"tables"`
}

type DynamoDBTable struct {
	Name       string                   `json:"name"`
	Attributes []DynamoDBAttribute      `json:"attributes"`
	HashKey    string                   `json:"hashKey"`
	RangeKey   *string                  `json:"rangeKey,omitempty"`
	Indexes    []DynamoDBIndex          `json:"indexes,omitempty"`
	SeedData   []map[string]interface{} `json:"seedData,omitempty"`
}

type DynamoDBAttribute struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type DynamoDBIndex struct {
	Name     string  `json:"name"`
	HashKey  string  `json:"hashKey"`
	RangeKey *string `json:"rangeKey,omitempty"`
}

type sessionStartOutput struct {
	Error *string `json:"error"`

	DynamoDBEndpoint string `json:"dynamodbEndpoint"`
	Ready            bool   `json:"ready"`
}

func StartSession(apiKey string, prefab Prefab) (string, error) {
	qs := url.Values{}
	if apiKey != "" {
		qs.Set("api_key", apiKey)
	}

	inputBody, err := json.Marshal(prefab)
	if err != nil {
		return "", err
	}

	resp, err := http.Post("https://session.mockci.cloud/start?"+qs.Encode(), "application/json", bytes.NewReader(inputBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	outputBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("error starting session: %s", outputBody)
	}
	var parsedOutput sessionStartOutput
	err = json.Unmarshal(outputBody, &parsedOutput)
	if err != nil {
		return "", err
	}
	if parsedOutput.Error != nil {
		return "", fmt.Errorf("error starting session: %s", *parsedOutput.Error)
	}
	if !parsedOutput.Ready {
		return "", fmt.Errorf("created session is not ready, poll /check-session if it keeps happening")
	}
	return parsedOutput.DynamoDBEndpoint, nil
}
