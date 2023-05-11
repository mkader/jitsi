const {
    lstatSync,
    readdirSync,
    existsSync,
    readFileSync,
    writeFileSync
} = require('fs');
const { join } = require('path');

function isDirectory(source) {
    return lstatSync(source).isDirectory();
}

function getDirectories(source) {
    return readdirSync(source)
        .map(name => join(source, name))
        .filter(isDirectory);
}

/**
 * Gets and formats the semversion for the current build
 * 
 * @param {function} reject 
 */
function getSemVer(reject) {
    const p = join('.', 'sem.ver');

    if (existsSync(p)) {
        const semVerRaw = readFileSync(p, 'utf-8');
        const semVerJson = JSON.parse(semVerRaw);
        const semVer = Object.keys(semVerJson)
            .filter(k => k !== "Build")
            .reduce((ver, k) => {
                const val = semVerJson[k];
                ver += val;

                if (k !== "Patch" && k !== "Prerelease") {
                    ver += '.';
                } else if (k === "Patch") {
                    ver += "-";
                }

                return ver;
            }, '');

        return semVer;
    } else {
        reject('A sem.ver file not found in root directory... Please add a sem.ver file, and try again');
    }
}

/**
 * Update's the given directory's package.json version to the provided semver 
 * 
 * @param {string} semVer - the version of the build
 * @param {funciton} reject 
 */
function updateToSemVer(libName, semVer, reject) {
    return function (dir) {
        try {
            const pkgPath = join(dir, 'package.json');

            if (existsSync(pkgPath)) {
                const origPkg = require(pkgPath);
                const pkg = Object.assign({}, origPkg);

                pkg.version = semVer;

                checkDepVersions(libName, pkg.devDependencies, semVer);
                checkDepVersions(libName, pkg.dependencies, semVer);
                checkDepVersions(libName, pkg.peerDependencies, semVer);
                // TODO: maybe check the registry and update it as well...
                checkPublishRegistry(pkg.publishConfig);

                // write new pacakge.json with semver
                writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
            } else {
                // TODO: might want to reject if package.json not found
                console.warn(`No package.json found in ${dir}`);
            }
        } catch (e) {
            reject(e);
        }
    }
}

function checkPublishRegistry(pubConf) {
    if (pubConf) {
        // TODO: do the things
    }
}

/**
 * Updates all lib referenced components to the semver 
 * @param {string} libName 
 * @param {object} depJson - the deps json
 * @param {string} semVer
 */
function checkDepVersions(libName, depJson, semVer) {
    // if we're dependent of modules within lib
    // update version number to semVer as well
    if (libName && depJson) {
        console.log("checking dev deps");
        const deps = Object.keys(depJson);

        for (const dep of deps) {
            if (dep.includes(`@${libName}`) && depJson[dep] !== semVer) {
                console.log(`updating ${dep}'s version from ${depJson[dep]}, to ${semVer}`);
                depJson[dep] = `${semVer}`;
            }
        }
    }
}

/**
 * Gets the dirs and updates the package.json version to be the sem.ver 
 * 
 * @param {string} semVer - the version of the build
 * @param {function} reject
 */
function getDirsAndUpdateVersions(libName, semVer, reject) {
    return function (libPath) {
        console.log("running in path", libPath);

        const dirPath = join(process.cwd(), libPath);
        const dirs = getDirectories(dirPath);

        if (dirs.length && !existsSync(join(dirPath, "package.json"))) {
            dirs.forEach(updateToSemVer(libName, semVer, reject));
        } else {
            updateToSemVer(libName, semVer, reject)(dirPath);
        }
    }
}

/**
 * Prefunction to update the versions
 * 
 * @param {string} libPath - the path of the library
 */
function updateVersions(libName, libPath) {
    return new Promise((resolve, reject) => {
        const semVer = getSemVer(reject);
        console.log("GOT A SEMVER -------", semVer);

        if (libPath.includes(",")) {
            libPath.split(",")
                .forEach(getDirsAndUpdateVersions(libName, semVer, reject));
        } else {
            getDirsAndUpdateVersions(libName, semVer, reject)(libPath);
        }

        resolve();
    });
}

module.exports = updateVersions;
