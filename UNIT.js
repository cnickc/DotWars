// DotWars, v1.0
// https://github.com/cnickc/DotWars
// (c) 2014-2015 cnickc

//Unit Class
function Unit( locx, locy, owner, id ) {
	this.id = id;
	this.locx = locx;
	this.locy = locy;
	this.allegiance = owner;
	this.atkReload = 0;
	this.atkRadius = 10;
	this.atkDmg = 1;
	this.health = 10;
}

// superclass method
Unit.prototype = {
	Order: function ( cmd ) {
	},
	
	Attack: function ( target ) {
		if ( this.health <= 0 ) {
			return; //cannot attack if dead
		}
		
		if ( this.atkReload > 0 ) {
			return; //cannot attack this often
		}

		var x = target.locx - this.locx;
		var y = target.locy - this.locy;
		
		if ( x*x + y*y < this.atkRadius*this.atkRadius ) {
			target.Hit( this.atkDmg );
		}
		this.atkReload = 5;
		return;
	},
	
	Hit: function ( dmg ) {
		this.health -= dmg;
		if( this.health <= 0 ) {
			this.locx = -1;
			this.locy = -1;
			this.allegiance = -1;
		}
		return;
	},
	
	Move: function ( dx, dy ) {
		if ( health <= 0 ) {
			return; //cannot move if dead
		}
		this.locx += dx;
		this.locy += dy;
		return;
	},
	
	Farm: function ( base ) {
		if ( this.health <= 0 ) {
			return; //cannot farm if dead
		}
		if ( base.IsUnitInBase( this ) ) {
			base.Farm();
		}
		return;
	}	
}