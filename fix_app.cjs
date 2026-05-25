const fs = require("fs");
let c = JSON.parse(fs.readFileSync("app.json", "utf8"));
c.expo.plugins = (c.expo.plugins || []).filter(p => !String(p).includes("barcode-scanner"));
fs.writeFileSync("app.json", JSON.stringify(c, null, 2));
console.log("OK");
