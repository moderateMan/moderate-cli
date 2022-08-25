import { Command, Package } from "@moderate-cli/models";
interface TemplateT {
    id: string;
    installCommand: string;
    name: string;
    npmName: string;
    startCommand: string;
    tag: string[];
    type: string;
    version: string;
}
export declare class InitCommand extends Command {
    projectName: string;
    force: boolean;
    projectInfo: any;
    _cmd: any;
    templateInfo: any;
    template: TemplateT[] | null;
    templateNpm: Package | null;
    init(): void;
    exec(): Promise<void>;
    installTemplate(): Promise<void>;
    checkCommand(cmd: string): string | null;
    execCommand(command: string, errMsg: string): Promise<number>;
    installNormalTemplate(): Promise<void>;
    installCustomTemplate(): Promise<void>;
    downloadTemplate(): Promise<void>;
    prepare(): Promise<{
        [key: string]: any;
    } | undefined>;
    getProjectInfo(): Promise<{
        [key: string]: any;
    }>;
    isDirEmpty(localPath: string): boolean;
    createTemplateChoice(): {
        value: string;
        name: string;
    }[];
}
declare function init(argv: any): InitCommand;
export default init;
