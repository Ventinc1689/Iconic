import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
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

    // ============================================
    // SNS Topic
    // ============================================
    const photoUploadedTopic = new sns.Topic(this, 'PhotoUploadedTopic', {
      topicName: 'iconic-photo-uploaded',
    });

    // ============================================
    // SQS Queue
    // ============================================
    const resizeQueue = new sqs.Queue(this, 'ResizeQueue', {
      queueName: 'iconic-resize-queue',
      visibilityTimeout: cdk.Duration.seconds(60)
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
      code: lambda.Code.fromAsset('../backend/lambdas/resize')
    })

    // Wire SQS queue as event source for the resize Lambda
    resizePhoto.addEventSource(
      new lambda_event_sources.SqsEventSource(resizeQueue, { batchSize: 1 })
    )

    // Output the bucket name as a CloudFormation output
    new cdk.CfnOutput(this, 'BucketName', {
      value: imageBucket.bucketName,
      description: 'S3 Bucket for storing soccer iconic moment images',
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
