/*****************************************************************************************
 * Gamma:
 * The hunter.  Takes a moment to strengthen its army, then selects a target unit to track
 * down.  Ignore everything else en-route.
 ****************************************************************************************/
var msg = [];
var ID;
var targetUnit = -1;

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
//checks if an enemy unit is in attacking range.  If there are multiple, select the 
//weakest
enemyInRange = function( me, them ) {
	targetLife = 999;
	target = -1;
	for( var i = 0;  i < them.length; i++ ) {
		if( them[i].health <= 0 ) {
			continue;
		}
		var x = me.locx - them[i].locx;
		var y = me.locy - them[i].locy;
		if( x*x + y*y < me.atkRadius*me.atkRadius && them[i].health < targetLife ) {
			targetLife = them[i].health;
			target = them[i].id;
		}
	}
	return target;
};

//identify the direction i should move in to get to a target destination
getDir = function( x1, y1, x2, y2 ) {
	var w = x1 - x2;
	var h = y1 - y2;
	if( Math.abs( w ) > Math.abs( h ) ){
		if( w < 0 ) {
			return "right";
		} else {
			return "left";
		}
	} else {
		if( h < 0 ) {
			return "down";
		} else {
			return "up";
		}
	}
	return "";
};

//create new orders for my units
dataResponse = function ( ev ) {
	//sort through given data
	orders = [];
	myGuys = [];
	enemies = [];
	u = ev.data["Data"].units;
	b = ev.data["Data"].bases;

	for( var i = 0; i < u.length; i++ ) {
		if( u[i].allegiance == this.ID ) {
			myGuys.push( u[i] );
		} else {
			enemies.push( u[i] );
		}
	}

	//build a stockpile before going hunting
	if( targetUnit == -1 && myGuys.length < 6 ) {
		for( var i = 0; i < myGuys.length; i++ ) {
			var mark = enemyInRange( myGuys[i], enemies );
			if( mark > 0 ) {
				//attack if someone is in my space
				orders.push( {"unitID" : myGuys[i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				//farm
				orders.push( {"unitID" : myGuys[i].id, "move" : "", "dash" : "", "attack" : "", "farm" : true} );
			}
		}	
	} 
	else
	{
		//find a new target
		while( targetUnit == -1 || u[targetUnit].health <= 0) {
			targetUnit = enemies[Math.floor(Math.random() * enemies.length)].id;
		}

		//chase down that target 
		for( var i = 0; i < myGuys.length; i++ ) {
			var mark = enemyInRange( myGuys[i], [ u[targetUnit] ] );
			if( mark > 0 ) {
				orders.push( {"unitID" : myGuys[i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				var dir = getDir( myGuys[i].locx, myGuys[i].locy, u[targetUnit].locx, u[targetUnit].locy ); 
				orders.push( {"unitID" : myGuys[i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			}
		}
	}

	//post message back to AI Manager
	postMessage( { "Orders" : orders } );	
}