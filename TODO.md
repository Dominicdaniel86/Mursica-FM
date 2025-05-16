# TO-DOs

Small tasks, ideas, and notes that don't warannt full GitHub issues.

---

### Structure Validation

##### /errors/database.ts

- [ ] NotFoundError

##### /interfaces/spotifyPlayer.ts

- [ ] SpotifyPlayer

##### /interfaces/spotifyTokens.ts

- [ ] SpotifyClientTokenResponse
- [ ] SpotifyAuthTokenResponse

##### /interfaces/spotifyTracks.ts

- [ ] SpotifyTrackResponse
- [ ] TrackSummary

#### Structure Only

- [X] /src/auth
  - [X] auth.ts
- [X] /src/services
  - [X] algorithm.ts
- [X] /src/tests
  - [X] test.ts

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
