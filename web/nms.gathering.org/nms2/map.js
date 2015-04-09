var nms = {
	updater:undefined, // Active updater
	switches_now:undefined, // Most recent data
	switches_then:undefined, // 2 minutes old
	speed:0, // Current aggregated speed
	full_speed:false, // Set to 'true' to include ALL interfaces
	ping_data:undefined,
	globalmap:[], // DOM objects for switches
	drawn:false, // Set to 'true' when switches are drawn
	switch_showing:"",
	night:false,
	did_update:false // Set to 'true' after we've done some basic updating
};

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var fontSize = 12;
var fontFace = "Arial Black";
var nightMode = false;
var nightBlur = {};
var orig = {
	width:1920,
	height:1032
	};

var canvas = { 
	width:0,
	height:0,
	scale:1
};
var margin = {
	x:10,
	y:20,
	text:3
};


/*
 * Handlers. "updater" is run periodically when the handler is active, and
 * "init" is run once when it's activated.
 */

var handler_uplinks = {
	updater:uplinkUpdater,
	init:uplinkInit,
	name:"Uplink map"
};

var handler_temp = {
	updater:tempUpdater,
	init:tempInit,
	name:"Temperature map"
};

var handler_ping = {
	updater:pingUpdater,
	init:pingInit,
	name:"IPv4 Ping map"
};

var handler_traffic = {
	updater:trafficUpdater,
	init:trafficInit,
	name:"Uplink traffic map"
};

var handler_disco = {
	updater:randomizeColors,
	init:discoInit,
	name:"Disco fever"
};

function byteCount(bytes) {
	var units = ['', 'K', 'M', 'G', 'T', 'P'];
	i = 0;
	while (bytes > 1024) {
		bytes = bytes / 1024;
		i++;
	}
	return bytes.toFixed(1) + units[i];
}

function toggleNightMode() {
	setNightMode(!nightMode);
	/*
	var bg = "white";
	var filter = "invert(0%)";
	if (!nms.night) {
		bg = "black";
		filter = "invert(100%)";
		nms.night = true;
	} else {
		nms.night = false;
	}
	var body = document.getElementById("body");
	body.style.background = bg;
	var img = document.getElementById("map");
	img.style.webkitFilter = filter;
	*/
}

/*
 * Hide switch info-box
 */
function hideSwitch()
{
		var swtop = document.getElementById("info-switch-parent");
		var switchele = document.getElementById("info-switch-table");
		if (switchele != undefined)
			swtop.removeChild(switchele);
		nms.switch_showing = "";

}
/*
 * Display info on switch "x" in the info-box
 */
