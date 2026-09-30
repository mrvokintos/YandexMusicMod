$repo = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
docker build -t ymliberty-linux-builder -f (Join-Path $PSScriptRoot "Dockerfile") $repo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker run --rm -v "${repo}:/workspace" ymliberty-linux-builder
exit $LASTEXITCODE
