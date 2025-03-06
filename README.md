# Spotify Session App

**Revolutionize your party with this third-party Spotify app, which makes listening to music as a group more seamless and interactive.** This app democratizes song selection, allowing participants to contribute their favorite tracks effortlessly. Only the host needs a Spotify account - everyone else can join freely to add some tracks! Its user-friendly interface keeps things simple, so you can focus on what really matters: the music. Best of all, it's free to use and accessible directly through your web browser. No installation required!

Please note that this app is currently it its conceptual phase. Your feedback is more than welcomed. You can reach out at my email address [Dominicdaniel3107@gmail.com](mailto:Dominicdaniel3107@gmail.com).
If you are a developer, feel encouraged to provide feedback or fork the project, adhering to the [GPL3.0 license](https://github.com/Dominicdaniel86/Spotify-Session-App?tab=GPL-3.0-1-ov-file).

## Overview (To-Do!)

Topics to cover:

- More detailed description.
- How to use it.
- Architecture & components.
- User roles.

## Getting started

This application is currently in early development, and there is no simple way to install or use it without technical knowledge. If you're a developer or have experience with development tools, please refer to the following [Setup for Developers](#setup-for-developers) section to try it out.

## Setup for Developers

### Prerequisites

Before you begin, ensure you have the following tool installed on your system:

- [Git](https://youtube.com)
- [Node.js](https://youtube.com)
- [Docker](https://youtube.com)

### Installation Steps

**1. Clone the repository**

Open a command shell and run:

```bash
git clone https://github.com/Dominicdaniel86/Spotify-Session-App.git
```

**2. Switch to the appropriate branch**

Navigate to the cloned directory and checkout the correct branch if needed:

```bash
git checkout <branch-name>
```

**3. Create an official Spotify app**

Log into the [dashboard](https://developer.spotify.com/) using your Spotify account and create an app. You can find more information on [Spotifys Documentation](https://developer.spotify.com/documentation/web-api).

**4. Configure env variable file**

Configure the values "ENVIRONMENT", "CLIENT_ID" and "CLIENT_SECRET" in the /backend/.env file:

| Env Variable | Valid Values |
| --- | --- |
| ENVIRONMENT | 'production' or 'testing' (depending on the deployment) |
| CLIENT_ID | Can be found on your created [Spotify app](https://developer.spotify.com/) |
| CLIENT_SECRET | Can be found on your created [Spotify app](https://developer.spotify.com/) |

**5. Start the application**

**For Windows users:** Before starting the application, ensure that all `.sh` files use the LF (Line Feed) file ending. This guarantees compatibility in Linux-based environments, such as Docker containers, and prevents potential script execution issues.

Run the following command to build and start the application:

```bash
docker compose up -d --build
```

**6. Access the application**

Once running, you can open the application in your browser at [http://127.0.0.1:80](http://127.0.0.1:80).

### Stopping the Application

To stop and remove the running containers, use:

```bash
docker compose down
```

## Project Roadmap

<picture>
  <source srcset="/media/roadmap-dark.svg" media="(prefers-color-scheme: dark)">
  <img src="/media/roadmap-light.svg" alt="Project Roadmap Image">
</picture>

## UI Design Concept

[![Figma Design](/media/images/figma-logo.png)](https://www.figma.com/design/Vnn1y0fCs0i6Gv67nVtnGQ/Spotify-Session-App?node-id=0-1&t=x7rMBCipKQkkgSHH-1)

---

For more details, check the [issues page](https://github.com/Dominicdaniel86/Spotify-Session-App/issues) of this repository.
