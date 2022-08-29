import log  from "npmlog";


log.level == process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info";
log.heading = "moderate-cli";
log.headingStyle = { bg: "blue" };
log.addLevel("success", 2000, { fg: "green", bold: true });

export default log;


// https://docs.npmjs.com/cli/v8/using-npm/config/#:~:text=7%20and%20higher.-,loglevel,Type%3A%20%22silent%22%2C%20%22error%22%2C%20%22warn%22%2C%20%22notice%22%2C%20%22http%22%2C%20%22timing%22%2C%20%22info%22%2C%20%22verbose%22%2C%20or%20%22silly%22,-What%20level%20of