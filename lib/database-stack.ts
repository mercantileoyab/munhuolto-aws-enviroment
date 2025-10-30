import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environment?: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly workshopTable: dynamodb.Table;
  public readonly reservationFlatTable: dynamodb.Table;
  public readonly serviceCatalogTable: dynamodb.Table;
  public readonly workshopServiceFlatTable: dynamodb.Table;
  public readonly carBrandTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps = {}) {
    super(scope, id, props);

    const environment = props.environment || process.env.ENVIRONMENT || 'dev';
    const isProduction = environment === 'prod';

    // Workshop Table
    this.workshopTable = new dynamodb.Table(this, 'WorkshopTable', {
      tableName: `workshop-${environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: isProduction ? dynamodb.BillingMode.PROVISIONED : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: isProduction,
    });

    // Add Global Secondary Indexes for workshop table
    this.workshopTable.addGlobalSecondaryIndex({
      indexName: 'gridKey_5km-index',
      partitionKey: { name: 'gridKey_5km', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    this.workshopTable.addGlobalSecondaryIndex({
      indexName: 'gridKey_10km-index',
      partitionKey: { name: 'gridKey_10km', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    this.workshopTable.addGlobalSecondaryIndex({
      indexName: 'gridKey_20km-index',
      partitionKey: { name: 'gridKey_20km', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    this.workshopTable.addGlobalSecondaryIndex({
      indexName: 'gridKey_50km-index',
      partitionKey: { name: 'gridKey_50km', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    // Reservation Flat Table
    this.reservationFlatTable = new dynamodb.Table(this, 'ReservationFlatTable', {
      tableName: `reservation_flat-${environment}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: isProduction ? dynamodb.BillingMode.PROVISIONED : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: isProduction,
    });

    // Service Catalog Table
    this.serviceCatalogTable = new dynamodb.Table(this, 'ServiceCatalogTable', {
      tableName: `serviceCatalog-${environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: isProduction ? dynamodb.BillingMode.PROVISIONED : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: isProduction,
    });

    // Add Global Secondary Indexes for service catalog table
    this.serviceCatalogTable.addGlobalSecondaryIndex({
      indexName: 'type-index',
      partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    this.serviceCatalogTable.addGlobalSecondaryIndex({
      indexName: 'category-index',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    this.serviceCatalogTable.addGlobalSecondaryIndex({
      indexName: 'type-category-index',
      partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    // Workshop Service Flat Table
    this.workshopServiceFlatTable = new dynamodb.Table(this, 'WorkshopServiceFlatTable', {
      tableName: `workshop_service_flat-${environment}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: isProduction ? dynamodb.BillingMode.PROVISIONED : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: isProduction,
    });

    // Add Global Secondary Index for workshop service flat table
    this.workshopServiceFlatTable.addGlobalSecondaryIndex({
      indexName: 'service-workshop-index',
      partitionKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    // Car Brand Table
    this.carBrandTable = new dynamodb.Table(this, 'CarBrandTable', {
      tableName: `carBrand-${environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: isProduction ? dynamodb.BillingMode.PROVISIONED : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: isProduction,
    });

    // Add Global Secondary Index for car brand table
    this.carBrandTable.addGlobalSecondaryIndex({
      indexName: 'name-index',
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: isProduction ? 5 : undefined,
      writeCapacity: isProduction ? 5 : undefined,
    });

    // Outputs for CloudFormation
    new cdk.CfnOutput(this, 'WorkshopTableName', {
      value: this.workshopTable.tableName,
      description: 'Workshop Table Name',
    });

    new cdk.CfnOutput(this, 'ReservationFlatTableName', {
      value: this.reservationFlatTable.tableName,
      description: 'Reservation Flat Table Name',
    });

    new cdk.CfnOutput(this, 'ServiceCatalogTableName', {
      value: this.serviceCatalogTable.tableName,
      description: 'Service Catalog Table Name',
    });

    new cdk.CfnOutput(this, 'WorkshopServiceFlatTableName', {
      value: this.workshopServiceFlatTable.tableName,
      description: 'Workshop Service Flat Table Name',
    });

    new cdk.CfnOutput(this, 'CarBrandTableName', {
      value: this.carBrandTable.tableName,
      description: 'Car Brand Table Name',
    });
  }

  // Helper methods to access tables
  public getWorkshopTable(): dynamodb.Table {
    return this.workshopTable;
  }

  public getReservationFlatTable(): dynamodb.Table {
    return this.reservationFlatTable;
  }

  public getServiceCatalogTable(): dynamodb.Table {
    return this.serviceCatalogTable;
  }

  public getWorkshopServiceFlatTable(): dynamodb.Table {
    return this.workshopServiceFlatTable;
  }

  public getCarBrandTable(): dynamodb.Table {
    return this.carBrandTable;
  }
}