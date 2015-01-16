//Base Class
function Base( locx, locy, radius, id ) {
	this.id = id;
	this.locx = locx;
	this.locy = locy;
	this.R = radius;
	this.allegiance = -1;
	this.farmTotal = 0;
}

// superclass method
Base.prototype = {

	GetAllegiance: function () {
		return this.allegiance;
		return;
	},
	
	SetAllegiance: function ( newAll ) {
		this.allegiance = newAll;
		this.farmTotal = 0; //allegiance change resets farm total
		return;
	},
	
	UnitsInBase: function ( units ) {
		var numUnits = 0;
		for ( var i = 0; i < units.length; i++ ) {
			if ( IsUnitInBase( units[i] ) ) {
				numUnits++;
			}
		}
		return numUnits;
	},
	
	IsUnitInBase: function ( unit ) {
		var x = this.locx - unit.locx;
		var y = this.locy - unit.locy;
		if ( x*x + y*y < this.R*this.R ) {
			return true;
		}	
		return false;
	},
	
	Farm: function () {
		this.farmTotal += 0.002;
		return;
	},
	
	GetFarmTotal: function () {
		return this.farmTotal;
	}
}