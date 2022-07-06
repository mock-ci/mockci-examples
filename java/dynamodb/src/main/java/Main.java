import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.google.gson.Gson;

import java.io.IOException;
import java.util.List;

public class Main {

    static String MOCKCI_API_KEY = "";
    static String TABLE_DEFINITION = "{\n" +
            "    \"dynamodb\": {\n" +
            "        \"tables\": [\n" +
            "            {\n" +
            "                \"seedData\": [\n" +
            "                    { \"userId\": \"john\", \"apiKey\": \"john's api key\", \"configs\": [ { \"item1\": \"abc\" } ] },\n" +
            "                    { \"userId\": \"bob\", \"apiKey\": \"bob's api key\" }\n" +
            "                ],\n" +
            "                \"name\": \"users\",\n" +
            "                \"attributes\": [\n" +
            "                    { \"name\": \"userId\", \"type\": \"S\" },\n" +
            "                    { \"name\": \"apiKey\", \"type\": \"S\" }\n" +
            "                ],\n" +
            "                \"hashKey\": \"userId\",\n" +
            "                \"indexes\": [\n" +
            "                    { \"name\": \"apiKey-index\", \"hashKey\": \"apiKey\" }\n" +
            "                ]\n" +
            "            }\n" +
            "        ]\n" +
            "    }\n" +
            "}";

    public static void main(String args[]) throws IOException, InterruptedException {
        System.out.println("Creating MockCI session...");
        String mockCiEndpoint = MockCI.startSession(MOCKCI_API_KEY, TABLE_DEFINITION);
        System.out.println("Created DynamoDB endpoint: " + mockCiEndpoint);

        AmazonDynamoDB client = AmazonDynamoDBClientBuilder
                .standard()
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(mockCiEndpoint, "us-east-1"))
                .build();
        UserStore store = new UserStore(client);

        System.out.println("\nListing existing items...");
        List<UserStore.UserEntry> users = store.listUsers();
        System.out.println("Existing users: " + new Gson().toJson(users));

        System.out.println("\nDeleting item...");
        store.deleteUser("john");

        System.out.println("\nListing existing items...");
        users = store.listUsers();
        System.out.println("Existing users: " + new Gson().toJson(users));

        System.out.println("\nStoring new item...");
        store.storeUser(new UserStore.UserEntry("camille", "camille's api key"));

        System.out.println("\nGetting item...");
        UserStore.UserEntry camille = store.getUser("camille");
        System.out.println("Item: " + new Gson().toJson(camille));

        System.out.println("\nListing items from index...");
        List<UserStore.UserEntry> fromIndex = store.getUserWithApiKey("bob's api key");
        System.out.println("Items: " + new Gson().toJson(fromIndex));
    }
}
