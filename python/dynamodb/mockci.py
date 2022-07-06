import requests

# see https://mockci.cloud/learn/docs/init-config-schema for the schema of the prefab argument
def start_session(api_key = None, prefab = {}):
    qs = ""
    if api_key:
        qs = "?api_key=" + api_key
    resp = requests.post("https://session.mockci.cloud/start" + qs, json=prefab)

    if resp.status_code < 200 or resp.status_code >= 300:
        raise Exception("Failed to start session: " + resp.text)

    body = resp.json()
    if "error" in body:
        raise Exception("Failed to start session: " + body["error"])
    if not body["ready"]:
        raise Exception("Created session is not ready, poll /check-session if it keeps happening")
    return body["dynamodbEndpoint"]