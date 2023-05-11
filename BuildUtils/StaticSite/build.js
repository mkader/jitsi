#!/usr/bin/env node
"use strict";

const { npx, config, setupEnv, postToMfeRegistry, npm } = require("../helpers");
const qualityGates = require("../helpers/qualityGates");

(async function () {
    try {
        setupEnv(config);

        await qualityGates(config);

        const webpackCfg = [];

        if (!!config.webpackCfgName) {
            webpackCfg.push("--config");
            webpackCfg.push(config.webpackCfgName);
        }

        //5: WEBPACK AND SHIP IT TO /dist
        console.log("starting packing with webpack");
        if (!config.buildCmd) {
            await npx(["webpack", ...webpackCfg, "--mode", "production"]);
        } else {
            await npm(["run", config.buildCmd]);
        }
        console.log("packing with webpack completed sucessfully!");

        if (config.isMfe === "true") {
            console.log("about to post mfe to registry");
            await postToMfeRegistry();
            console.log("mfe posted successfully");
        }

        console.log("BUILD COMPLETED SUCCESSFULLY, SHIP IT!");
    } catch (error) {
        console.error(`BUILD FAILED WITH ERROR : ${error}, NO ONE HAS SEEN THIS, JUST YOU.`);
        process.exit(1);
    }
})();
