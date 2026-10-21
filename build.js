const asc = require("assemblyscript/asc");
asc.main([
  "main.ts",
  "--baseDir", "assembly",
  "--binaryFile", "../out/main.wasm",
  "--importMemory",
  "--sourceMap",
  "--optimize",
  "--measure"
]);