function switchInfo(x)
{
		var switchele = document.getElementById("info-switch-table");
		var sw = nms.switches_now["switches"][x];
		var swtop = document.getElementById("info-switch-parent");
		var tr;
		var td1;
		var td2;
	
		if (nms.switch_showing == x) {
			hideSwitch();	
			return;
		} else {
			hideSwitch();	
			nms.switch_showing = x;
		}
		switchele = document.createElement("table");
		switchele.id = "info-switch-table";
		switchele.style.zIndex =  100;
		switchele.className = "table table-bordered";
			
		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Sysname";
		td2.innerHTML = x + '<button type="button" style="float: right" onclick="hideSwitch();">X</button>';
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		var speed = 0;
		var speed2 = 0;
		for (port in nms.switches_now["switches"][x]["ports"]) {
			if (nms.switches_now["switches"][x]["ports"] == undefined ||
			    nms.switches_then["switches"][x]["ports"] == undefined) {
				continue;
			}
			if (/ge-0\/0\/44$/.exec(port) ||
			    /ge-0\/0\/45$/.exec(port) ||
			    /ge-0\/0\/46$/.exec(port) ||
			    /ge-0\/0\/47$/.exec(port))
			 {
				 var t = nms.switches_then["switches"][x]["ports"][port];
				 var n = nms.switches_now["switches"][x]["ports"][port];
				 speed += (parseInt(t["ifhcoutoctets"]) - parseInt(n["ifhcoutoctets"])) / (parseInt(t["time"] - n["time"]));
				 speed2 += (parseInt(t["ifhcinoctets"]) - parseInt(n["ifhcinoctets"])) / (parseInt(t["time"] - n["time"]));
			 }
		}

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Uplink speed (out , port 44,45,46,47)";
		td2.innerHTML = byteCount(8 * speed) + "b/s";
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Uplink speed (in , port 44,45,46,47)";
		td2.innerHTML = byteCount(8 * speed2) + "b/s";
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		speed = 0;
		for (port in nms.switches_now["switches"][x]["ports"]) {
			if (nms.switches_now["switches"][x]["ports"] == undefined ||
			    nms.switches_then["switches"][x]["ports"] == undefined) {
				continue;
			}
			 var t = nms.switches_then["switches"][x]["ports"][port];
			 var n = nms.switches_now["switches"][x]["ports"][port];
			 speed += (parseInt(t["ifhcinoctets"]) -parseInt(n["ifhcinoctets"])) / (parseInt(t["time"] - n["time"]));
		}

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Total speed (in)";
		td2.innerHTML = byteCount(8 * speed) + "b/s";
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		speed = 0;
		for (port in nms.switches_now["switches"][x]["ports"]) {
			if (nms.switches_now["switches"][x]["ports"] == undefined ||
			    nms.switches_then["switches"][x]["ports"] == undefined) {
				continue;
			}
			 var t = nms.switches_then["switches"][x]["ports"][port];
			 var n = nms.switches_now["switches"][x]["ports"][port];
			 speed += (parseInt(t["ifhcoutoctets"]) -parseInt(n["ifhcoutoctets"])) / (parseInt(t["time"] - n["time"]));
		}

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Total speed (out)";
		td2.innerHTML = byteCount(8 * speed) + "b/s";
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Management IP";
		td2.innerHTML = sw["management"]["ip"];
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Latency";
		if (nms.ping_data && nms.ping_data["switches"] && nms.ping_data["switches"][x]) {
			td2.innerHTML = nms.ping_data["switches"][x]["latency"];
		} else {
			td2.innerHTML = "N/A";
		}
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Temperature";
		td2.innerHTML = sw["temp"];
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Temperature age";
		td2.innerHTML = sw["temp_time"];
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Type";
		td2.innerHTML = sw["switchtype"];
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Last Updated";
		td2.innerHTML = sw["management"]["last_updated"];
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);

		tr = document.createElement("tr"); td1 = document.createElement("td"); td2 = document.createElement("td");
		td1.innerHTML = "Poll frequency";
		td2.innerHTML = sw["management"]["poll_frequency"];
		tr.appendChild(td1); tr.appendChild(td2); switchele.appendChild(tr);


		swtop.appendChild(switchele);
}

/*
 * Update various info elements periodically.
 */
function updateInfo()
{
	if (!nms.drawn && nms.switches_now != undefined) {
		drawSwitches();
	}
	var speedele = document.getElementById("speed");
	speedele.innerHTML = (8 * parseInt(nms.speed) / 1024 / 1024 / 1024 ).toPrecision(5) + " Gbit/s";
}

/*
 * Update function for uplink map
 * Run periodically when uplink map is active.
 */
