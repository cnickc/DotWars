/*****************************************************************************************
 * Beta:
 * The drunken farmer.  Will move each unit in a random direction, and attempt to farm.
 * Will not try to defend itself.
 * Contributed by: Ly Ngo & Clayton Goes
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
	myGuys = [];
	enemies = [];
	dirs = ["up", "down", "left", "right", "in"];
	u = ev.data["Data"].units;
	v = ev.data["Data"].bases;
	
	for( var i = 0; i < u.length; i++ ) {
		if( u[i].allegiance == this.ID ) {
			myGuys.push( u[i] );
		} else {
			enemies.push( u[i] );
		}
	}
	
	
	for( var i = 0; i < u.length; i++ ) {
		if( u[i] && u[i].allegiance == this.ID ) {
			mark = enemyInRange(u[i], enemies);
			if(mark > 0)
			{
				orders.push( {"unitID" : u[i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	

			}else if(inBase(v, u[i])){
				curBase = inWhichBase(v, u[i]);
				nBase=false;
				for(var j=0; j < u.length; j++)
				{
					if( u[j].allegiance != this.ID && u[j].health > 0){
						if(inSameBase(u[j], curBase)){
							console.log("ENEMY");
							nBase =  u[j];
							break;
						}
					}
				}
				
				if(nBase != false){
					dir = getDir(u[i].locx, u[i].locy, nBase.locx, nBase.locy);
				}
				else if(onlyOneInBase(curBase, u, u[i]))
				{
					dir = getDir(u[i].locx, u[i].locy, curBase.locx, curBase.locy);
				}else if(numUnitsInSameBase(u, curBase) > 7){
					nBase = findTarget(u[i], u, v);
					dir = getDir(u[i].locx, u[i].locy, nBase.locx, nBase.locy);
				}
				else{
					dir = dirs[Math.floor(Math.random() * dirs.length)];
				}
				
				if(typeof nBase.health == 'undefined'){
					orders.push( {"unitID" : u[i].id, "move" : dir, "attack" : "", "farm" : true} );
				}else{
					orders.push( {"unitID" : u[i].id, "move" : dir, "attack" : nBase.id} );
				}
			}
			else{
				nBase = findTarget(u[i], u, v);
				ndir = getDir(u[i].locx, u[i].locy, nBase.locx, nBase.locy);
				orders.push({ "unitID" : u[i].id, "move" : ndir, "dash": ndir, "attack" : "", "farm" : ""});
			}
		}
	} 
	
	//post message back to AI Manager	
	postMessage( { "Orders" : orders } );		
}

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

inBase = function(bases, unit){
	for(var b=0; b < bases.length; b++){
		var x = bases[b].locx - unit.locx;
		var y = bases[b].locy - unit.locy;
		if ( x*x + y*y < bases[b].R*bases[b].R ) {
			return true;
		}	
	}
	return false;
}

inSameBase = function(unit, base){
	var x = base.locx - unit.locx;
	var y = base.locy - unit.locy;
	if ( x*x + y*y < base.R*base.R ) {
		return true;
	}
	return false;
}

findTarget = function(alleged, units, bases){
	minBase =  closestOpenBase(bases, alleged);
	if( minBase == false){
		minBase = weakestEnemyBase(bases, units);
	}else{ return minBase; }
	if( minBase == false){
		minBase = attackEnemies(alleged, units);
	}else{ return minBase; }
	
	return minBase;
}

numUnitsInSameBase = function( units, base ){
	var count =  0;
	
	for( var i = 0; i < units.length; i++ ){
		if(units[i].allegiance == this.ID && inSameBase(u[i], base)){
			count++;
		}
	}
	
	return count;
}


onlyOneInBase = function(base, units, curUnit){
	for(var u=0; u < units.length; u++){
		if(curUnit != units[u]){
			
			var x = units[u].locx - base.locx;
			var y = units[u].locy - base.locy;
			if ( x*x + y*y < base.R*base.R ) {
				return false;
			}
		}
	}
	return true;
}

weakestEnemyBase = function(bases, units){
	var curBase = false;
	runningTotal=100;
	for(b=0; b<bases.length; b++)
	{
		curTotal=numUnitsInSameBase(units, bases[b])
		if(bases[b].allegiance != this.ID && runningTotal > curTotal)
		{
			runningTotal=curTotal;
			curBase = bases[b];
		}	
	}
	return curBase;
}

inWhichBase = function(bases, unit){
	for(var b=0; b < bases.length; b++){
		var x = bases[b].locx - unit.locx;
		var y = bases[b].locy - unit.locy;
		if ( x*x + y*y < bases[b].R*bases[b].R ) {
			return bases[b];
		}	
	}
	return false;
}

closestOpenBase = function( bases, unit ) {
	var minDist = 9999;
	var minBase = false;
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance != -1 ) {
			continue;
		}
		var dist = Math.abs(bases[i].locx - unit.locx) + Math.abs(bases[i].locy - unit.locy);
		if( dist < minDist ) {
			minDist = dist;
			minBase = bases[i];
		} 
	}
	
	return minBase;
};

attackEnemies = function( alleged, units ){
	for( var i = 0; i < units.length; i++){
		if( units[i].allegiance != this.ID && units[i].health > 0){
			return units[i];
		}
	}
}

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

