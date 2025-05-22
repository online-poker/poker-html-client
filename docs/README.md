# UI Architecture

This product is UI application which run in following form-factors

-   Mobile application
-   Tablet application
-   Interactive table with tablet seats and informational table
-   Interactive table with single mulitouch screen

## Application parts

The application consists of multple UI areas. Each UI area represent a place where player can perform specific function.
Areas:

-   Login area
-   Lobby area
-   Table area
-   Seat area

## Login area

This area responsible for authorization in the application or user in the system. That includes logging, registration, profile management.

## Lobby area

This is where user select a game to play. This area is responsible for game selection, filtering. Same for tournaments.

## Table area

This is where user play the game.
This area is responsible for displaying tables, cards, chips, players, actions, chat, and the game log.
For online individual games, this area also can contain control panel for the games

This area represented by one of the following files

-   [html/pages/main/tables.html](Poker.Application.Shared/html/pages/main/tables.html)
-   [html/pages/main/tables-inline.html](Poker.Application.Shared/html/pages/main/tables-inline.html)

## Seat area

This is where user can see his current status of the game and control panel for the games.
This area only applicable to the offline-tables.

This area located in the following file:

-   [html\pages\main\seats.html](Poker.Application.Shared\html\pages\main\seats.html)

# Table structure

The game table has following structure:

-   Shared table information
-   Game status information
-   Game seats/Player in the game information like cards, chips, money.
-   Control panel.

Each Seat/Table player is a separate component which embededed into different areas.
For example game seat in the online display this component, and Seat area in the offline also display this component + Control panel to represent the seat of the player.

# Common templates

## Game control panel

Game control conists from the two components `table-action-block`

-   [themes\default\components\table\actionBlock\actionBlock.html](Poker.Application.Shared\themes\default\components\table\actionBlock\actionBlock.html)

and `table-raise-block`

-   [themes\default\components\table\actionBlock\secondaryActionBlock.html](Poker.Application.Shared\themes\default\components\table\actionBlock\secondaryActionBlock.html)

## Player seat

This component which located either in the `<script type="text/html" id="seat-table-player-template">` or `<script type="text/html" id="table-player-template">`

## Table pots

Table pots represented by the `table-pots-template` template.

## Player cards

If you need to display player cards, please use `player-cards-template` template.`

# Player cards

In order to display player cards on the hands, we develop rather complicated machinery. We basically have 4 blocks which represents cards

- Cards on hand
- Folded cards
- Closed cards
- Adorment for the cards

Cards on hand used for displaying actual cards value to the player, and participate in the animation.
Folded cards used only for displaying folded cards. Both cards on hands and folded cards blocks mutually exclusive to each other. 
If you have cards on hand, you will never have folded cards and vice versa.
Closed cards is block which display closed cards for the player. They server as overlay over cards on hands or folded cards, 
and as interactive control for opening card to the player. 
Adorment for the cards provide additional static arrangements for the cards, like outlne for cards, or maybe highlighting.

## CSS classes which control blocks

The following CSS classes control the UI:

- player-cards
- on-hand
- folded
- table-cards-overlay
- player-cards-4cards
- player-cards-2cards
- hightlighted
- card1hightlighted
- card2hightlighted
- card3hightlighted
- card4hightlighted
- fold
- deal
- animation
- overlay-hidden
- show-hole-card1
- show-hole-card2

`player-cards` represents the container component for player cards. That's abstract concept and include UI block which displays 2 or 4 cards.

`on-hand` is an indication that this is player cards on hand. They always prominently visible in the UI.

`folded` is an indication that player cards are folded. They are always dimmed or semi transaprent, to indicate that cards which player previously have out of the game. That's like fodled cards neara player, always accessible to view or to show to others.

`table-cards-overlay` Indication of block which display closed cards as an overlay over cards on hand or folded cards. That overlay become transparent when cards are opened/highlighted.

You may think about UI composing of three levels. First top-most layer is cards overlay. Second, middle layer is cards on hand or folded cards, depends on the status of the player in the game. Third block is lowest, and for visual indication of cards place in the game. For example highlighting or cards outline.

`player-cards-4cards` Indicates that game give 4 cards to the player. Omaha and their variants.

`player-cards-2cards` Indicates that game give 2 cards to the player. Most variants of game.

`hightlighted` That class set when game wants highlight cards in the game, for example in the ending of the game. That allow put cards in the different location. That does not affect visual of the cards, maybe placement if shown at that end of game cards are moved to slightly different location.

`card1hightlighted` Indicate that First player card is highlighted at the end of game. That indicate that this card is participated in winning combination.

`card2hightlighted` Indicate that Second player card is highlighted at the end of game. That indicate that this card is participated in winning combination.

`card3hightlighted` Indicate that Third player card is highlighted at the end of game. That indicate that this card is participated in winning combination.

`card4hightlighted` Indicate that Forth player card is highlighted at the end of game. That indicate that this card is participated in winning combination.

`fold` indicates that cards on hand are are folded. Used for hiding cards, or indication that cards should be hidden at the end of animation, in case if this element is animated.

`deal` indicates that cards on hand are are dealt. Used for showing cards, or indication that cards should be visible at the end of animation, in case if this element is animated.

`animation` indicates that this element is animation. Does not do much, only used to help animate `fold` and `deal` states.

`overlay-hidden` Indicates that table overlay should be hidden. That's when all cards are shown.

`show-hole-card1` Indicates that overlay over first card should be hidden, thus making first card visible, either if it was on-hand or folded.

`show-hole-card2` Indicates that overlay over second card should be hidden, thus making second card visible, either if it was on-hand or folded.
