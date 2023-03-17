// const fp = require("fs-props");

// fp.props("/Users/fuhao/Downloads/26.mp4").then((properties) => {
//   console.log(properties);
// });


import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    organization: "org-HWx5sWVTJr8iELC3DrSJnCHf",
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const response = await openai.listEngines();
console.log(response.data);