# FROM alpine:3.11 as build
FROM mcr.microsoft.com/powershell:alpine-3.15 as build

WORKDIR /src

# Copy BuildUtils scripts
COPY ./BuildUtils/StaticSite /buildutils
COPY ./BuildUtils/helpers /helpers

# Copy SonarCube modules
COPY ./Downloads/SonarScanner/sonar-scanner-cli*.zip ./

# # Copy Powershell modules
COPY ./Downloads/PowershellModules /usr/local/share/powershell/Modules

# Add node_modules/.bin to path environment variable
ENV PATH="/src/node_modules/.bin:/opt/sonar-scanner/bin:/usr/lib/jvm/java-1.17-openjdk/jre/bin:/usr/lib/jvm/java-1.17-openjdk/bin:${PATH}" \
    JAVA_HOME=/usr/lib/jvm/java-1.17-openjdk \
    SONAR_RUNNER_HOME=/opt/sonar-scanner