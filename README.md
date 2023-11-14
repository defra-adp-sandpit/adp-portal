# adp-portal
The Azure Development Platform Portal built using [Backstage](https://backstage.io/).

## Getting started

### Prerequisites

* Access to a UNIX based operating system. If on Windows it is recommended that you use [WSL](https://learn.microsoft.com/en-us/windows/wsl/)
* A GNU-like build environment available at the command line. For example, on Debian/Ubuntu you will want to have the `make` and `build-essential` packages installed
* `curl` or `wget` installed
* [Node.js 18](https://nodejs.org/download/release/v18.18.2/) - using NVM is recommended.
* [Yarn](https://classic.yarnpkg.com/en/docs/install#windows-stable)
* [Docker](https://docs.docker.com/engine/install/)
* [Git](https://github.com/git-guides/install-git)

See the [Backstage Getting Started documentation](https://backstage.io/docs/getting-started/#prerequisites) for the full list of prerequisites.

### Integrations
Backstage integrates with GitHub to import and create repository data, and Azure AD for authentication. To get these integrations working locally, you will need to create a GitHub app and an App Registration in Azure AD. The client IDs, secrets, etc are stored in environment variables. To set these, duplicate the env.example.sh file in the root of the repo, rename it to env.sh, update the values, then load the environment variables in to your terminal session using `. ./env.sh`.

The GitHub integration also requires a private key. Generate and copy this from your GitHub app to the path specified in [github-app-configuration.yaml](app/github-app-configuration.yaml).

### Running locally
Run the following commands from the `/app` directory:

```sh
yarn install
yarn dev
```