@live
Feature: Live auth flow
  Integration tests that hit the real API on :3001 and DynamoDB Local.

  Requires the full local stack to be running:
    pnpm localstack:up && pnpm localstack:seed && pnpm dev

  Seeded test user: test@test.com / testtest

  Rule: Login

    Background:
      Given I am on the login page

    @smoke
    Scenario: Seeded test user can log in and reach the app
      When I log in as the test user
      Then I am redirected to the studio or dashboard

    @regression
    Scenario: Wrong password shows an error and stays on login
      When I enter "test@test.com" as the email
      And I enter "wrongpassword" as the password
      And I submit the login form
      Then an error alert is visible
      And I am not on the studio or dashboard

  Rule: Protected routes

    @smoke
    Scenario: Authenticated user can access /studio directly
      Given I am logged in as the test user
      When I navigate to "/studio"
      Then I am on the studio page

    @regression
    Scenario: Unauthenticated user is redirected away from /studio
      When I navigate to "/studio"
      Then I am redirected to "/login"

  Rule: Session lifecycle

    @regression
    Scenario: Logout clears the session and re-protects /studio
      Given I am logged in as the test user
      When I sign out from the account page
      Then I am redirected to "/login"
      And navigating to "/studio" redirects to "/login"
