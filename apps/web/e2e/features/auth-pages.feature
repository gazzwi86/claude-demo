@behavioural
Feature: Auth pages — public
  Public auth pages exercised without a running API.
  Network calls are stubbed via page.route() so these
  run fully offline.

  Rule: Login page

    Background:
      Given I am on the login page

    @smoke
    Scenario: Page renders all expected controls
      Then the page heading contains "Looper"
      And the Email field is visible
      And the Password field is visible
      And the Sign in button is enabled
      And there is a "Create an account" link to "/signup"

    @regression
    Scenario: Server error is shown when the API is unreachable
      Given the login API is blocked
      When I enter "ghost@example.com" as the email
      And I enter "supersecret" as the password
      And I submit the login form
      Then an error alert contains "Couldn't reach the server"

    @a11y
    Scenario: Email field receives focus on first Tab press
      When I press Tab
      Then the Email field has focus

  Rule: Signup page

    Background:
      Given I am on the signup page

    @smoke
    Scenario: Short passwords are rejected client-side without a network call
      Given the signup endpoint is intercepted
      When I enter "Demo" as the display name
      And I enter "demo@example.com" as the email
      And I enter "short" as the password
      And I submit the signup form
      Then the Password field is marked invalid
      But the signup endpoint was not called

    @regression
    Scenario: Duplicate email shows a server-side conflict error
      Given the signup endpoint returns a 409 "Email taken" error
      When I enter "Demo" as the display name
      And I enter "taken@example.com" as the email
      And I enter "supersecret" as the password
      And I submit the signup form
      Then an error alert contains "already in use"

  Rule: Home page

    @smoke
    Scenario: Home page links to login and signup
      Given I am on the home page
      Then there is a "Log in" link to "/login"
      And there is a "Sign up" link to "/signup"
