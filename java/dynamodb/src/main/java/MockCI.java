import com.google.gson.Gson;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

public class MockCI {
    static public class MockCIPrefab {
        DynamoDBConfig dynamodb;
    }

    static public class DynamoDBConfig {
        DynamoDBTable[] tables;
    }

    static public class DynamoDBTable {
        String name;
        DynamoDBAttribute[] attributes;
        String hashKey;
        String rangeKey = null;
        DynamoDBIndex[] indexes = null;
        Map<String, Object>[] seedData;
    }

    static public class DynamoDBAttribute {
        String name;
        String type;
    }

    static public class DynamoDBIndex {
        String name;
        String hashKey;
        String rangeKey = null;
    }


    static class SessionStartOutput {
        String error = null;

        String dynamodbEndpoint = null;
        Boolean ready;
    }

    public static String startSession(String apiKey, String prefabJson) throws IOException, InterruptedException {
        MockCIPrefab prefab = new Gson().fromJson(prefabJson, MockCIPrefab.class);
        return startSession(apiKey, prefab);
    }
    public static String startSession(String apiKey, MockCIPrefab prefab) throws IOException, InterruptedException {
        String uri = "https://session.mockci.cloud/start";
        if(apiKey != null && !apiKey.isEmpty()) {
            uri += "?api_key=" + apiKey;
        }

        HttpRequest.BodyPublisher body = HttpRequest.BodyPublishers.ofString(new Gson().toJson(prefab));
        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .POST(body)
            .uri(URI.create(uri))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        String responseBody = response.body();
        SessionStartOutput parsedResponse = new Gson().fromJson(responseBody, SessionStartOutput.class);

        if(parsedResponse.error != null && !parsedResponse.error.isEmpty()) {
            throw new IOException("error starting MockCI session: " + parsedResponse.error);
        }
        if(response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("error starting MockCI session: " + responseBody);
        }
        if(!parsedResponse.ready) {
            throw new IOException("Created session is not ready, poll /check-session if it keeps happening");
        }
        return parsedResponse.dynamodbEndpoint;
    }
}