function uplinkUpdater()
{
	if (!nms.switches_now["switches"])
		return;
	for (sw in nms.switches_now["switches"]) {
		var uplinks=0;
		for (port in nms.switches_now["switches"][sw]["ports"]) {
			if (!nms.switches_then["switches"][sw]["ports"] || 
			    !nms.switches_now["switches"][sw]["ports"])
				continue;
			if (/ge-0\/0\/44$/.exec(port) ||
			    /ge-0\/0\/45$/.exec(port) ||
			    /ge-0\/0\/46$/.exec(port) ||
			    /ge-0\/0\/47$/.exec(port))
			 {
				 if (parseInt(nms.switches_then["switches"][sw]["ports"][port]["ifhcoutoctets"]) != parseInt(nms.switches_now["switches"][sw]["ports"][port]["ifhcoutoctets"])) {
					 uplinks += 1;
				 }
			 }
		}
		if (uplinks == 0) {
			setSwitchColor(sw,"blue");
		} else if (uplinks == 1) {
			setSwitchColor(sw,"red");
		} else if (uplinks == 2) {
			setSwitchColor(sw, "yellow");
		} else if (uplinks == 3) { 
			setSwitchColor(sw, "green");
		} else if (uplinks > 3) {
			setSwitchColor(sw, "white");
		}
	}
}

/*
 * Init-function for uplink map
 */
function trafficInit()
{
	setLegend(1,"blue","0 uplink utilization");	
	setLegend(5,"red", "1000Mb/s or more uplink utilization");	
	setLegend(4,"yellow","100Mb/s to 800Mb/s uplink utilization");	
	setLegend(3,"green", "5Mb/s to 100Mb/s uplink utilization");	
	setLegend(2,"white","0 to 5Mb/s uplink utilization");	
}

function trafficUpdater()
{
	if (!nms.switches_now["switches"])
		return;
	for (sw in nms.switches_now["switches"]) {
		var speed = 0;
		for (port in nms.switches_now["switches"][sw]["ports"]) {
			if (/ge-0\/0\/44$/.exec(port) ||
			    /ge-0\/0\/45$/.exec(port) ||
			    /ge-0\/0\/46$/.exec(port) ||
			    /ge-0\/0\/47$/.exec(port))
			 {
				 var t = nms.switches_then["switches"][sw]["ports"][port];
				 var n = nms.switches_now["switches"][sw]["ports"][port];
				 speed += (parseInt(t["ifhcoutoctets"]) -parseInt(n["ifhcoutoctets"])) / (parseInt(t["time"] - n["time"]));
				 speed += (parseInt(t["ifhcinoctets"]) -parseInt(n["ifhcinoctets"])) / (parseInt(t["time"] - n["time"]));
			 }
		}
		var m = 1024 * 1024 / 8;
		if (speed == 0) {
			setSwitchColor(sw,"blue");
		} else if (speed > (1000 * m)) {
			setSwitchColor(sw,"red");
		} else if (speed > (800 * m)) {
			setSwitchColor(sw, "yellow");
		} else if (speed > (5 * m)) { 
			setSwitchColor(sw, "green");
		} else {
			setSwitchColor(sw, "white");
		}
	}
}

/*
 * Init-function for uplink map
 */
function uplinkInit()
{
	setLegend(1,"blue","0 uplinks");	
	setLegend(2,"red","1 uplink");	
	setLegend(3,"yellow","2 uplinks");	
	setLegend(4,"green","3 uplinks");	
	setLegend(5,"white","4 uplinks");	
}

function rgb_from_max(x)
{
	x = x/100;
	var colorred = 255 * x;
	var colorblue = 255 - colorred;

	return 'rgb(' + Math.round(colorred) + ", 0, " + Math.round(colorblue) + ')';
}

function temp_color(t)
{
	t = Math.round((t / 60) * 100);
	return rgb_from_max(t);
}

/*
 * There are 4 legend-bars. This is a helper-function to set the color and
 * description/name for each one. Used from handler init-functions.
 */
function setLegend(x,color,name)
{
	var el = document.getElementById("legend-" + x);
	el.style.background = color;
	el.innerHTML = name;
}

function tempUpdater()
{
	for (sw in nms.switches_now["switches"]) {
		var t = nms.switches_now["switches"][sw]["temp"];
		
		setSwitchColor(sw, temp_color(t));
	}
}

