# UI Integration Testing

## Repository Structure

- **/tests**: Contains all test cases and scenarios.
- **/perf-results**: Stores performance test results. 

## Getting Started

To set up and run the tests locally:

1. **Clone the Repository**:
```bash
   git clone https://github.com/adsabs/ui-integration-testing.git
   cd ui-integration-testing
   
   # Install dependencies
   pnpm install
```

2. **Run the Tests**:
```bash
   # Run all tests
   pnpm test
   
   # Run tests in watch mode
   pnpm test:watch
```

For the other account login tests make sure you have a good test account created in the environment and add the `TEST_EMAIL` and `TEST_PASSWORD` environment variables.

The tests watch for these variables and will be skipped if they are not set.

**Pass Arguments to Playwright**
```bash
pnpm test -- --ui
pnpm test -- --headed
```

## Authenticated tests
Some of the tests require authentication. To run these tests, you'll need to create two test accounts and verify them yourself.
You can use plussed (`+`) email addresses to create the alt account, for example:
```
TEST_EMAIL=myemail+test@gmail.com
TEST_EMAIL_ALT=myemail+testalt@gmail.com
TEST_PASSWORD=yourpassword
```
These shouldn't be accounts you use for anything else, as the settings/libraries will be changed/deleted during the tests.

## Account Registration tests (those requiring emails)

### Create a Google project in Google console
1. Go to https://console.developers.google.com/
2. Create a new project
3. Add the Gmail API to the project
4. Create credentials for the project
5. Download the credentials as a JSON file, save this in the `gmail` directory
6. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of the JSON file


