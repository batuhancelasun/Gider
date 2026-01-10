# DockerHub GitHub Actions Setup

This guide will help you set up automatic Docker image builds and pushes to DockerHub whenever you push code to GitHub.

## Step 1: Create DockerHub Access Token

1. Go to [DockerHub](https://hub.docker.com/) and sign in
2. Click on your profile icon (top right) → **Account Settings**
3. Navigate to **Security** → **New Access Token**
4. Give it a name (e.g., "GitHub Actions")
5. Set permissions to **Read, Write, Delete** (or at least **Read & Write**)
6. Click **Generate**
7. **Copy the token immediately** - you won't be able to see it again!

## Step 2: Add Secret to GitHub

1. Go to your GitHub repository: https://github.com/batuhancelasun/Gider
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `DOCKERHUB_TOKEN`
6. Value: Paste your DockerHub access token
7. Click **Add secret**

## Step 3: Verify Setup

1. Make any small change to the repository (or just push again)
2. Go to the **Actions** tab in your GitHub repository
3. You should see a workflow run called "Build and Push Docker Image"
4. Once it completes successfully, your Docker image will be available at:
   - `batubaba619/expense-tracker:latest`
   - `batubaba619/expense-tracker:main` (branch-specific tag)

## How It Works

- **On every push to `main` branch**: The workflow automatically builds and pushes a new Docker image
- **Image tags**:
  - `latest` - Always points to the latest build from main branch
  - `main` - Branch-specific tag
  - `main-<commit-sha>` - Specific commit tag

## Testing the Image

After the workflow completes, you can test the image:

```bash
docker pull batubaba619/expense-tracker:latest
docker run -d -p 8080:8080 batubaba619/expense-tracker:latest
```

Or update your `docker-compose.yml` to use the image (already configured):

```bash
docker-compose pull
docker-compose up -d
```

## Troubleshooting

- **Workflow fails with "authentication required"**: Make sure the `DOCKERHUB_TOKEN` secret is set correctly
- **Workflow doesn't run**: Check that you're pushing to the `main` branch (or update the workflow to use `master`)
- **Image not found**: Wait a few minutes after the workflow completes for the image to be available

