const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../cpp_engine/input.txt");
const outputPath = path.join(__dirname, "../cpp_engine/output.txt");

// Write input for C++
const writeInput = (data) => {
  fs.writeFileSync(inputPath, data);
};

// Read output from C++
const readOutput = () => {
  return fs.readFileSync(outputPath, "utf-8");
};

module.exports = {
  writeInput,
  readOutput
};