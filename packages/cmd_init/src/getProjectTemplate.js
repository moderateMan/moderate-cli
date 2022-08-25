"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@moderate-cli/utils");
function default_1() {
    return (0, utils_1.request)({
        url: "/cli/project/template",
    }).then((res) => {
        return res;
    });
}
exports.default = default_1;
