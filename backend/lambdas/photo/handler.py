from decimal import Decimal
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
PHOTO_TABLE = os.environ['PHOTO_TABLE']
THUMBNAIL_BUCKET = os.environ['THUMBNAIL_BUCKET']

# Helper class to convert DynamoDB Decimal types to int/float for JSON serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)

def handler(event, context):
    table = dynamodb.Table(PHOTO_TABLE)

    # Scan the DynamoDB table for items with status "approved"
    response = table.scan(
        FilterExpression = '#s = :approved',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':approved': 'approved'},
    )

    photos = response['Items']

     # Build public image URLs from thumbnail keys stored in DynamoDB
    for photo in photos:
        key = photo.get('key', '')
        filename = key.split('/')[-1].rsplit('.', 1)[0]  # Strip directory and extension to get base filename
        photo['image_url_300'] = f"{THUMBNAIL_BUCKET}/thumbnails/{filename}_300w.jpg"

    # Return the list of approved photos as JSON
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  
        },
        'body': json.dumps(photos, cls=DecimalEncoder)
    }