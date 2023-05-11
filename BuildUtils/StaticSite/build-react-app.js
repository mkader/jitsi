#!/usr/bin/env node
'use strict';

const { npm, config, setupEnv } = require("../helpers");
const qualityGates = require("../helpers/qualityGates");

(async function () {
    try {
        setupEnv(config);

        console.log("we here in the react-app build!");
        await qualityGates(config, true);

        const buildCmd = config.buildCmd || "build";

        console.log("going to build react app");
        await npm(["run", buildCmd]);
        console.log("app was built!");

        // TODO: post build info to a service registry somewhere
    } catch (error) {
        console.error(`BUILD FAILED WITH ERROR : ${error}, NO ONE HAS SEEN THIS, JUST YOU.`);
        process.exit(1);
    }
})();
