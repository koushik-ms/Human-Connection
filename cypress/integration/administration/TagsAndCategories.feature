Feature: Tags and Categories
  As a database administrator
  I would like to see a summary of all tags and categories and their usage
  In order to be able to decide which tags and categories are popular or not

  The currently deployed application, codename "Alpha", distinguishes between
  categories and tags. Each post can have a number of categories and/or tags.
  A few categories are required for each post, tags are completely optional.
  Both help to find relevant posts in the database, e.g. users can filter for
  categories.

  If administrators summary of all tags and categories and how often they are
  used, they learn what new category might be convenient for users, e.g. by
  looking at the popularity of a tag.

  Background:
    Given I am logged in with a "admin" role
    And we have a selection of tags and categories as well as posts

  Scenario: See an overview of categories
    When I navigate to the administration dashboard
    And I click on the menu item "Categories"
    Then I can see the following table:
      |  | Name               | Posts |
      |  | Just For Fun       | 2     |
      |  | Happiness & Values | 1     |
      |  | Health & Wellbeing | 1     |

  Scenario: See an overview of tags
    When I navigate to the administration dashboard
    And I click on the menu item "Hashtags"
    Then I can see the following table:
      | No. | Hashtags   | Users | Posts |
      | 1   | #Democracy | 3     | 4     |
      | 2   | #Nature    | 2     | 3     |
      | 3   | #Ecology   | 1     | 1     |
