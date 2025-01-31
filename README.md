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

In order to do the account creation tests, you'll need to create a mailslurp API key and set it in the `MAILSLURP_API_KEY` environment variable.
https://docs.mailslurp.com/api/

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
