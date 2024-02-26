const path = require("path");

module.exports = {
    entry: {
        "auth.js": "./src/auth.js",
        "sign-in.js": "./src/sign-in.js",
        "sign-out.js": "./src/sign-out.js",
        "sign-up.js": "./src/sign-up.js",
        "verify.js": "./src/verify.js",
    },
    output: {
        filename: "[name]",
        path: path.resolve(__dirname, "public/scripts"),
    },
};
