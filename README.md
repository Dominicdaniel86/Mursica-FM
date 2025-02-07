# Spotify Session App

**Revolutionize your party with this third-party Spotify app, which makes listening to music as a group more seamless and interactive.** This app democratizes song selection, allowing participants to contribute their favorite tracks effortlessly. Only the host needs a Spotify account - everyone else can join freely to add some tracks! Its user-friendly interface keeps things simple, so you can focus on what really matters: the music. Best of all, it's free to use and accessible directly through your web browser. No installation required!

Please note that this app is currently it its conceptual phase. Your feedback is more than welcomed. You can reach out at my email address [Dominicdaniel3107@gmail.com](mailto:Dominicdaniel3107@gmail.com).
If you are a developer, feel encouraged to provide feedback or fork the project, adhering to the [GPL3.0 license](https://github.com/Dominicdaniel86/Spotify-Session-App?tab=GPL-3.0-1-ov-file).

## Overview

Topics to cover:

- More detailed description.
- How to use it.
- Architecture & components.
- User roles.

## Getting started

This application is currently in early development, and there is no simple way to install or use it without technical knowledge. If you're a developer or have experience with development tools, please follow the [Setup for Developers](#setup-for-developers) section to try it out.

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

**3. Start the application**

Run the following command to build and start the application:

```bash
docker compose up -d --build
```

**4. Access the application**

Once running, you can open the application in your browser at [http://127.0.0.1:80](http://127.0.0.1:80).

### Stopping the Application

To stop and remove the running containers, use:

```bash
docker compose down
```

## Project Roadmap

![Project Roadmap Picture](/media/roadmap.svg)

### Project Initialization

***Start Date: 04.02.2025, End Date: 05.02.2025***  
**Development Setup:**

- Establish project structure and core components
- Configure needed compilers and servers
- Set up backend and frontend foundation
- Containerize the application

### Minimum Viable Product

***Start Date: 05.02.2025***  
**Technical Aspects:**

- Integrate backend logging system
- Design essential frontend pages using Figma
- Set up documentation with comprehensive README
- Push Docker images to DockerHub repositories

**Features:**

- Implement Spotify Authentication
- Develop basic admin functionalities
- Introduce Song-Request functionality
- Implement frontend for mobile

### Operational Local Prototype

***Start Date: Open***  
**Technical Aspects:**

- Serve static HTML files for non-existing routes
- Optimize component configurations
- Strengthen failure-handling and robustness

**Features:**

- Implement base algorithm for playlist calculation
- Display generated playlists to the user
- Introduce a wishlist feature for the requested songs
- Develop user authentication service
- Expand admin functionalities and controls
- Implement frontend for desktop

### Product Cloud Deployment

***Start Date: Open***  
**Technical Aspects:**

- Deploy application to the cloud
- Enhance and expand project documentation
- Conduct extensive testing and implement more robustness measures

**Features:**

- Enable multi-session support
- Ensure high global accessibility
- Improve overall system resilience

### Platform Growth

***Start Date: Open***  
**Technical Aspects:**

- Implement Search Engine Optimization

**Features:**

- Provide application as a mobile app
- Expand list of playlist calculation algorithms
- Introduce customizable multi-color themes
- More features and customization
- ...

---

For more details, check the [issues page](https://github.com/Dominicdaniel86/Spotify-Session-App/issues) of this repository.
