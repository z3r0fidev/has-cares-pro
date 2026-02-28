# Staging Environment Setup

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `STAGING_HOST` | Hostname or IP of the staging server |
| `STAGING_USER` | SSH username (e.g. `deploy`) |
| `STAGING_SSH_KEY` | Private SSH key for the deploy user |
| `STAGING_PATH` | Absolute path on server (default: `/opt/careequity-staging`) |

## GitHub Environment

Create a `staging` environment in GitHub repository Settings -> Environments.
Add the secrets above to that environment.

## Server Setup

```bash
# On the staging server
sudo mkdir -p /opt/careequity-staging
sudo chown deploy:deploy /opt/careequity-staging
cd /opt/careequity-staging
git clone https://github.com/z3r0fidev/has-cares-pro .
cp .env.staging.example .env.staging
# Edit .env.staging with real values
docker compose -f docker-compose.staging.yml up -d
```

## Manual deploy

```bash
git push origin main  # triggers auto-deploy
# or manually:
gh workflow run deploy-staging.yml
```
