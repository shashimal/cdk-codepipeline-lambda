import {Stack} from "aws-cdk-lib";
import {CodeCommitSourceAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {IPipelineParams} from "../params/pipeline-params";
import {Artifact} from "aws-cdk-lib/aws-codepipeline";
import {IRepository, Repository} from "aws-cdk-lib/aws-codecommit";

export class SourceStage {

    private readonly repository: IRepository;
    private readonly sourceOutputArtifact: Artifact;
    private pipelineConfig: IPipelineParams;

    constructor(stack: Stack, pipelineConfig: IPipelineParams) {
        const appName = stack.node.tryGetContext('appName');
        this.pipelineConfig = pipelineConfig;
        this.repository = Repository.fromRepositoryName(stack, `${appName}-CodeCommitRepository`, this.pipelineConfig.sourceStage.repositoryName)
        this.sourceOutputArtifact = new Artifact();
    }

    public getCodeCommitSourceAction = (): CodeCommitSourceAction => {
        return new CodeCommitSourceAction({
            actionName: "Source",
            output: this.sourceOutputArtifact,
            repository: this.repository
        });
    }

    public getSourceOutputArtifact = (): Artifact => {
        return this.sourceOutputArtifact;
    }
}