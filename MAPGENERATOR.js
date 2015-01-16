//MapGenerator Class
function MapGenerator( p ) {
	this.numPlayers = p;
}

// superclass method
MapGenerator.prototype = {

	TwoPlayerMap : function () {
		var b = [];		
		b.push( new Base( 40, 40, 30, 0 ) );
		b.push( new Base( 460, 460, 30, 1 ) );
		b.push( new Base( 40, 100, 30, 2 ) );
		b.push( new Base( 100, 40, 30, 3 ) );
		b.push( new Base( 460, 400, 30, 4 ) );
		b.push( new Base( 400, 460, 30, 5 ) );
		b.push( new Base( 250, 250, 40, 6 ) );
		return b;
	},
	
	ThreePlayerMap : function () {
		var b = [];		
		b.push( new Base( 250, 100, 30, 0 ) );
		b.push( new Base( 100, 250, 30, 1 ) );
		b.push( new Base( 400, 250, 30, 2 ) );
		b.push( new Base( 250, 250, 30, 3 ) );
		b.push( new Base( 250, 400, 30, 4 ) );
		return b;
		
	},

	FourPlayerMap : function () {
		var b = [];		
		var rand = Math.floor( Math.random()*2 );
		
		if( rand == 0 ) {
			b.push( new Base( 40, 40, 30, 0 ) );
			b.push( new Base( 460, 40, 30, 1 ) );
			b.push( new Base( 40, 460, 30, 2 ) );
			b.push( new Base( 460, 460, 30, 3 ) );
			b.push( new Base( 250, 250, 30, 4 ) );
			b.push( new Base( 250, 100, 30, 5 ) );
			b.push( new Base( 250, 400, 30, 6 ) );
		} else if ( rand == 1 ) {
			b.push( new Base( 40, 100, 30, 0 ) );
			b.push( new Base( 100, 40, 30, 1 ) );
			b.push( new Base( 460, 400, 30, 2 ) );
			b.push( new Base( 400, 460, 30, 3 ) );
			b.push( new Base( 40, 40, 30, 4 ) );
			b.push( new Base( 460, 460, 30, 5 ) );
			b.push( new Base( 250, 250, 40, 6 ) );
		}
		return b;
	},

	Generate : function () {
		switch( this.numPlayers ) {
			case 2:
				return this.TwoPlayerMap();
				break;
			case 3:
				return this.ThreePlayerMap();
				break;
			case 4:
				return this.FourPlayerMap();
				break;
		
		}
	}
}


