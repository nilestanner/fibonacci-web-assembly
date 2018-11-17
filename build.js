const asc = require("assemblyscript/bin/asc");
asc.main([
  "main.ts",
  "--baseDir", "assembly",
  "--binaryFile", "../out/main.wasm",
  "--importMemory",
  "--sourceMap",
  "--optimize",
  "--measure"
]);