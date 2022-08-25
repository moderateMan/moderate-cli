"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitCommand = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const user_home_1 = __importDefault(require("user-home"));
const models_1 = require("@moderate-cli/models");
const utils_1 = require("@moderate-cli/utils");
const getProjectTemplate_1 = __importDefault(require("./getProjectTemplate"));
const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";
const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";
const WHITE_COMMAND = ["npm", "cnpm"];
class InitCommand extends models_1.Command {
    constructor() {
        super(...arguments);
        this.projectName = "";
        this.force = false;
        this.projectInfo = {};
        this._cmd = null;
        this.templateInfo = null;
        this.template = null;
        this.templateNpm = null;
    }
    init() {
        this.projectName = this._argv[0] || "";
        this.force = !!this._cmd.force;
        utils_1.log.verbose("projectName", this.projectName);
        utils_1.log.verbose("force", this.force + "");
    }
    async exec() {
        try {
            // 1. 准备阶段
            const projectInfo = await this.prepare();
            if (projectInfo) {
                // 2. 下载模板
                utils_1.log.verbose("projectInfo", JSON.stringify(projectInfo));
                this.projectInfo = projectInfo;
                await this.downloadTemplate();
                // 3. 安装模板
                await this.installTemplate();
            }
        }
        catch (e) {
            utils_1.log.error("error", e.message);
            if (process.env.LOG_LEVEL === "verbose") {
                console.log(e);
            }
        }
    }
    async installTemplate() {
        utils_1.log.verbose("templateInfo", this.templateInfo);
        if (this.templateInfo) {
            if (!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
            }
            if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                // 标准安装
                await this.installNormalTemplate();
            }
            else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                // 自定义安装
                await this.installCustomTemplate();
            }
            else {
                throw new Error("无法识别项目模板类型！");
            }
        }
        else {
            throw new Error("项目模板信息不存在！");
        }
    }
    checkCommand(cmd) {
        if (WHITE_COMMAND.includes(cmd)) {
            return cmd;
        }
        return null;
    }
    async execCommand(command, errMsg) {
        let ret;
        if (command) {
            const cmdArray = command.split(" ");
            const cmd = this.checkCommand(cmdArray[0]);
            if (!cmd) {
                throw new Error("命令不存在！命令：" + command);
            }
            const args = cmdArray.slice(1);
            ret = await (0, utils_1.execAsync)(cmd, args, {
                stdio: "inherit",
                cwd: process.env.CLI_PROJECT_NAME,
            });
        }
        if (ret !== 0) {
            throw new Error(errMsg);
        }
        return ret;
    }
    async installNormalTemplate() {
        utils_1.log.verbose("templateNpm", JSON.stringify(this.templateNpm));
        // 拷贝模板代码至当前目录
        let spinner = (0, utils_1.spinnerStart)("正在安装模板...");
        await (0, utils_1.sleep)();
        try {
            const templatePath = path_1.default.resolve(this.templateNpm.cacheFilePath, "template");
            const targetPath = process.env.CLI_PROJECT_NAME;
            fs_extra_1.default.ensureDirSync(templatePath);
            fs_extra_1.default.ensureDirSync(targetPath);
            fs_extra_1.default.copySync(templatePath, targetPath);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            spinner.stop(true);
            utils_1.log.success("模板安装成功");
        }
        const { installCommand, startCommand } = this.templateInfo;
        // 依赖安装
        await this.execCommand(installCommand, "依赖安装失败！");
        // // 启动命令执行
        await this.execCommand(startCommand, "启动执行命令失败！");
    }
    async installCustomTemplate() {
        // 查询自定义模板的入口文件
        if (await this.templateNpm.exists()) {
            let rootFile = this.templateNpm.getRootFilePath();
            if (fs_1.default.existsSync(rootFile)) {
                utils_1.log.notice("info", "开始执行自定义模板");
                const templatePath = path_1.default.resolve(this.templateNpm.cacheFilePath, "template");
                const options = {
                    templateInfo: this.templateInfo,
                    projectInfo: this.projectInfo,
                    sourcePath: templatePath,
                    targetPath: process.cwd(),
                };
                if (process.env.CLI_DEBUG) {
                    rootFile =
                        "/Users/johnlee/workSpace/frontEnd/cli/template/moderate-admin";
                }
                const code = `require('${rootFile}')(${JSON.stringify(options)})`;
                utils_1.log.verbose("code", code);
                await (0, utils_1.execAsync)("node", ["-e", code], {
                    stdio: "inherit",
                    cwd: process.cwd(),
                });
                utils_1.log.success("自定义模板安装成功");
            }
            else {
                throw new Error("自定义模板入口文件不存在！");
            }
        }
    }
    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find((item) => item.npmName === projectTemplate);
        const targetPath = path_1.default.resolve(user_home_1.default, ".moderate-cli", "template");
        const storeDir = path_1.default.resolve(user_home_1.default, ".moderate-cli", "template", "node_modules");
        const { npmName, version } = templateInfo;
        this.templateInfo = templateInfo;
        const templateNpm = new models_1.Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version,
        });
        if (!(await templateNpm.exists())) {
            const spinner = (0, utils_1.spinnerStart)("正在下载模板...");
            await (0, utils_1.sleep)();
            try {
                await templateNpm.install();
            }
            catch (e) {
                throw e;
            }
            finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    utils_1.log.success("下载模板成功");
                    this.templateNpm = templateNpm;
                }
            }
        }
        else {
            const spinner = (0, utils_1.spinnerStart)("正在更新模板...");
            await (0, utils_1.sleep)();
            try {
                await templateNpm.update();
            }
            catch (e) {
                throw e;
            }
            finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    utils_1.log.success("更新模板成功");
                    this.templateNpm = templateNpm;
                }
            }
        }
    }
    async prepare() {
        // 0. 判断项目模板是否存在
        const template = await (0, getProjectTemplate_1.default)();
        const { data: { list }, } = template;
        if (!list || list.length === 0) {
            throw new Error("项目模板不存在");
        }
        this.template = list;
        // 1. 判断当前目录是否为空
        const localPath = process.env.CLI_PROJECT_NAME;
        console.log(localPath);
        if (!this.isDirEmpty(localPath)) {
            let ifContinue = false;
            if (!this.force) {
                // 询问是否继续创建
                ifContinue = (await inquirer_1.default.prompt({
                    type: "confirm",
                    name: "ifContinue",
                    default: false,
                    message: "当前文件夹不为空，是否继续创建项目？",
                })).ifContinue;
                if (!ifContinue) {
                    return;
                }
            }
            // 2. 是否启动强制更新
            if (ifContinue || this.force) {
                // 给用户做二次确认
                const { confirmDelete } = await inquirer_1.default.prompt({
                    type: "confirm",
                    name: "confirmDelete",
                    default: false,
                    message: "是否确认清空当前目录下的文件？",
                });
                if (confirmDelete) {
                    // 清空当前目录
                    fs_extra_1.default.emptyDirSync(localPath);
                }
            }
        }
        return this.getProjectInfo();
    }
    async getProjectInfo() {
        function isValidName(v) {
            return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
        }
        let projectInfo = {
            projectName: ""
        };
        let isProjectNameValid = false;
        if (isValidName(this.projectName)) {
            isProjectNameValid = true;
            projectInfo.projectName = this.projectName;
        }
        // 1. 选择创建项目或组件
        const { type } = await inquirer_1.default.prompt({
            type: "list",
            name: "type",
            message: "moderate-cli:选择创建的类型",
            default: TYPE_PROJECT,
            choices: [
                {
                    name: "项目",
                    value: TYPE_PROJECT,
                },
            ],
        });
        utils_1.log.verbose("type", type);
        this.template = this.template.filter((template) => template.tag.includes(type));
        const title = type === TYPE_PROJECT ? "项目" : "组件";
        const projectNamePrompt = {
            type: "input",
            name: "projectName",
            message: `moderate-cli:输入${title}名称`,
            default: "",
            validate: function (v) {
                const done = this.async();
                setTimeout(function () {
                    // 1.首字符必须为英文字符
                    // 2.尾字符必须为英文或数字，不能为字符
                    // 3.字符仅允许"-_"
                    if (!isValidName(v)) {
                        done(`请输入合法的${title}名称`);
                        return;
                    }
                    done(null, true);
                }, 0);
            },
            filter: function (v) {
                return v;
            },
        };
        const projectPrompt = [];
        if (!isProjectNameValid) {
            projectPrompt.push(projectNamePrompt);
        }
        projectPrompt.push({
            type: "input",
            name: "projectVersion",
            message: `moderate-cli:确定${title}版本号`,
            default: "1.0.0",
            validate: function (v) {
                const done = this.async();
                setTimeout(function () {
                    if (!!!semver_1.default.valid(v)) {
                        done("请输入合法的版本号");
                        return;
                    }
                    done(null, true);
                }, 0);
            },
            filter: function (v) {
                if (!!semver_1.default.valid(v)) {
                    return semver_1.default.valid(v);
                }
                else {
                    return v;
                }
            },
        }, {
            type: "list",
            name: "projectTemplate",
            message: `moderate-cli:选择${title}模板`,
            choices: this.createTemplateChoice(),
        });
        if (type === TYPE_PROJECT) {
            // 2. 获取项目的基本信息
            const project = await inquirer_1.default.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...project,
            };
        }
        else if (type === TYPE_COMPONENT) {
            const descriptionPrompt = {
                type: "input",
                name: "componentDescription",
                message: "请输入组件描述信息",
                default: "",
                validate: function (v) {
                    const done = this.async();
                    setTimeout(function () {
                        if (!v) {
                            done("请输入组件描述信息");
                            return;
                        }
                        done(null, true);
                    }, 0);
                },
            };
            projectPrompt.push(descriptionPrompt);
            // 2. 获取组件的基本信息
            const component = await inquirer_1.default.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...component,
            };
        }
        // 生成classname
        if (projectInfo.projectName) {
            projectInfo.name = projectInfo.projectName;
            projectInfo.className = require("kebab-case")(projectInfo.projectName).replace(/^-/, "");
        }
        if (projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion;
        }
        if (projectInfo.componentDescription) {
            projectInfo.description = projectInfo.componentDescription;
        }
        return projectInfo;
    }
    isDirEmpty(localPath) {
        if (fs_1.default.existsSync(localPath)) {
            let fileList = fs_1.default.readdirSync(localPath);
            // 文件过滤的逻辑
            fileList = fileList.filter((file) => !file.startsWith(".") && ["node_modules"].indexOf(file) < 0);
            return !fileList || fileList.length <= 0;
        }
        else {
            fs_extra_1.default.mkdirpSync(localPath);
            return true;
        }
    }
    createTemplateChoice() {
        return this.template.map((item) => ({
            value: item.npmName,
            name: item.name,
        }));
    }
}
exports.InitCommand = InitCommand;
function init(argv) {
    return new InitCommand(argv);
}
exports.default = init;
