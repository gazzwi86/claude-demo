@behavioural
Feature: Studio audio engine
  The studio exercises the Web Audio engine end-to-end.
  Bundled samples load without a running API — all audio
  processing is self-contained in the browser via lib/audio/.

  Background:
    Given I am on the studio page

  Rule: Startup gate

    @smoke
    Scenario: Studio shows the gate before audio is enabled
      Then the "Ready when you are" heading is visible
      And the Start studio button is visible
      But the pad grid is not present

    @smoke
    Scenario: Clicking Start studio reveals the full layout
      When I click Start studio
      Then the Stop all button is visible
      And the pad grid is visible
      And the Arm mic button is visible
      And the Effects rack is visible
      And the Sample library is visible
      And there are 16 empty pads
      And the audio engine reports pad 0 as not loaded

  Rule: Pad interactions

    Background:
      Given I have started the studio

    @smoke
    Scenario: Loading a bundled sample updates pad state
      When I load "Kick · 90 BPM" from the library
      Then pad 1 shows the Play button
      And the audio engine reports pad 0 as loaded with loop "synth:kick"

    @regression
    Scenario: Toggling a loaded pad starts and stops playback
      Given I have loaded "Kick · 90 BPM" onto pad 1
      When I play pad 1
      Then the audio engine reports pad 0 as playing
      When I stop pad 1
      Then the audio engine reports pad 0 as not playing

    @regression
    Scenario: Muting a pad zeroes audio without unloading the loop
      Given I have loaded "Kick · 90 BPM" onto pad 1
      When I mute pad 1
      Then the audio engine reports pad 0 as muted
      And the audio engine reports pad 0 as loaded

    @regression
    Scenario: Stop all halts every playing pad
      Given I have loaded "Kick · 90 BPM" onto pad 1
      And I am playing pad 1
      When I click Stop all pads
      Then the audio engine reports pad 0 as not playing

    @regression
    Scenario: Effects rack slider updates the reverb engine parameter
      When I move the Reverb mix slider 50 steps right
      Then the reverb mix is between 0.4 and 0.6
