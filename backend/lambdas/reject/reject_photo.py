import os
import boto3

dynamodb = boto3.resource('dynamodb')
PHOTO_TABLE = os.environ['PHOTO_TABLE']

def reject_photo(event, context):
    table = dynamodb.Table(PHOTO_TABLE)
    photo_id = event['photo_id']
    
    table.update_item(
        Key={'photo_id': photo_id},
        UpdateExpression='''SET
            photo_status = :photo_status,
            rejection_reason = :rejection_reason
        ''',
        ExpressionAttributeValues={
            ':photo_status': 'rejected',
            ':rejection_reason': event.get('rejection_reason', 'Invalid photo'),
        },
    )

    print(f"Rejected photo_id={photo_id}")