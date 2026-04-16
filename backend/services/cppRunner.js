const { exec } = require("child_process");
const path = require("path");

const runCpp = () => {
  return new Promise((resolve, reject) => {
    const exePath = path.join(__dirname, "../cpp_engine/engine");
    const cppDir = path.join(__dirname, "../cpp_engine");

    exec(`"${exePath}"`, { cwd: cppDir }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
};

module.exports = { runCpp };