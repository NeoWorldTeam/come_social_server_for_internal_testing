const fp = require("fs-props");

fp.props("/Users/fuhao/Downloads/26.mp4").then((properties) => {
  console.log(properties);
});