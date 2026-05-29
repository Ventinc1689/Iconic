import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
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

    new cdk.CfnOutput(this, 'BucketName', {
      value: imageBucket.bucketName,
      description: 'S3 Bucket for storing soccer iconic moment images',
    })
  }
}
