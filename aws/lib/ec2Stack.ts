import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

// Keep in mind that the user data script will still contain the original repository URL
// and branch name. You may want to update it in the script as well.

export class ec2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = this.node.tryGetContext('domainName');
    const gitBranch = this.node.tryGetContext('gitBranch') || 'main';
    const repositoryURL = this.node.tryGetContext('repositoryURL');
    const repositoryName = this.node.tryGetContext('repositoryName');

    if (domainName === undefined || domainName === null || domainName === '') {
      throw new Error('Domain name is not defined. Please provide a domain name in the context.');
    }

    if (gitBranch === undefined || gitBranch === null || gitBranch === '') {
      throw new Error('Git branch is not defined. Please provide a git branch in the context.');
    }

    if (repositoryName === undefined || repositoryName === null || repositoryName === '') {
      throw new Error('Repository name is not defined. Please provide a repository name in the context.');
    }

    console.log('Domain Name:', domainName); 


    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Route 53 hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName,
    });

    // Print out the hosted zone ID and name
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'The ID of the hosted zone',
    });

    new cdk.CfnOutput(this, 'HostedZoneName', {
      value: hostedZone.zoneName,
      description: 'The name of the hosted zone',
    });

    // Create IAM role for the EC2 instance
    const role = new iam.Role(this, 'InstanceIAMRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role to allow EC2 instance to access SSM parameters',
    });

    // Attach the "AmazonSSMManagedInstanceCore" policy to the role (allows SSM access)
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Create an EC2 instance in the VPC
    const instance = new ec2.Instance(this, 'MursicaEC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role
    });

    // Add security group to define inbound and outbound rules - used by EC2 instance and the ALB
    // TODO: Implement more granular security group for the EC2 instance
    const securityGroup = new ec2.SecurityGroup(this, 'EC2InstanceSG', {
      vpc,
      allowAllOutbound: true, // Allow all outbound traffic
      description: 'Security group for EC2 instance',
      securityGroupName: 'murscia-ec2-sg',
    });

    // Add ingress rule to allow HTTP traffic (kept extra for more granular control)
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH traffic');

    // Attach security group to the instance
    instance.addSecurityGroup(securityGroup);

    // Create an ALB
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'MursicaALB', {
      vpc,
      internetFacing: true, // Allow public access
      securityGroup,
      loadBalancerName: 'mursica-ec2-alb',
    });

    // Add a target group for the EC2 instance
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      // healthCheck: { // TODO: Implement health check
      //   path: '/',
      //   port: '80',
      //   protocol: elbv2.Protocol.HTTP,
      //   healthyHttpCodes: '200',
      // },
    });
    targetGroup.addTarget(new InstanceTarget(instance)); // Add the instance as a target

    // Certificate (using existing hostedZone)
    // Requires an existing certificate in ACM
    const certificate = new acm.Certificate(this, 'MursicaCertificate', {
      domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Create a listener for the load balacner
    // Redirect HTTP (80) to HTTPS (443)
    loadBalancer.addListener('HTTPRedirectListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // Create an HTTPS listener for the load balancer
    const httpsListener = loadBalancer.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup],
    });

    // Attach the target group to the listener
    // listener.addTargetGroups('DefaultTargetGroup', {
    //   targetGroups: [targetGroup],
    // });

    // Add an alias record to Route 53
    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: 'mursica.fm', // or leave blank for root
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(loadBalancer)),
    });

    // Add a user data script to install and start a web server
    instance.addUserData(
      'dnf update -y',
      'dnf install -y git',
      `git clone ${repositoryURL} /home/ec2-user/Mursica-FM`,
      `cd /home/ec2-user/${repositoryName} && git checkout ${gitBranch}`,
      `bash /home/ec2-user/Mursica-FM/scripts/ec2-setup.sh "${repositoryName}"`,
    );
  }
}
