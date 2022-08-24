#! /usr/bin/env node
// moderate-cli
let isDebug = process.argv.includes("-d")
const pkg = require("../package.json")
if (!isDebug) {
    require("@moderate-cli/core").default(pkg)
} else {
    require("../packages/core/dist").default(pkg)
}