function tempInit()
{
	setLegend(1,temp_color(10),"10 °C");	
	setLegend(2,temp_color(20),"20 °C");	
	setLegend(3,temp_color(30),"30 °C");	
	setLegend(4,temp_color(40),"40 °C");	
	setLegend(5,temp_color(50),"50 °C");	
}

function gradient_from_latency(latency_ms, latency_secondary_ms)
{
	if (latency_secondary_ms === undefined) {
		return rgb_from_latency(latency_ms);
	}
	return 'linear-gradient(' +
		rgb_from_latency(latency_ms) + ', ' +
		rgb_from_latency(latency_secondary_ms) + ')';
}

function rgb_from_latency(latency_ms)
{
	if (latency_ms === null || latency_ms === undefined) {
		return '#0000ff';
	}

	var l = latency_ms / 40.0;
	if (l >= 2.0) {
		return 'rgb(255, 0, 0)';
	} else if (l >= 1.0) {
		l = 2.0 - l;
		l = Math.pow(l, 1.0/2.2);
		l = Math.round(l * 255.0);
		return 'rgb(255, ' + l + ', 0)';
	} else {
		l = Math.pow(l, 1.0/2.2);
		l = Math.round(l * 255.0);
		return 'rgb(' + l + ', 255, 0)';
	}
}

function pingUpdater()
{
	for (var sw in nms.ping_data["switches"]) {
		setSwitchColor(sw, gradient_from_latency(nms.ping_data["switches"][sw]["latency"]));
	}
}

function pingInit()
{
	setLegend(1,gradient_from_latency(1),"1ms");	
	setLegend(2,gradient_from_latency(30),"30ms");	
	setLegend(3,gradient_from_latency(60),"60ms");	
	setLegend(4,gradient_from_latency(80),"80ms");	
	setLegend(5,"#0000ff" ,"No response");	
}

/*
 * Run periodically to trigger map updates when a handler is active
 */
function updateMap()
{
	if (nms.updater != undefined) {
		nms.updater();
	}
}

/*
 * Change map handler (e.g., change from uplink map to ping map)
 */
function setUpdater(fo)
{
	nms.updater = undefined;
	resetColors();
	fo.init();
	nms.updater = fo.updater;
	var foo = document.getElementById("updater_name");
	foo.innerHTML = fo.name + "   ";
	initialUpdate();
	if (nms.ping_data && nms.switches_then && nms.switches_now) {
		nms.updater();
	}
}


/*
 * Convenience function to avoid waiting for pollers when data is available
 * for the first time.
 */
function initialUpdate()
{
	if (nms.ping_data && nms.switches_then && nms.switches_now && nms.updater != undefined && nms.did_update == false ) {
		resizeEvent();
		if (!nms.drawn) {
			drawSwitches();
		}
		nms.updater();
		nms.did_update = true;
	}
}

/*
 * Update nms.ping_data 
 */
function updatePing()
{
	$.ajax({
		type: "GET",
		url: "/ping-json2.pl",
		dataType: "text",
		success: function (data, textStatus, jqXHR) {
			nms.ping_data = JSON.parse(data);
			initialUpdate();
		}
	});
}

/*
 * Update nms.switches_now and nms.switches_then
 */
function updatePorts()
{
	$.ajax({
		type: "GET",
		url: "/port-state.pl",
		dataType: "text",
		success: function (data, textStatus, jqXHR) {
			var  switchdata = JSON.parse(data);
			nms.switches_now = switchdata;
			parseIntPlacements();
			initialUpdate();
		}
	});
	$.ajax({
		type: "GET",
		url: "/port-state.pl?time=5m",
		dataType: "text",
		success: function (data, textStatus, jqXHR) {
			var  switchdata = JSON.parse(data);
			nms.switches_then = switchdata;
			initialUpdate();
		}
	})
}

/*
 * Use nms.switches_now and nms.switches_then to update 'nms.speed'.
 *
 * nms.speed is a total of ifHCInOctets across all interfaces.
 *
 * if nms.full_speed is true: Include ALL interfaces
 * if nms.full_speed is false: Include only e* switches and exclude
 * uplinks.
 */
