import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.model.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UserStore {
    static final String USER_TABLE = "users";

    public static class UserEntry {
        String userId;
        String apiKey;

        public UserEntry(String userId, String apiKey) {
            this.userId = userId;
            this.apiKey = apiKey;
        }
    }

    private AmazonDynamoDB client;

    public UserStore(AmazonDynamoDB client) {
        this.client = client;
    }

    UserEntry getUser(String userId) {
        HashMap<String, AttributeValue> keyToGet = new HashMap<>();
        keyToGet.put("userId", new AttributeValue(userId));

        GetItemResult result = client.getItem(new GetItemRequest(USER_TABLE, keyToGet));
        Map<String, AttributeValue> item = result.getItem();

        return new UserEntry(item.get("userId").getS(), item.get("apiKey").getS());
    }

    List<UserEntry> listUsers() {
        ScanResult result = client.scan(new ScanRequest(USER_TABLE));
        List<Map<String, AttributeValue>> items = result.getItems();

        List<UserEntry> output = new ArrayList<>();
        for (Map<String, AttributeValue> item : items) {
            output.add(new UserEntry(item.get("userId").getS(), item.get("apiKey").getS()));
        }
        return output;
    }

    List<UserEntry> getUserWithApiKey(String apiKey) {
        HashMap<String, AttributeValue> attrValues = new HashMap<>();
        attrValues.put(":apiKey", new AttributeValue(apiKey));

        QueryRequest req = new QueryRequest(USER_TABLE)
                .withIndexName("apiKey-index")
                .withKeyConditionExpression("apiKey = :apiKey")
                .withExpressionAttributeValues(attrValues);

        QueryResult result = client.query(req);
        List<Map<String, AttributeValue>> items = result.getItems();

        List<UserEntry> output = new ArrayList<>();
        for (Map<String, AttributeValue> item : items) {
            output.add(new UserEntry(item.get("userId").getS(), item.get("apiKey").getS()));
        }
        return output;
    }

    void deleteUser(String userId) {
        HashMap<String, AttributeValue> keyToGet = new HashMap<>();
        keyToGet.put("userId", new AttributeValue(userId));
        client.deleteItem(new DeleteItemRequest(USER_TABLE, keyToGet));
    }

    void storeUser(UserEntry user) {
        HashMap<String, AttributeValue> item = new HashMap<>();
        item.put("userId", new AttributeValue(user.userId));
        item.put("apiKey", new AttributeValue(user.apiKey));
        client.putItem(new PutItemRequest(USER_TABLE, item));
    }
}
