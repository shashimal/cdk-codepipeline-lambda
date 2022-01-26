import {CfnCapabilities, Stack} from "aws-cdk-lib";
import {IPipelineParams} from "../params/pipeline-params";
import {Artifact} from "aws-cdk-lib/aws-codepipeline";
import {
    CloudFormationCreateReplaceChangeSetAction,
    CloudFormationExecuteChangeSetAction
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
    Effect,
    ManagedPolicy, Policy,
    PolicyStatement
} from "aws-cdk-lib/aws-iam";

export class DeployStage {
    private readonly stack: Stack
    private pipelineConfig: IPipelineParams;
    private readonly cloudformationStackName: string;
    private readonly changeSetName:string;
    private cloudFormationCreateReplaceChangeSetAction:  CloudFormationCreateReplaceChangeSetAction;

    constructor(stack: Stack,pipelineConfig: IPipelineParams) {
        this.stack=stack;
        this.pipelineConfig = pipelineConfig;
        this.cloudformationStackName = 'Codepipeline-Lambda-Stack';
        this.changeSetName = 'StagedChangeSet';
    }

    public getCloudFormationCreateReplaceChangeSetAction = (buildOutputArtifact: Artifact): CloudFormationCreateReplaceChangeSetAction => {
        this.cloudFormationCreateReplaceChangeSetAction = new CloudFormationCreateReplaceChangeSetAction({
            actionName: "PrepareChanges",
            adminPermissions: false,
            changeSetName: this.changeSetName,
            stackName: this.cloudformationStackName,
            templatePath: buildOutputArtifact.atPath("outputtemplate.yml"),
            cfnCapabilities: [
                CfnCapabilities.NAMED_IAM,
                CfnCapabilities.AUTO_EXPAND
            ],
            runOrder: 1
        });
        return this.cloudFormationCreateReplaceChangeSetAction;
    }

    public getCloudFormationExecuteChangeSetAction = ():  CloudFormationExecuteChangeSetAction => {
        return new CloudFormationExecuteChangeSetAction({
            actionName: "ExecuteChanges",
            changeSetName:this.changeSetName,
            stackName: this.cloudformationStackName,
            runOrder: 2
        })
    }

    public setPermissionPoliciesForCloudFormationRole = () => {
        this.cloudFormationCreateReplaceChangeSetAction.deploymentRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaExecute'));
        this.cloudFormationCreateReplaceChangeSetAction.deploymentRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEventBridgeFullAccess'));

        this.cloudFormationCreateReplaceChangeSetAction.deploymentRole.attachInlinePolicy(
            new Policy(this.stack, 'CodePipelineLambdaDeployPermissionPolicy',{
                statements:[
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [
                            "apigateway:*",
                            "codedeploy:*",
                            "lambda:*",
                            "cloudformation:CreateChangeSet",
                            "iam:GetRole",
                            "iam:CreateRole",
                            "iam:DeleteRole",
                            "iam:PutRolePolicy",
                            "iam:AttachRolePolicy",
                            "iam:DeleteRolePolicy",
                            "iam:DetachRolePolicy",
                            "iam:PassRole",
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:GetBucketVersioning"
                        ],
                        resources: ['*']
                    })
                ]
            })
        );
    }
}