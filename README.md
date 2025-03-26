# Spotify Session App

**Revolutionize your party with this third-party Spotify app, which makes listening to music as a group more seamless and interactive.** This app democratizes song selection, allowing participants to contribute their favorite tracks effortlessly. Only the host needs a Spotify account - everyone else can join freely to add some tracks! Its user-friendly interface keeps things simple, so you can focus on what really matters: the music. Best of all, it's free to use and accessible directly through your web browser. No installation required!

Please note that this app is currently in its conceptual phase. Your feedback is more than welcome. You can reach out to me at my email address [Dominicdaniel3107@gmail.com](mailto:Dominicdaniel3107@gmail.com).
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

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)

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

**4. Configure backend env variable file**

You will find an `.example.env` file in the `/backend` directory. You need to create a new `.env` file or rename the `.example.env` file to `.env`. Configure the values "ENVIRONMENT", "CLIENT_ID" and "CLIENT_SECRET" in the `/backend/.env` file:

| Env Variable  | Description | Valid Values |
| ------------- | ----------- | ------------ |
| ENVIRONMENT   | Environment type | 'production' or 'testing' (depending on the deployment) |
| CLIENT_ID     | Spotify Client ID | Can be found on your created [Spotify app](https://developer.spotify.com/) |
| CLIENT_SECRET | Spotify Client Secret | Can be found on your created [Spotify app](https://developer.spotify.com/) |

**5. Configure database env variable file**

You will find an `.example.env` file in the `/database` directory. You need to create a new `.env` file or rename the `.example.env` file to `.env`. Configure the database environment variables in the `/database/.env` file:

| Env Variable     | Description | Example Value |
| ---------------- | ----------- | ------------- |
| POSTGRES_USER    | Database user | spotify_session_user |
| POSTGRES_PASSWORD| Database password | password |
| POSTGRES_DB      | Database name | spotify_session_database |

**6. Start the application**

**For Windows users:** Before starting the application, ensure that all `.sh` files use the LF (Line Feed) file ending. This guarantees compatibility in Linux-based environments, such as Docker containers, and prevents potential script execution issues.

Run the following command to build and start the application:

```bash
docker compose up -d --build
```

**7. Migrate the database and compile the frontend**

Before accessing the application, you need to migrate the Prisma data to the database. Run the following commands:

```bash
cd ./backend
npm run prisma:migrate
```

Next, compile the JavaScript code for the frontend:

```bash
cd ./frontend
npm run build
```

**8. Access the application**

Once running, you can open the application in your browser at [http://127.0.0.1:80](http://127.0.0.1:80).

### Stopping the Application

To stop and remove the running containers, use:

```bash
docker compose down
```

### Additional Step: Install npm packages

Not needed for starting the application, but useful for development and auto-completion.

Navigate to both the `/backend` and `/frontend` folders to execute `npm install`. Tools like *VS Code* can use the created `node_modules` directories to verify the installation of needed dependencies during development.

### Setup for Efficient Development

Developing new features can become tedious if you need to restart the container frequently. To enhance the development experience, this project includes several mechanisms:

1. **Auto-restart Backend on Save**: To automatically restart your backend on every save, run `npm run dev` in your `backend` directory. Ensure the backend container has the environment variable `ENVIRONMENT` set to `development`.

2. **Apply Prisma Migrations**: To apply new migrations from the Prisma schema to the database, run `npm run prisma:migrate` in your `backend` directory.

3. **Auto-compile TypeScript**: To automatically compile your TypeScript into JavaScript on every save, run `npm run start` in the `frontend` directory.

Keep in mind that each of these steps requires running containers. Additionally, steps 1 and 3 will need separate terminal instances.

## Project Roadmap

<picture>
  <source srcset="/media/roadmap-dark.svg" media="(prefers-color-scheme: dark)">
  <img src="/media/roadmap-light.svg" alt="Project Roadmap Image">
</picture>

## UI Design Concept

[![Figma Design](/media/images/figma-logo.png)](https://www.figma.com/design/Vnn1y0fCs0i6Gv67nVtnGQ/Spotify-Session-App?node-id=0-1&t=x7rMBCipKQkkgSHH-1)

---

For more details, check the [issues page](https://github.com/Dominicdaniel86/Spotify-Session-App/issues) of this repository.
