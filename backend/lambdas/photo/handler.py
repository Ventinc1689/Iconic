import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
PHOTO_TABLE = os.environ['PHOTO_TABLE']

def handler(event, context):
    table = dynamodb.Table(PHOTO_TABLE)

    # Scan the DynamoDB table for items with status "approved"
    response = table.scan(
        FilterExpression = '#s = :approved',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':approved': 'approved'},
    )

    photos = response['Items']

    # Return the list of approved photos as JSON
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Allow CORS for all origins
        },
        'body': json.dumps(photos)
    }