@visual
Feature: Visual regression — page snapshots
  Screenshot comparison suite.
  Run with: pnpm e2e:visual
  Update reference snapshots after intentional UI changes: pnpm e2e:update

  Rule: Desktop snapshots

    Background:
      Given the viewport is 1440x900

    Scenario: Home page matches snapshot
      When I visit "/"
      Then the page matches snapshot "home-desktop.png"

    Scenario: Login page matches snapshot
      When I visit "/login"
      Then the page matches snapshot "login-desktop.png"

    Scenario: Signup page matches snapshot
      When I visit "/signup"
      Then the page matches snapshot "signup-desktop.png"

    Scenario: Studio gated state matches snapshot
      When I visit "/studio"
      Then the page matches snapshot "studio-gated-desktop.png"

    Scenario: Studio active state matches snapshot
      When I visit "/studio"
      And I click enable audio
      Then the page matches snapshot "studio-active-desktop.png"

    Scenario: Dashboard page matches snapshot
      When I visit "/dashboard"
      Then the page matches snapshot "dashboard-desktop.png"

  Rule: Mobile snapshots

    Background:
      Given the viewport is 390x844

    Scenario: Home page matches snapshot
      When I visit "/"
      Then the page matches snapshot "home-mobile.png"

    Scenario: Login page matches snapshot
      When I visit "/login"
      Then the page matches snapshot "login-mobile.png"

    Scenario: Signup page matches snapshot
      When I visit "/signup"
      Then the page matches snapshot "signup-mobile.png"

    Scenario: Studio gated state matches snapshot
      When I visit "/studio"
      Then the page matches snapshot "studio-gated-mobile.png"

    Scenario: Studio active state matches snapshot
      When I visit "/studio"
      And I click enable audio
      Then the page matches snapshot "studio-active-mobile.png"

    Scenario: Dashboard page matches snapshot
      When I visit "/dashboard"
      Then the page matches snapshot "dashboard-mobile.png"
