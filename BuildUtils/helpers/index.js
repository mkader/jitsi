#!/usr/bin/env node
"use strict";

const path = require("path");
const https = require("https");
const { spawn } = require("child_process");
const updateVersions = require("./updateVersions");

const sonarConfig = {
    url: process.env.SOLERA_SONARQUBE_URL,
    key: process.env.SOLERA_SONARQUBE_APIKEY,
    projectKey: process.env.SONAR_PROJECT_KEY,
    jUnitReportPath: process.env.JUNIT_REPORT_FILE_PATH,
};

const config = {
    libName: process.env.LIB_NAME,
    pkgDir: process.env.PKG_DIR,
    publishCmd: process.env.PUBLISH_CMD,
    webpackCfgName: process.env.WEBPACK_CONFIG_NAME,
    isLocal: process.env.IS_LOCAL,
    preBuild: process.env.PRE_BUILD,
    buildCmd: process.env.BUILD_CMD,
    testCmd: process.env.TEST_CMD,
    projectDir: process.env.PROJECT_DIR,
    jestCfg: process.env.JEST_CFG,
    debug: process.env.DEBUG,
    envConfig: process.env.ENV_CONFIG,
    mfeRegistryUrl: process.env.MFE_REGISTRY_URL,
    isMfe: process.env.IS_MFE,
};

function setupEnv({ envConfig }) {
    if (envConfig.trim().length > 0) {
        try {
            const config = JSON.parse(envConfig);

            for (const key in config) {
                process.env[key] = config[key];
            }
        } catch (err) {
            if (err instanceof SyntaxError) {
                console.error("[ARG_ENV_CONFIG ERROR] - please provide a proper JSON string");
                process.exit(1);
            }
        }
    }
}

async function makeQualityCheckWithPwshScript() {
    return startProcess("pwsh", [
        "-command",
        "& Solera.SonarQube\\Test-QualityGateStatus",
        "-soleraSonarqubeApikey",
        sonarConfig.key,
        "-analysisFile",
        "./.scannerwork/report-task.txt",
    ]);
}

async function checkQualityGate() {
    return makeQualityCheckWithPwshScript();
}

async function startProcess(name, args) {
    return new Promise((resolve, reject) => {
        const p = spawn(name, args);
        p.stdout.on("data", (data) => {
            console.log(`${data}`);
        });
        p.stderr.on("data", (data) => {
            console.log(`${data}`);
        });
        p.on("error", (error) => {
            reject(error);
        });
        p.on("close", (code) => {
            if (code === 0) {
                resolve(0);
            } else {
                reject(`\nFAILED on process: ${name}, with code: ${code}\n`);
            }
        });
    });
}

async function npx(args) {
    return startProcess(/^win/.test(process.platform) ? "npx.cmd" : "npx", args);
}

async function npm(args) {
    return startProcess("npm", args);
}

function parseArgs(rawArgs) {
    const args = rawArgs.slice(2);

    const argConfig = args.reduce((cfg, arg) => {
        const [name, cmd] = arg.split("=");

        cfg[name] = cmd;
        return cfg;
    }, {});

    return argConfig;
}

async function postToMfeRegistry() {
    return new Promise((resolve, reject) => {
        const pkgJsonPath = path.join(process.cwd(), "package.json");
        const pkgJson = require(pkgJsonPath);
        const data = {
            name: pkgJson.name,
            description: pkgJson.description || "No description found",
            tags: pkgJson.keywords || ["mfe"],
            version: pkgJson.version, // TODO: get this from sem.ver file
        };

        const jsonData = new TextEncoder().encode(JSON.stringify(data));
        const options = {
            host: config.mfeRegistryUrl,
            path: "/api/v2/mfe?publishing=true",
            method: "POST",
            port: 443,
            headers: {
                "Content-Type": "application/json",
                "Content-Length": jsonData.length,
            },
        };

        const req = https.request(options, (res) => {
            res.on("close", resolve);
        });

        req.on("error", reject);

        req.write(jsonData);
        req.end();
    });
}

module.exports = {
    npm,
    npx,
    updateVersions,
    checkQualityGate,
    sonarConfig,
    config,
    parseArgs,
    startProcess,
    setupEnv,
    postToMfeRegistry,
};