function updateSpeed()
{
	var speed_in = parseInt(0);
	var speed_kant = parseInt(0);
	var counter=0;
	var sw;
	for (sw in nms.switches_now["switches"]) {
		for (port in nms.switches_now["switches"][sw]["ports"]) {
			if (!nms.switches_now["switches"][sw]["ports"][port]) {
				console.log("ops");
				continue;
			}
			if (!nms.switches_then || !nms.switches_then["switches"] || !nms.switches_then["switches"][sw] || !nms.switches_then["switches"][sw]["ports"]) {
				continue;
			}
			if (!nms.switches_now || !nms.switches_now["switches"] || !nms.switches_now["switches"][sw] || !nms.switches_now["switches"][sw]["ports"]) {
				continue;
			}

			if (!nms.switches_then["switches"][sw]["ports"][port]) {
				console.log("ops");
				continue;
			}
			var diff = parseInt(parseInt(nms.switches_now["switches"][sw]["ports"][port]["time"]) - parseInt(nms.switches_then["switches"][sw]["ports"][port]["time"]));
			var then = parseInt(nms.switches_then["switches"][sw]["ports"][port]["ifhcinoctets"])  ;
			var now =  parseInt(nms.switches_now["switches"][sw]["ports"][port]["ifhcinoctets"]) ;
			var diffval = (now - then);
			if (then == 0 || now == 0 || diffval == 0 || diffval == NaN) {
				continue;
			}
			if (nms.full_speed || (( /e\d-\d/.exec(sw) || /e\d\d-\d/.exec(sw)) &&  ( /ge-\d\/\d\/\d$/.exec(port) || /ge-\d\/\d\/\d\d$/.exec(port)))) {
				if (nms.full_speed || !(
					/ge-0\/0\/44$/.exec(port) ||
					/ge-0\/0\/45$/.exec(port) ||
					/ge-0\/0\/46$/.exec(port) ||
					/ge-0\/0\/47$/.exec(port))) {
					speed_in += parseInt(diffval/diff) ;
					counter++;
				}
			}
			//speed_in += parseInt(diffval/diff) / 1024 ;
		}
	}
	nms.speed = speed_in;
}

/*
 * Draw a linknet with index i.
 *
 * XXX: Might have to change the index here to match backend
 */
function drawLinknet(i)
{
	var c1 = nms.switches_now.linknets[i].c1 ? nms.switches_now.linknets[i].c1 : "blue";
	var c2 = nms.switches_now.linknets[i].c2 ? nms.switches_now.linknets[i].c2 : "blue";
	if (nms.switches_now.switches[nms.switches_now.linknets[i].sysname1] && nms.switches_now.switches[nms.switches_now.linknets[i].sysname2]) {
		connectSwitches(nms.switches_now.linknets[i].sysname1,nms.switches_now.linknets[i].sysname2, c1, c2);
	}
}

/*
 * Draw all linknets
 */
function drawLinknets()
{
	if (nms.switches_now && nms.switches_now.linknets) {
	for (var i in nms.switches_now.linknets) {
		drawLinknet(i);
	}
	}
}

/*
 * Change both colors of a linknet.
 *
 * XXX: Probably have to change this to better match the backend data
 */
function setLinknetColors(i,c1,c2)
{
	nms.switches_now.linknets[i].c1 = c1;
	nms.switches_now.linknets[i].c2 = c2;
}

/*
 * (Re)draw a switch 'sw'.
 *
 * Color defaults to 'blue' if it's not set in the data structure.
 */
