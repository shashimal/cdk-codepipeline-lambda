import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {SourceStage} from "./stages/source-stage";
import {PipelineConfig} from "../config/pipeline-config";
import {BuildStage} from "./stages/build-stage";
import {DeployStage} from "./stages/deploy-stage";

export class CdkCodepipelineLambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        const appName = this.node.tryGetContext('appName');
        const pipelineConfig = PipelineConfig;

        const codepipeline = new Pipeline(this, appName, {});

        //Source Stage
        const sourceStage = new SourceStage(this, pipelineConfig);
        codepipeline.addStage({
            stageName: "Source",
            actions: [sourceStage.getCodeCommitSourceAction()],
        });

        //Build Stage
        const buildStage = new BuildStage(this, pipelineConfig);
        codepipeline.addStage({
            stageName: "Build",
            actions: [buildStage.getCodeBuildAction(sourceStage.getSourceOutputArtifact())]
        });

        //Deploy Stage
        const deployStage = new DeployStage(this, pipelineConfig);
        codepipeline.addStage({
            stageName: "Deploy",
            actions: [
                deployStage.getCloudFormationCreateReplaceChangeSetAction(buildStage.getBuildOutputArtifact()),
                deployStage.getCloudFormationExecuteChangeSetAction()
            ]
        });

        deployStage.setPermissionPoliciesForCloudFormationRole();

    }
}
