# Node.js example for DynamoDB with Jest

To run this example:
```bash
npm install
npm test
```

This example shows how you can easily parallelize tests when using MockCI and still have the ability to seed your tables with individual data for each test.
With how many tests this project has, you'll most likely reach the rate limits ("Request failed with status code 429") if you don't provide an API key. You can get one here from your [MockCI acccount](https://mockci.com/portal/home).

You can then input the API key in the `.env` file in the root of the project, for example

```
MOCKCI_API_KEY="13e75aaf-a8a3-41ae-9a43-2a16caa99513"
```