function drawSwitch(sw)
{
		var box = nms.switches_now['switches'][sw]['placement'];
		var color = nms.switches_now['switches'][sw]['color'];
		if (color == undefined) {
			color = "blue";
		}
		ctx.fillStyle = color;
		if (nightMode && nightBlur[sw] != true) {
			ctx.shadowBlur = 10;
			ctx.shadowColor = "#00EE00";
			nightBlur[sw] = true;
		} else {
			ctx.shadowBlur = 0;
			ctx.shadowColor = "#000000";
		}
		drawBox(box['x'],box['y'],box['width'],box['height']);
		ctx.shadowBlur = 0;
		if ((box['width'] + 10 )< box['height'] )
			drawSideways(sw,box['x'],box['y'],box['width'],box['height']);
		else
			drawRegular(sw,box['x'],box['y'],box['width'],box['height']);
}

/*
 * Make sure all placements of switches are parsed as integers so we don't
 * have to pollute the code with pasreInt() every time we use it.
 */
function parseIntPlacements() {
	for (var sw in nms.switches_now.switches) {
		nms.switches_now.switches[sw]['placement']['x'] =
			parseInt(nms.switches_now.switches[sw]['placement']['x']);
		nms.switches_now.switches[sw]['placement']['y'] =
			parseInt(nms.switches_now.switches[sw]['placement']['y']);
		nms.switches_now.switches[sw]['placement']['width'] =
			parseInt(nms.switches_now.switches[sw]['placement']['width']);
		nms.switches_now.switches[sw]['placement']['height'] =
			parseInt(nms.switches_now.switches[sw]['placement']['height']);
	}
}

/*
 * Draw all switches
 */
function drawSwitches()
{
	if (!nms.switches_now || !nms.switches_now.switches)
		return;
	for (var sw in nms.switches_now.switches) {
		drawSwitch(sw);
	}
	nms.drawn = true;
}

/*
 * Draw foreground/scene.
 *
 * This is used so linknets are drawn before switches. If a switch is all
 * that has changed, we just need to re-draw that, but linknets require
 * scene-redrawing.
 */
function drawScene()
{
	ctx.font = Math.round(fontSize * canvas.scale) + "px " + fontFace;
	drawLinknets();
	drawSwitches();
}

/*
 * Set the scale factor and (re)draw the scene and background.
 * Uses canvas.scale and updates canvas.height and canvas.width.
 */
function setScale()
{
	c.height = canvas.height =  orig.height * canvas.scale ;
	c.width = canvas.width = orig.width * canvas.scale ;
	drawBG();
	nightBlur = {};
	drawScene();
	document.getElementById("scaler").value = canvas.scale;
	document.getElementById("scaler-text").innerHTML = (parseFloat(canvas.scale)).toPrecision(3);
}

/*
 * Returns true if the coordinates (x,y) is inside the box defined by
 * box.{x,y,w.h} (e.g.: placement of a switch).
 */
function isin(box, x, y)
{
	if ((x >= box.x) && (x <= (box.x + box.width)) && (y >= box.y) && (y <= (box.y + box.height))) {
		return true;
	}
	return false;

}

/*
 * Return the name of the switch found at coordinates (x,y), or 'undefined'
 * if none is found.
 */
function findSwitch(x,y) {
	x = parseInt(parseInt(x) / canvas.scale);
	y = parseInt(parseInt(y) / canvas.scale);

	for (var v in nms.switches_now.switches) {
		if(isin(nms.switches_now.switches[v]['placement'],x,y)) {
			return v;
		}
	}
	return undefined;
}

/*
 * Set switch color of 'sw' to 'c', then re-draw the switch.
 */
function setSwitchColor(sw, c)
{
	if(nms.switches_now.switches[sw]['color'] != c) {
		nms.switches_now.switches[sw]['color'] = c;
		drawSwitch(sw);
	}
}

/*
 * Return a random-ish color (for testing)
 */
function getRandomColor()
{
	var i = Math.round(Math.random() * 5);
	var colors = [ "white", "red", "pink", "yellow", "orange", "green" ];
	return colors[i];	
}

/*
 * Helper functions for the front-end testing.
 */
