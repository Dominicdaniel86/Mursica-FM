# TO-DOs

Small tasks, ideas, and notes that don't warannt full GitHub issues.

---

### Backend Improvement

#### Basics

- [X] /src/server.ts
  - [X] initialization
  - [X] /api
- [X] /src/logger
  - [X] logger.ts
- [X] src/config.ts
- [X] .env
- [X] wait-for-it.sh

#### Authentication

- [ ] /src/server.ts
  - [ ] /api/auth/spotify
  - [ ] /api/auth/spotify/login
  - [ ] /api/auth/spotify/callback
  - [ ] /api/auth/spotify/logout
- [ ] /src/utility
  - [ ] fileUtils.ts
- [ ] Prisma DB
- [ ] /src/api
  - [ ] /src/api/auth
    - [ ] clientCredentials.ts
    - [ ] logout.ts
    - [ ] OAuth.ts
  - [ ] index.ts
- [ ] /src/errors
  - [ ] database.ts
  - [ ] index.ts
- [ ] /src/interfaces
  - [ ] index.ts
  - [ ] spotifyPlayer.ts

#### Track Selection

- [ ] /src/server.ts
  - [ ] /api/tracks/search
  - [ ] /api/tracks/select
- [ ] Prisma DB
- [ ] /src/api
  - [ ] index.ts
  - [ ] trackInfo.ts
- [ ] /src/interfaces
  - [ ] index.ts
  - [ ] spotifyTracks.ts

#### Admin Controls

- [ ] /src/server.ts
  - [ ] /api/admin/control/play
  - [ ] /api/admin/control/stop
  - [ ] /adi/admin/control/skip
  - [ ] /api/admin/control/volume GET
  - [ ] /api/admin/control/volume PUT
  - [ ] /api/admin DEPRECATED
- [ ] /src/api
  - [ ] adminControl.ts
  - [ ] index.ts
- [ ] /src/interfaces
  - [ ] index.ts
  - [ ] spotifyTokens.ts

#### Structure Only

- [X] /src/auth
  - [X] auth.ts
- [X] /src/services
  - [X] algorithm.ts
- [X] /src/tests
  - [X] test.ts

### Frontend Improvement

- [ ] ...

### 🧹 Project Cleanup

- [ ] Add a better structure for the `/scripts` directory
- [ ] Remove windows dev setup...
- [ ] How to use the wiki in a forked project?
- [ ] Add installation of "jq" to dev setup [sudo apt-get install jq]
- [ ] Check remaining TODOs

### ☁️ AWS specific [Issue Nr. [OLP18](https://github.com/Dominicdaniel86/Mursica-FM/issues/80)]

Will be implemented with later AWS/ CDK versions (using a more advanced AWS setup)

- [ ] Integrate prettier & ESLint into the `AWS` directory
- [ ] Add health check for the EC2 instance
- [X] Add Makefile commands for AWS
- [X] Use dynamic values in EC2 deploy script
- [X] Update wiki for AWS related sites
  - [X] CDK Guide
  - [X] Architecture
- [ ] Implement more granular security group for EC2 instance
