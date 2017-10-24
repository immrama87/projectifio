var caseArray = [];
var parsed;
var parser = new JSONParser();
var sn_correlationIDs = new GlideRecord('sn_customerservice_case');
sn_correlationIDs.addActiveQuery();
sn_correlationIDs.addNotNullQuery('u_service_channel_wo');
sn_correlationIDs.query();

while(sn_correlationIDs.next()){
	caseArray.push(sn_correlationIDs.getValue("u_service_channel_wo"));
}

var updatedWOBody;
var startTime = Date.now();
var time = new Date(startTime - (1000*60*6));
var timeFormatted = time.toISOString() + "\'";
timeFormatted = timeFormatted.substring(0, timeFormatted.length - 1);

try{
	var updatedWOReq = new sn_ws.RESTMessageV2('BV Create Work Orders', 'pollUpdatedWorkOrders');
	updatedWOReq.setStringParameter('timeFormatted', encodeURIComponent(timeFormatted));

	var reqStart = Date.now();
	var updatedWORes = updatedWOReq.execute();
	var reqEnd = Date.now();
	gs.print("TIME TO EXECUTE UPDATE QUERY: " + ((reqEnd - reqStart) / 1000) + "s");
	updatedWOBody = updatedWORes.getBody();
}
catch(ex){
	gs.error("ERROR RETRIEVING UPDATED WORKORDERS: " + ex);
}

var updatedWOparsed = parser.parse(updatedWOBody);
var queryArray = [];

for(var i=0;i<updatedWOparsed.value.length;i++){
	if(caseArray.indexOf(updatedWOparsed.value[i].Id.toString()) > -1){
		queryArray.push(updatedWOparsed.value[i].Id);
	}
}

if(queryArray.length > 0){
	var responseBody;
	try{
		var allWOReq = new sn_ws.RESTMessageV2('BV Create Work Orders', 'getAllWorkOrders');
		allWOReq.setStringParameter('idArray', queryArray.join('%2C'));
		allWOReq.setStringParameter('pageSize', queryArray.length.toString());

		var allReqStart = Date.now();
		var allWORes = allWOReq.execute();
		var allReqEnd = Date.now();
		gs.print("TIME TO COMPLETE ALL WO REQ: " + (allReqEnd - allReqStart)/1000 + "s");

		responseBody = allWORes.getBody();
		var httpStatus = allWORes.getStatusCode();
	}
	catch(ex){
		gs.error("ERROR RETRIEVING WORK ORDER UPDATES: " + ex);
	}

	parsed = parser.parse(responseBody);

	var stateMap = {
		'COMPLETED': 3,
		'IN PROGRESS': 19,
		'OPEN': 10,
		'[OPEN & REASSIGN]': 10,
		'OPEN/DECLINED': 10,
		'OPEN/PENDING DISPATH': 10,
		'OPEN/WORK AUTHORIZED': 10,
		'IN PROGRESS/DISPATCH CONFIRMED': 19,
		'IN PROGRESS/ON SITE': 19,
		'IN PROGRESS/PARTS ON ORDER': 19,
		'IN PROGRESS/PROPOSAL APPROVED': 19,
		'IN PROGRESS/SUBMITTED TO CLIENT': 19,
		'IN PROGRESS/UNSATISFACTORY': 19,
		'IN PROGRESS/WAITING FOR QUOTE': 19,
		'IN PROGRESS/WAITING FOR RETURN': 19,
		'IN PROGRESS/WAITING ON APPROVAL': 19,
		'COMPLETED/BILLED': 3,
		'COMPLETED/CANCELLED': 3,
		'COMPLETED/CONFIRMED': 3,
		'COMPLETED/NOT REPORTED BY SP': 3,
		'COMPLETED/PENDING CONFIRMATION': 3,
		'COMPLETED/READY FOR TRANSFER': 3,
		'COMPLETED/WO DECLINED BY CLIENT': 3
	};

	for(var i=0; i<parsed.length;i++){
		var updateNeccesary = false;

		var gra = new GlideRecord('sn_customerservice_case');
		gra.addQuery('u_service_channel_wo',parsed[i].Id.toString());
		gra.query();

		if(gra.next()){
			var scStatus = parsed[i].Status.Primary.toString();
			if(stateMap.hasOwnProperty(scStatus)){
				if(gra.getValue('state') != stateMap[scStatus]){
					updateNecessary = true;
					gra.setValue('state', stateMap[scStatus]);
				}
			}

			var notesAll = gra.work_notes.getJournalEntry(-1);
			var notes = notesAll.split("\n\n");
			for(var j=0;j<notes.length;j++){
				notes[j] = notes[j].split("\n")[1];
			}

			var noteResponse;
			if(notes.indexOf(parsed[i].Notes.Last.NoteData.toString()) == -1){
				try{
					var noteReq = new sn_ws.RESTMessageV2('BV Create Work Orders', 'GetWorkOrderNotes');
					noteReq.setStringParameter('workOrderId', parsed[i].Id.toString());

					var noteReqStart = Date.now();
					var noteRes = noteReq.execute();
					var noteReqEnd = Date.now();
					gs.print("TIME TO EXECUTE NOTE REQUEST: " + (noteReqEnd - noteReqStart)/1000 + "s");
					noteResponse = noteRes.getBody();
				}
				catch(ex){
					gs.error("ERROR RETRIEVING NOTES FOR SERVICECHANNEL WORK ORDER '" + parsed[i].Id + "': " + ex);
				}

				var notesParsed = parser.parse(noteResponse);
				var addNotes = [];

				for(var j=0;j<notesParsed.Notes.length;j++){
					if(notes.indexOf(notesParsed.Notes[j].NoteData.toString()) == -1 && addNotes.indexOf(notesParsed.Notes[j].NoteData.toString()) == -1){
						addNotes.push(notesParsed.Notes[j].NoteData.toString());
					}
				}

				if(addNotes.length > 0){
					for(var k=0;k<addNotes.length;k++){
						gs.print("ADDING NOTE '" + addNotes[k] + "' to WO '" + parsed[i].Id + "'");
						gra.work_notes = addNotes[k];
						gra.update();
					}
				}
			}

			if(updateNeccesary){
				gra.update();
			}
		}
	}
}
else {
	gs.info("No Cases found to update.");
}

var endTime = new Date().getTime();
gs.info("TIME TO RUN: " + ((endTime - startTime)/1000) + "s");