function hideBorder()
{
	c.style.border = "";
}

function showBorder()
{
	c.style.border = "1px solid #000000";
}

/*
 * Event handler for the front-end drag bar to change scale
 */
function scaleChange()
{
	var scaler = document.getElementById("scaler").value;
	canvas.scale = scaler;
	setScale();
}

/*
 * Draw a "cross hair" at/around (x,y).
 *
 * Used for testing.
 */
function crossHair(x,y)
{
	ctx.fillStyle = "yellow";
	ctx.fillRect(x,y,-100,10);
	ctx.fillStyle = "red";
	ctx.fillRect(x,y,100,10);
	ctx.fillStyle = "blue";
	ctx.fillRect(x,y,10,-100);
	ctx.fillStyle = "green";
	ctx.fillRect(x,y,10,100);
}

/*
 * Called when a switch is clicked
 */
function switchClick(sw)
{
	switchInfo(sw);
}

/*
 * Testing-function to randomize colors of linknets and switches
 */
function randomizeColors()
{
	for (var i in nms.switches_now.linknets) {
		setLinknetColors(i, getRandomColor(), getRandomColor());
	}
	drawLinknets();
	for (var sw in nms.switches_now.switches) {
		setSwitchColor(sw, getRandomColor());
	}
}

function discoInit()
{
	setNightMode(true);
	setLegend(1,"blue","0");	
	setLegend(5,"red", "1");
	setLegend(4,"yellow","2");
	setLegend(3,"green", "3");
	setLegend(2,"white","4");
}
/*
 * Resets the colors of linknets and switches.
 *
 * Useful when mode changes so we don't re-use colors from previous modes
 * due to lack of data or bugs.
 */
function resetColors()
{
	if (!nms.switches_now)
		return;
	if (nms.switches_now.linknets) {
		for (var i in nms.switches_now.linknets) {
			setLinknetColors(i, "blue","blue");
		}
		drawLinknets();
	}
	for (var sw in nms.switches_now.switches) {
		setSwitchColor(sw, "blue");
	}
}

/*
 * onclick handler for the canvas
 */
function canvasClick(e)
{
	var sw = findSwitch(e.pageX - e.target.offsetLeft, e.pageY - e.target.offsetTop);
	if (sw != undefined) {
		switchClick(sw);
	}
}

/*
 * Resize event-handler.
 *
 * Recomputes the scale and applies it.
 *
 * Has to use c.offset* since we are just scaling the canvas, not
 * everything else.
 *
 */
function resizeEvent()
{
	var width = window.innerWidth - c.offsetLeft;
	var height = window.innerHeight - c.offsetTop;
	if (width / (orig.width + margin.x) > height  /  (orig.height + margin.y)) {
		canvas.scale = height / (orig.height + margin.y);
	} else {
		canvas.scale = width / (orig.width + margin.x);
	}
	setScale();
}

/*
 * Draws the background image (scaled).
 */
function drawBG()
{
	var image = document.getElementById('source');
	image.style.webkitFilter = "invert(100%)";
	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	if (nightMode) {
		invertCanvas();
	}
}

function setNightMode(toggle) {
	nightMode = toggle;
	var body = document.getElementById("body");
	body.style.background = toggle ? "black" : "white";
	body.style.color = toggle ? "#00FF00" : "black";
	setScale();
}
/*
 * Draw a box (e.g.: switch).
 */
function drawBox(x,y,boxw,boxh)
{
	var myX = Math.round(x * canvas.scale);
	var myY = Math.round(y * canvas.scale);
	var myX2 = Math.round((boxw) * canvas.scale);
	var myY2 = Math.round((boxh) * canvas.scale);
	ctx.fillRect(myX,myY, myX2, myY2);
	ctx.lineWidth = Math.round(0.5 * canvas.scale);
	if (canvas.scale < 1.0) {
		ctx.lineWidth = 0.5;
	}
	ctx.strokeStyle = "#000000";
	ctx.strokeRect(myX,myY, myX2, myY2);
}

