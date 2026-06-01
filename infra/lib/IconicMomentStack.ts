import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class IconicMomentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // S3 Bucket 
    // ============================================
    const imageBucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: 'iconic-moment-image-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const resizedImageBucket = new s3.Bucket(this, 'ResizedImageBucket', {
      bucketName: 'iconic-moment-resized-image-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ============================================
    // SNS Topic
    // ============================================
    const photoUploadedTopic = new sns.Topic(this, 'PhotoUploadedTopic', {
      topicName: 'iconic-photo-uploaded',
    });

    // ============================================
    // SQS Queue
    // ============================================
    const resizeDLQ = new sqs.Queue(this, 'ResizeDLQ', {
      queueName: 'iconic-resize-dlq',
    });

    const resizeQueue = new sqs.Queue(this, 'ResizeQueue', {
      queueName: 'iconic-resize-queue',
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: {
        queue: resizeDLQ,
        maxReceiveCount: 3,
      },
    })

    // Subscribe the SQS queue to the SNS topic
    photoUploadedTopic.addSubscription(
      new sns_subs.SqsSubscription(resizeQueue)
    );

    // ============================================
    // Lambda Function for S3 Ingestion
    // ============================================
    const ingestionLambda = new lambda.Function(this, 'IngestionLambda', {
      functionName: 'moment-ingestion',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/ingestion'),
      environment: {
        PHOTO_UPLOADED_TOPIC_ARN: photoUploadedTopic.topicArn,
      }
    });

    // Set up S3 event notification to trigger the Lambda function on new object creation
    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED, 
      new s3n.LambdaDestination(ingestionLambda)
    );

    // ============================================
    // Permissions
    // ============================================
    imageBucket.grantRead(ingestionLambda);
    photoUploadedTopic.grantPublish(ingestionLambda);

    // ============================================
    // Lambda Function for Image Resizing
    // ============================================
    const resizePhoto = new lambda.Function(this, 'ResizeLambda', {
      functionName: 'resize-photo',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../backend/lambdas/resize', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output --platform manylinux2014_x86_64 --only-binary=:all: && cp -r . /asset-output',
          ],
        },
      }),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        RAW_BUCKET: imageBucket.bucketName,
        RESIZED_BUCKET: resizedImageBucket.bucketName,
      },
    });

    // Wire SQS queue as event source for the resize Lambda
    resizePhoto.addEventSource(
      new lambda_event_sources.SqsEventSource(resizeQueue, { batchSize: 1 })
    )

    // Permissions for the resize Lambda
    imageBucket.grantRead(resizePhoto);
    resizedImageBucket.grantPut(resizePhoto);

    // Output the bucket name as a CloudFormation output
    new cdk.CfnOutput(this, 'BucketName', {
      value: imageBucket.bucketName,
      description: 'S3 Bucket for storing soccer iconic moment images',
    })

    // Output the resized bucket name as a CloudFormation output
    new cdk.CfnOutput(this, 'ResizedBucketName', {
      value: resizedImageBucket.bucketName,
      description: 'S3 Bucket for storing resized soccer iconic moment images',
    })

    // Output the SNS topic ARN as a CloudFormation output
    new cdk.CfnOutput(this, 'TopicArn', { 
      value: photoUploadedTopic.topicArn 
    });

    new cdk.CfnOutput(this, 'ResizeQueueUrl', {
      value: resizeQueue.queueUrl,
    })
  }
}
