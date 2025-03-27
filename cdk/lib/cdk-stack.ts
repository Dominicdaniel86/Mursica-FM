import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Create an EC2 instance in the VPC
    const instance = new ec2.Instance(this, 'SpotifyEC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
    });

    // Add security group to allow HTTP traffic
    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Allow HTTP traffic',
      securityGroupName: 'InstanceSecurityGroup',
    });

    // Add ingress rule to allow HTTP traffic
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    /// Attach the security group to the instance
    instance.addSecurityGroup(securityGroup);

    // Add a user data script to install and start a web server
    instance.addUserData(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<html><h1>Hello from EC2 instance</h1></html>" > /var/www/html/index.html',
    )
  }
}
