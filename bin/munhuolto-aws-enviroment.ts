#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MunhuoltoAwsEnviromentStack } from '../lib/munhuolto-aws-enviroment-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { DatabaseStack } from '../lib/database-stack';

// Load environment variables
require('dotenv').config();

const app = new cdk.App();

// Environment configuration
const environment = process.env.ENVIRONMENT || app.node.tryGetContext('environment') || 'dev';
const frontendUrl = process.env.FRONTEND_URL || app.node.tryGetContext('frontendUrl');
const allowSelfSignUp = process.env.ALLOW_SELF_SIGNUP === 'true' || environment === 'dev';

// Common stack properties
const stackProps: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Project: 'munhuolto',
  },
};

// Create stacks
const databaseStack = new DatabaseStack(app, `MunhuoltoDatabase-${environment}`, {
  ...stackProps,
  environment,
});

const cognitoStack = new CognitoStack(app, `MunhuoltoCognito-${environment}`, {
  ...stackProps,
  environment,
  frontendUrl,
  allowSelfSignUp,
});

new MunhuoltoAwsEnviromentStack(app, `MunhuoltoMain-${environment}`, {
  ...stackProps,
  // You can pass other stacks' resources here if needed
});