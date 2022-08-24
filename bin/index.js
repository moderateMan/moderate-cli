#! /usr/bin/env node
// moderate-cli
let isDebug = process.argv.includes("-d")
if(!isDebug){
    require("@moderate-cli/core")
}else{
    require("../packages/core/dist")
}
