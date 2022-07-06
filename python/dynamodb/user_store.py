

class UserStore:
    def __init__(self, dynamodb_client):
        self.dynamodb_client = dynamodb_client

    def get_user(self, user_id):
        table = self.dynamodb_client.Table('users')
        response = table.get_item(
            Key={
                'userId': user_id
            }
        )
        if 'Item' in response:
            return response['Item']
        return None

    def delete_user(self, user_id):
        table = self.dynamodb_client.Table('users')
        response = table.delete_item(
            Key={
                'userId': user_id
            }
        )
        return response

    def put_user(self, user_id, api_key, configs):
        table = self.dynamodb_client.Table('users')
        response = table.put_item(
            Item={
                'userId': user_id,
                'apiKey': api_key,
                'configs': configs
            }
        )
        return response

    def list_users(self):
        table = self.dynamodb_client.Table('users')
        response = table.scan()
        return response['Items']