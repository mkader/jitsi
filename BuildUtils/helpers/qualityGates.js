#!/usr/bin/env node
'use strict';

const { npx, npm, sonarConfig, checkQualityGate, startProcess } = require('./');

/**
 * Perform quality checks (linting, test coverage, and analysis).
 * Will stop build if any fail.
 *
 * @param {{
 *  isLocal: boolean;
 *  projectDir?: string;
 *  jestCfg?: string;
 *  testCmd?: string;
 * }} config - configuration for the quality checks
 * @param {boolean} isCRA - boolean value stating if the application is built off create-react-app
 */
async function qualityGates({ isLocal, projectDir, jestCfg, testCmd }, isCRA) {
    console.log('Starting linting with eslint ...');
    await npx(['eslint', '--ext', '.js', '--ext', '.jsx', '--ext', '.ts', '--ext', '.tsx', projectDir]);
    console.log('linting completed sucessfully!');

    // 2 : UNIT TEST
    console.log('Starting unit testing with jest ...');
    if (!isCRA) {
        await npx(['jest', '--coverage', jestCfg]);
    } else {
        await npm(['run', testCmd]);
    }
    console.log('unit testing completed sucessfully!');

    if (isLocal === "false") {
        //3: RUN SONAR QUBE ANALYSIS
        console.log('starting sonarqube scanning');
        await startProcess(/^win/.test(process.platform) ? 'sonar-scanner.bat' : 'sonar-scanner', [
            `-Dsonar.host.url=${sonarConfig.url}`,
            `-Dsonar.login=${sonarConfig.key}`,
            `-Dsonar.projectKey=${sonarConfig.projectKey}`,
            `-Dsonar.sources=${projectDir}`,
            `-Dsonar.junit.reportPaths=${sonarConfig.jUnitReportPath}`,
            '-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info',
            '-Dsonar.projectVersion=1.0.0',
            '-Dsonar.exclusions=**/*.spec.jsx,**/*.spec.js,**/*.test.js,**/*.test.jsx,**/*.spec.ts,**/*.spec.tsx,**/*.test.ts,**/*.test.tsx,**/*.css,**/*.scss',
            '-Dsonar.sourceEncoding=UTF-8'
        ]);

        //4: CHECK SONAR QUALITY GATE
        await checkQualityGate(`${sonarConfig.url}/api/qualitygates/project_status?projectKey=${sonarConfig.projectKey}`);
        console.log('sonarqube scanning completed sucessfully!');
    }
}

module.exports = qualityGates;
