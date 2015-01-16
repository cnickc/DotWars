/*****************************************************************************************
 * Game Setup
 ****************************************************************************************/

-dotwars.html runs the game.

-Put your AI script in the AIScripts folder.

-Add the filename of your script ( less .js ) to the playerList in GAME.js.  The game will
randomly select 4 (configurable) players out of list (without replacement) to play in a
game. 

/*****************************************************************************************
 * How to make an AI
 ****************************************************************************************/

-Your AI will be sent a couple different types of messages.  The first is to set your ID.
This is important because this is how you will tell which units are yours and which bases
you control. See the example code.  Or copy and paste the example code.  

-The second type of message is just data.  You will be given full data about all bases and
units in the game, including dead ones.  Make sure you can tell the difference.  See 
BASE.js and UNIT.js for the different properties you have access to.  Messages will be in
JSON format, and look like:
{"bases":[ ... ], "units":[ ... ]}
Again, see example code if you're stuck.

-You are expected to return a JSON message as an array of commands to individual units
that you control.  Only one instruction per unit per 'turn' will be processed.  A message 
must include the ID of the unit it is intended for.  It can include a move command, and 
ONE of the following: dash, farm, attack.  If more than one of dash, farm, or attack are 
included then only one will be performed, (using the priority dash > farm > attack).  
Assigning a falsey value to one of these commands is equivalent to not giving that command.
>unitID is the unit that you are giving orders to.
>move is the direction you want to move in ("left", "right", "down", "up")
>dash is the direction you want to dash in
>attack is the unitID of the unit you want to attack
>farm is a boolean whether or not to farm at your current location

-Attack should be self explanatory.  Dash is a second 'move' command to help you get 
around the map faster.  Farm can only be used by a unit that inside a base that it 
controls, and allows you to create more units.

-Each base you own will let you support up to 10 units.  So in order to 
make more than 10 units, you must command more than 1 base.  You will start the game with
4 units at your command

-Scoring scheme is as follows: 
	kill a unit = 10 pts.  
	create a unit = 1 pts. 
	own a base = (0.02 pts. / base) / gameTick
	attack your own unit = -10 pts.
Winner is the player with the most points 