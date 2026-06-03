import json
import os
import uuid
import boto3

s3 = boto3.client('s3')
RAW_BUCKET = os.environ['RAW_BUCKET']


def handler(event, context):
    body = json.loads(event.get('body') or '{}')
    filename = body.get('filename', 'upload.jpg')

    # Sanitise the filename — keep only the last extension
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'jpg'
    allowed = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
    if ext not in allowed:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unsupported file type'}),
        }

    key = f"uploads/{uuid.uuid4()}.{ext}"

    content_type = 'image/jpeg' if ext in ('jpg', 'jpeg') else f'image/{ext}'

    presigned_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': RAW_BUCKET,
            'Key': key,
            'ContentType': content_type,
        },
        ExpiresIn=300,
    )

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({ 'upload_url': presigned_url, 'key': key, 'content_type': content_type }),
    }
