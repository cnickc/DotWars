// DotWars, v1.0
// https://github.com/cnickc/DotWars
// (c) 2014-2015 cnickc

var msg = [];
var postLock = false;
var workers = [];
var msgList = [];
var units = [];

//When receiving a messages from main game loop
onmessage = function ( ev ) {
	incoming( ev );	
};

/*****************************************************************************************
 *	Data Function Area
 ****************************************************************************************/
//switch to pass along information based on command given
incoming = function ( ev ) {
	for( var cmd in ev.data ) {
		switch( cmd ) {
			case "LoadAI":
				for( var i = 0; i < ev.data[cmd].length; i++ ) {
					loadWorkers( ev.data[cmd][i] );
				}
				break;
			case "Data":
				units = ev.data[cmd]["units"];
				receiveData( ev.data, cmd );
				break;
			case "Terminate":
				for( var i = 0; i < workers.length; i++ ) {
					workers[i].terminate();
				}	
				close();
				break;
			default:
				break;
		}
	}	
	
	sendMessages();	
};

/*****************************************************************************************
 *	Utility Function Area
 ****************************************************************************************/
//create the AI workers for the game and prepare initialization data to send
loadWorkers = function ( fname ) {
	workers.push( new Worker( 'AIScripts/' + fname + '.js' ) );

	workers[workers.length-1].onmessage = workerResponse( workers.length-1 );
	workers[workers.length-1].postMessage( { "setID" : workers.length-1 } );	
	msgList[workers.length-1] = true;
};

//receive data from game, and post data to all AI that are ready for new data
receiveData = function ( datum, cmd ) {
	for( var i = 0; i < msgList.length; i++ ) {
		if( !msgList[i] ) {
			continue;
		}
		workers[i].postMessage( datum );
		msgList[i] = false;
	}
};

//send AI messages up to the game controller for processing
sendMessages = function() {	
	postMessage( { "Orders" : msg } );

	//Surprisingly the fastest array deletion method outside of creating a new array
	while (msg.length > 0) {
		msg.pop();
	}
};

//message handler pinned to the ID of a given AI script so I can verify the AIs messages
workerResponse = function( id ) {
	return function ( ev ) {
		//verify response message: check that this id can actually send commands to
		//specified units
		verifyMessage( ev, id );
	};
};

//add message to the list to be included in the next push to the game controller
storeMessage = function( m, id ) {
	msg.push( m );
	if( typeof id !== 'undefined' ) {
		msgList[id] = true;
	}
};

//checks that the message contains orders, and that each order is for a unit belonging
//to this id
verifyMessage = function ( ev, id ) {
	if( !ev.data["Orders"] ) {
		return false;
	}
	var orders = ev.data["Orders"];
	for( var i = 0; i < orders.length; i++ ) {
		if( units[orders[i].unitID].allegiance != id ) {
			continue;
		}
		storeMessage( orders[i], id );
	}
	return;
};