/*
 * Draw text on a box - sideways!
 *
 * XXX: This is pretty nasty and should also probably take a box as input.
 */
function drawSideways(text,x,y,w,h)
{
	ctx.rotate(Math.PI * 3 / 2);
	ctx.fillStyle = "white";
	ctx.strokeStyle = "black";
	ctx.lineWidth = Math.round(1 * canvas.scale);
	if (canvas.scale < 0.7) {
		ctx.lineWidth = 0.5;
	}
	ctx.fillText(text, - canvas.scale * (y + h - margin.text),canvas.scale * (x + w - margin.text) );
	ctx.strokeText(text, - canvas.scale * (y + h - margin.text),canvas.scale * (x + w - margin.text) );

	ctx.rotate(Math.PI / 2);
}

/*
 * Draw background inverted (wooo)
 *
 * XXX: This is broken for chromium on local file system (e.g.: file:///)
 * Seems like a chromium bug?
 */
function invertCanvas() {
	var canvas = document.getElementById('myCanvas');
	var context = canvas.getContext('2d');
	var canvas2 = document.getElementById('mySecretCanvas');
	var context2 = canvas.getContext('2d');

	var imageObj = document.getElementById('source');
	context2.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

	var imageData = context2.getImageData(0, 0, canvas.width, canvas.height);
	var data = imageData.data;

	for(var i = 0; i < data.length; i += 4) {
		data[i] = 255 - data[i];
		data[i + 1] = 255 - data[i + 1];
		data[i + 2] = 255 - data[i + 2];
	}
	context.putImageData(imageData, 0, 0);
}

/*
 * Draw regular text on a box.
 *
 * Should take the same format as drawSideways()
 *
 * XXX: Both should be renamed to have 'text' or something in them
 */
function drawRegular(text,x,y,w,h) {

	ctx.fillStyle = "white";
	ctx.strokeStyle = "black";
	ctx.lineWidth = Math.round(1 * canvas.scale);
	if (canvas.scale < 0.7) {
		ctx.lineWidth = 0.5;
	}
	ctx.fillText(text, (x + margin.text) * canvas.scale, (y + h - margin.text) * canvas.scale);
	ctx.strokeText(text, (x + margin.text) * canvas.scale, (y + h - margin.text) * canvas.scale);
}

/*
 * Draw a line between switch "insw1" and "insw2", using a gradiant going
 * from color1 to color2.
 *
 * XXX: beginPath() and closePath() is needed to avoid re-using the
 * gradient/color 
 */
function connectSwitches(insw1, insw2,color1, color2) {
	var sw1 = nms.switches_now.switches[insw1].placement;
	var sw2 = nms.switches_now.switches[insw2].placement;
	if (color1 == undefined)
		color1 = "blue";
	if (color2 == undefined)
		color2 = "blue";
	var x0 = Math.round((sw1.x + sw1.width/2) * canvas.scale);
	var y0 = Math.round((sw1.y + sw1.height/2) * canvas.scale);
	var x1 = Math.round((sw2.x + sw2.width/2) * canvas.scale);
	var y1 = Math.round((sw2.y + sw2.height/2) * canvas.scale);
	var gradient = ctx.createLinearGradient(x1,y1,x0,y0);
	gradient.addColorStop(0, color1);
	gradient.addColorStop(1, color2);
	ctx.beginPath();
	ctx.strokeStyle = gradient;
	ctx.moveTo(x0,y0);
	ctx.lineTo(x1,y1); 
	ctx.lineWidth = Math.round(2 * canvas.scale);
	ctx.closePath();
	ctx.stroke();
	ctx.moveTo(0,0);
}

function debugIt(e)
{
	console.log("Debug triggered");
	console.log(e);
}

window.addEventListener('resize',resizeEvent,true);
document.addEventListener('load',resizeEvent,true);

