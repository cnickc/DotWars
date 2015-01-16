/*****************************************************************************************
 * Beta:
 * The drunken farmer.  Will move each unit in a random direction, and attempt to farm.
 * Will not try to defend itself.
 * Contributed by: Daniel Kotowski & Michael McLean
 ****************************************************************************************/
var max = 500;
var min = 1500;
var delay = Math.floor(Math.random() * (max - min + 1)) + min;;
var msg = [];
var popMet = false
var ID;
var homeBase;
var foundHomeBase = false;
var base = -1;


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
		if( them[i].health <= 0 || them[i].id < 0 ) {
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

closetEnemy = function(me, them){
	
	ce = null;
	dist = 0;

	for( var i = 0;  i < them.length; i++ ) {
		if( them[i].health <= 0 || them[i].id < 0) {
			continue;
		}
		var x = me.locx - them[i].locx;
		var y = me.locy - them[i].locy;
		d =Math.sqrt( x*x + y*y);
		if(ce == null){
			ce = them[i];
			dist = d;
		}
		else if(d < dist){
			ce = them[i];
			dist = d;
		}
	}

	return ce;

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

isUnitInBase = function ( base, unit ) {
	var x = base.locx - unit.locx;
	var y = base.locy - unit.locy;
	if ( x*x + y*y < base.R*base.R ) {
		return true;
	}	
	return false;
}

//check if enemies are inside a base
isEnemyInBase = function( base, foes ) {
	for( var i = 0; i < foes.length; i++ ) {
		if( foes[i].health <= 0 ) {
			continue;
		}

		if( isUnitInBase( base, foes[i] ) ) {
			return true;
		}
	}
	return false;
};

ownedBase = function( bases ) {
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance == ID ) {
			return bases[i];
		}
	}
	return -1;
}

//create new orders for my units
dataResponse = function ( ev ) {
	//randomly assign a direction to each unit, and attempt to farm
	orders = [];
	dirs = ["up", "down", "left", "right", "in"];
	u = ev.data["Data"].units;

	myGuys = [];
	enemies = [];
	team1 = [];
	team2 = [];
	team3 = [];

	b = ev.data["Data"].bases;

	if (!(foundHomeBase))
	{
		homeBase = ownedBase(b);
		foundHomeBase = true;
	}

	var count = 0;

	for( var i = 0; i < u.length; i++ ) {
		if( u[i].allegiance == this.ID ) {
			myGuys.push( u[i] );
			if(team1.length < 3){
				
				team1.push(u[i])				
			}
			else{
				
				team2.push(u[i])
			}
		} else {
			enemies.push( u[i] );
		}
	} 



	
	//select a target if I don't currently have one
	while( base == -1 || b[base].allegiance == ID) {
		base = Math.floor(Math.random() * b.length);
	}

	myBases = ownedBase(b);

	for( var i = 0; i < myBases.length; i++ ) {

		/*
			for( var i = 0; i < myGuys.length; i++ ) {
			
			var mark = enemyInRange( myGuys[i], enemies );
			if( mark > 0 ) {
				orders.push( {"unitID" : myGuys[i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				var dir = getDir( team2[i].locx, team2[i].locy, b[base].locx, b[base].locy ); 
				orders.push( {"unitID" : myGuys[i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			}
		
		}*/
		
	}

	if(team2.length > 0){

		var mark = closetEnemy( team2[0], enemies );
	}


	if (isEnemyInBase(homeBase, enemies))
	{
		for( var i = 0; i < team1.length; i++ ) {
			var e = closetEnemy(team1[i], enemies);
			var dir = getDir( team1[i].locx, team1[i].locy, e.locx, e.locy ); 
			orders.push( {"unitID" : team1[i].id, "move" : "", "dash" : "", "attack" : e, "farm" : false} );
			orders.push( {"unitID" : team1[i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			
		}

		//attack any units in range, or move towards target
		for( var i = 0; i < team2.length; i++ ) {
			
			
			if( mark > 0 ) {
				orders.push( {"unitID" : team2[i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				var e = closetEnemy(team2[i],enemies);
				var dir = getDir( team2[i].locx, team2[i].locy, e.locx, e.locy ); 
				orders.push( {"unitID" : team2[i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			}
		}
	}
	else if (myGuys.length > 6 || popMet)
	{	
		popMet = true

		for( var i = 0; i < team1.length; i++ ) {
				//IF not home go home
				if(isUnitInBase(team1[i],homeBase)){					
					var dir = getDir( team1[i].locx, team1[i].locy, homeBase.locx, homeBase.locy );
					orders.push( {"unitID" : team1[i].id, "move" : "", "dash":dir,"attack" : "", "farm" : false} ); 
				}
				orders.push( {"unitID" : team1[i].id, "move" : "", "attack" : "", "dash":"", "farm" : true} );
		 }
		//attack any units in range, or move towards target
		for( var i = 0; i < team2.length; i++ ) {
			
			
			if( mark > 0 ) {
				orders.push( {"unitID" : team2[i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				var e = closetEnemy(team2[i],enemies);
				var dir = getDir( team2[i].locx, team2[i].locy, e.locx, e.locy ); 
				orders.push( {"unitID" : team2[i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			}
		}

	}
	else
	{	
		for( var i = 0; i < u.length; i++ ) {
			if( u[i] && u[i].allegiance == this.ID ) {
				orders.push( {"unitID" : u[i].id, "move" :"", "attack" : "", "farm" : true} );
			}
		}


		for( var i = 0; i < team1.length; i++ ) {
				//IF not home go home
				if(isUnitInBase(team1[i],homeBase)){
					orders.push( {"unitID" : team1[i].id, "move" : "", "attack" : "", "farm" : true} );
				}
				else{
					var dir = getDir( team1[i].locx, team1[i].locy, homeBase.locx, homeBase.locy ); 
					orders.push( {"unitID" : team1[i].id, "move" : "", "dash":dir,"attack" : "", "farm" : false} );
				}
		 } 

	}
	
	//post message back to AI Manager	
	postMessage( { "Orders" : orders } );		
}