# TO-DOs

Small tasks, ideas, and notes that don't warannt full GitHub issues.

---

### 🧑‍🦱 User authentication

#### Login/ Logout features

- [x] Redirect after successfull email validation (new HTML page)
- [x] Allow to resend email validation token
- [ ] Send token to frontend
- [x] Implement cookie management in frontend
  - [ ] Add new cookie functions
- [ ] Validate tokens in backend for every step that requires it
- [ ] Enable logout

#### Guest implementation

- [ ] Generate Session Token
- [ ] Let others join the session
- [ ] Cookie & Authentication management

#### Update OAuth token

- [ ] Use state for validation
- [ ] Update the OAuth token for the new 1:1 relation
- [ ] Use the right token for every (admin) function call

#### Improvements

- [ ] Improved API calls frontend-backend
- [ ] Better logging
- [ ] Replace alerting
- [ ] Add comments & docs
- [ ] Add better frontend error handling
- [ ] Backend: Check status codes

### 🧹 Project Cleanup

- [ ] Add a better structure for the `/scripts` directory
- [ ] Update windows dev setup (own issue?)
- [ ] How to use the wiki in a forked project?
- [ ] Add installation of "jq" to dev setup [sudo apt-get install jq]

### ☁️ AWS specific [Issue Nr. [OLP18](https://github.com/Dominicdaniel86/Mursica-FM/issues/80)]

Will be implemented with later AWS/ CDK versions (using a more advanced AWS setup)

- [ ] Integrate prettier & ESLint into the `AWS` directory
- [X] Add Makefile commands for AWS
- [X] Use dynamic values in EC2 deploy script
- [X] Update wiki for AWS related sites
  - [X] CDK Guide
  - [X] Architecture
