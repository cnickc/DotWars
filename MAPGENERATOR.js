// DotWars, v1.0
// https://github.com/cnickc/DotWars
// (c) 2014-2015 cnickc

//MapGenerator Class
function MapGenerator( p ) {
	this.numPlayers = p;
}

// superclass method
MapGenerator.prototype = {

	TwoPlayerMap : function () {
		var b = [];	
		var rand = Math.floor( Math.random()*3 );
		
		if( rand == 0 ) {	
			b.push( new Base( 40, 40, 30, 0 ) );
			b.push( new Base( 460, 460, 30, 1 ) );
			b.push( new Base( 40, 100, 30, 2 ) );
			b.push( new Base( 100, 40, 30, 3 ) );
			b.push( new Base( 460, 400, 30, 4 ) );
			b.push( new Base( 400, 460, 30, 5 ) );
			b.push( new Base( 250, 250, 40, 6 ) );
		} else if ( rand == 1 ) {
			b.push( new Base( 40, 40, 30, 0 ) );
			b.push( new Base( 460, 460, 30, 1 ) );
			b.push( new Base( 150, 150, 20, 2 ) );
			b.push( new Base( 250, 150, 20, 3 ) );
			b.push( new Base( 350, 150, 20, 4 ) );
			b.push( new Base( 150, 250, 20, 5 ) );
			b.push( new Base( 250, 250, 20, 6 ) );
			b.push( new Base( 350, 250, 20, 7 ) );
			b.push( new Base( 150, 350, 20, 8 ) );
			b.push( new Base( 250, 350, 20, 9 ) );
			b.push( new Base( 350, 350, 20, 10 ) );
		} else if ( rand == 2 ) {
			b.push( new Base( 40, 40, 30, 0 ) );
			b.push( new Base( 460, 460, 30, 1 ) );
			b.push( new Base( 450, 50, 20, 2 ) );
			b.push( new Base( 450, 100, 20, 3 ) );
			b.push( new Base( 400, 50, 20, 4 ) );
			b.push( new Base( 400, 100, 20, 5 ) );
			b.push( new Base( 50, 450, 20, 6 ) );
			b.push( new Base( 100, 450, 20, 7 ) );
			b.push( new Base( 50, 400, 20, 8 ) );
			b.push( new Base( 100, 400, 20, 9 ) );
		}
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
		var rand = Math.floor( Math.random()*4 );
		
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
		} else if ( rand == 2 ) {
			b.push( new Base( 40, 40, 30, 0 ) );
			b.push( new Base( 460, 40, 30, 1 ) );
			b.push( new Base( 40, 460, 30, 2 ) );
			b.push( new Base( 460, 460, 30, 3 ) );
			b.push( new Base( 150, 150, 20, 4 ) );
			b.push( new Base( 250, 150, 20, 5 ) );
			b.push( new Base( 350, 150, 20, 6 ) );
			b.push( new Base( 150, 250, 20, 7 ) );
			b.push( new Base( 250, 250, 20, 8 ) );
			b.push( new Base( 350, 250, 20, 9 ) );
			b.push( new Base( 150, 350, 20, 10 ) );
			b.push( new Base( 250, 350, 20, 11 ) );
			b.push( new Base( 350, 350, 20, 12 ) );
			b.push( new Base( 250, 50, 20, 13 ) );
			b.push( new Base( 250, 450, 20, 14 ) );
			b.push( new Base( 50, 250, 20, 15 ) );
			b.push( new Base( 450, 250, 20, 16 ) );
		} else if ( rand == 3 ) {
			b.push( new Base( 40, 40, 30, 0 ) );
			b.push( new Base( 460, 40, 30, 1 ) );
			b.push( new Base( 40, 460, 30, 2 ) );
			b.push( new Base( 460, 460, 30, 3 ) );
			b.push( new Base( 100, 40, 20, 4 ) );
			b.push( new Base( 40, 100, 20, 5 ) );
			b.push( new Base( 100, 100, 20, 6 ) );
			b.push( new Base( 400, 460, 20, 7 ) );
			b.push( new Base( 460, 400, 20, 8 ) );
			b.push( new Base( 400, 400, 20, 9 ) );
			b.push( new Base( 400, 40, 20, 10 ) );
			b.push( new Base( 460, 100, 20, 11 ) );
			b.push( new Base( 400, 100, 20, 12 ) );
			b.push( new Base( 100, 460, 20, 13 ) );
			b.push( new Base( 40, 400, 20, 14 ) );
			b.push( new Base( 100, 400, 20, 15 ) );
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


