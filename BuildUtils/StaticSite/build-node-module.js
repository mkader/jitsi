#!/usr/bin/env node
'use strict';

const { npm, updateVersions, config, setupEnv } = require("../helpers");
const qualityGates = require("../helpers/qualityGates");

(async function () {
    try {
        setupEnv(config);

        if (config.preBuild) {
            await npm(["run", config.preBuild]);
        }

        if (!config.publishCmd) {
            config.publishCmd = "publish";
        }

        if (!config.libName) {
            throw new Error("No lib name found. Please set LIB_NAME environment variable and retry the build");
        }

        if (!config.pkgDir) {
            throw new Error("No package directory found. Please set PKG_DIR environment variable and retry the build");
        }

        await qualityGates(config);

        // publish as npm package if flag is set
        console.log('starting npm publish');

        // update versions to sem.ver
        await updateVersions(config.libName, config.pkgDir);
        await npm(["run", config.publishCmd]);
        console.log(`${config.libName} was publish successfully`);

        // TODO: post build info to a service registry somewhere
    } catch (error) {
        console.error(`BUILD FAILED WITH ERROR : ${error}, NO ONE HAS SEEN THIS, JUST YOU.`);
        process.exit(1);
    }
})();
