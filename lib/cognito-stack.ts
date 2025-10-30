import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface CognitoStackProps extends cdk.StackProps {
  environment?: string;
  frontendUrl?: string;
  allowSelfSignUp?: boolean;
}

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly adminGroup: cognito.CfnUserPoolGroup;
  public readonly userGroup: cognito.CfnUserPoolGroup;
  public readonly adminRole: iam.Role;
  public readonly userRole: iam.Role;

  constructor(scope: Construct, id: string, props: CognitoStackProps = {}) {
    super(scope, id, props);

    // Environment configuration
    const environment = props.environment || process.env.ENVIRONMENT || 'dev';
    const frontendUrl = props.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
    const allowSelfSignUp = props.allowSelfSignUp !== undefined 
      ? props.allowSelfSignUp 
      : (process.env.ALLOW_SELF_SIGNUP === 'true' || environment === 'dev');

    // Create User Pool
    this.userPool = new cognito.UserPool(this, 'MunhuoltoUserPool', {
      userPoolName: `munhuolto-user-pool-${environment}`,
      selfSignUpEnabled: allowSelfSignUp,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        'role': new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 20, 
          mutable: true 
        }),
        'environment': new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 10, 
          mutable: false 
        }),
      },
      passwordPolicy: {
        minLength: environment === 'prod' ? 12 : 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: environment === 'prod',
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Create User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'MunhuoltoUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `munhuolto-web-client-${environment}`,
      generateSecret: false, // For web applications
      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `${frontendUrl}/callback`,
          `${frontendUrl}/auth/callback`,
          ...(environment === 'dev' ? ['http://localhost:3000/callback'] : [])
        ],
        logoutUrls: [
          `${frontendUrl}/logout`,
          `${frontendUrl}/auth/logout`,
          ...(environment === 'dev' ? ['http://localhost:3000/logout'] : [])
        ],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // Create Identity Pool
    this.identityPool = new cognito.CfnIdentityPool(this, 'MunhuoltoIdentityPool', {
      identityPoolName: `munhuolto-identity-pool-${environment}`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    // Create IAM roles for different user types
    this.adminRole = new iam.Role(this, 'AdminRole', {
      roleName: `munhuolto-admin-role-${environment}`,
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      managedPolicies: environment === 'prod' 
        ? [] // No managed policies in production, use custom policies only
        : [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')],
      inlinePolicies: {
        AdminPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:AdminGetUser',
                'cognito-idp:AdminListGroupsForUser',
                'cognito-idp:AdminAddUserToGroup',
                'cognito-idp:AdminRemoveUserFromGroup',
                'cognito-idp:ListUsers',
              ],
              resources: [this.userPool.userPoolArn],
            }),
            ...(environment === 'prod' ? [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/munhuolto-*`],
              })
            ] : []),
          ],
        }),
      },
    });

    this.userRole = new iam.Role(this, 'UserRole', {
      roleName: `munhuolto-user-role-${environment}`,
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        UserPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
              ],
              resources: environment === 'prod' 
                ? [`arn:aws:dynamodb:${this.region}:${this.account}:table/munhuolto-*`]
                : ['*'],
              conditions: {
                'ForAllValues:StringEquals': {
                  'dynamodb:LeadingKeys': ['${cognito-identity.amazonaws.com:sub}'],
                },
              },
            }),
          ],
        }),
      },
    });

    // Create User Pool Groups
    this.adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admin',
      description: 'Admin users with full access',
      precedence: 1,
      roleArn: this.adminRole.roleArn,
    });

    this.userGroup = new cognito.CfnUserPoolGroup(this, 'UserGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'user',
      description: 'Regular users with limited access',
      precedence: 2,
      roleArn: this.userRole.roleArn,
    });

    // Create Identity Pool Role Attachment
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.userRole.roleArn,
      },
      roleMappings: {
        'cognito': {
          type: 'Token',
          ambiguousRoleResolution: 'AuthenticatedRole',
          identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
        },
      },
    });

    // Outputs for other stacks to use
    new cdk.CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Deployment Environment',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: frontendUrl,
      description: 'Frontend Application URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
      description: 'Cognito User Pool Domain',
    });

    new cdk.CfnOutput(this, 'AuthCallbackUrl', {
      value: `${frontendUrl}/callback`,
      description: 'OAuth Callback URL',
    });
  }

  // Helper methods to get role ARNs
  public getAdminRoleArn(): string {
    return this.adminRole.roleArn;
  }

  public getUserRoleArn(): string {
    return this.userRole.roleArn;
  }
}
