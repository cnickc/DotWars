/*****************************************************************************************
 * Beta:
 * The drunken farmer.  Will move each unit in a random direction, and attempt to farm.
 * Will not try to defend itself.
 * Contributed by: Cameron Christou
 ****************************************************************************************/
var max = 500;
var min = 1500;
var delay = Math.floor(Math.random() * (max - min + 1)) + min;;
var msg = [];
var ID;

onmessage = function ( ev ) {
	for( var cmd in ev.data ) {
		switch( cmd ) {
			case "setID":
				//used so I can identify which units the game has classified as 'mine'
				ID = ev.data[cmd];
				while (msg.length > 0) {
		    		msg.pop();
				}
				break;
			default:
				//strategy response
				dataResponse( ev );
		}
	}	
};

/*****************************************************************************************
 * Utility Functions
 ****************************************************************************************/
//create new orders for my units
dataResponse = function ( ev ) {
	//randomly assign a direction to each unit, and attempt to farm
	orders = [];
	dirs = ["up", "down", "left", "right", "in"];
	u = ev.data["Data"].units;
	for( var i = 0; i < u.length; i++ ) {
		if( u[i] && u[i].allegiance == this.ID ) {
			orders.push( {"unitID" : u[i].id, "move" : dirs[Math.floor(Math.random() * dirs.length)], "attack" : "", "farm" : true} );
		}
	} 
	
	//post message back to AI Manager	
	postMessage( { "Orders" : orders } );		
}