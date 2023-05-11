To run an index.html file from a GitHub Codespaces, Right-click on the index.html, select "Open with Live Server" from the context menu. The index.html file should now open in a new tab in your web browser.

If you don't have Live Server installed, you can install it by: "npm install -g live-server". Then, Try with the"Open with ...".

If you have installed Live Server but don't see the "Open with ...". Close the Codespace, reopen, Try. 

OR you can manually start Live Server by a terminal: "live-server", This will start Live Server, You can navigate to the URL

Docker Issue

    Path Codespace\BuildUtils & build.ps1, check ls ./BuildUtils/StaticSite

    PowerShell
        install: sudo apt-get update && sudo apt-get install -y powershell
        run :  "pwsh"
        run script: ./build.ps1

    Docker
        Right click "Dockerfile" to build image
        Click "Docker" icon from the left side menu
        click images -> you can insepect, run, run interactice mode.
        type "env" to see all environment variable



