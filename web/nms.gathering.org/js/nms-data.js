"use strict";

/**************************************************************************
 *                                                                        *
 * THIS IS WORK IN PROGRESS, NOT CURRENTLY USED!                          *
 *                                                                        *
 * It WILL eventually replace large chunks of nms.js. But we're not there *
 * yet.                                                                   *
 *                                                                        *
 **************************************************************************/


/*
 * This will obviously be moved
 */
var nmsCore = nmsCore || {
	stats: {
		assertErrors:0
	}
}

nmsCore.assert = function(cb) {
	if (!cb) {
		nmsCore.stats.assertErrors++;
		throw "Assertion failed";
	}
}

/*
 * This file/module/whatever is an attempt to gather all data collection in
 * one place.
 *
 * It is work in progress.
 *
 * The basic idea is to have all periodic data updates unified here, with
 * stats, tracking of "ajax overflows" and general-purpose error handling
 * and callbacks and whatnot, instead of all the custom stuff that we
 * started out with.
 *
 * Sources are identified by a name, which is then available in
 * nmsData[name] in full. A copy of the previous data set is kept in
 * nmsData.old[name]. You can use getNow / setNow() to append a 'now='
 * string.
 *
 * nmsData.data[name] - actual data
 * nmsData.registerSource() - add a source, will be polled periodicall
 * nmsData.updateSource() - issue a one-off update, outside of whatever
 * 			    periodic polling might take place
 */


var nmsData = nmsData || {
	old: {}, // Single copy of previous data. Automatically populated.
	stats: {
		identicalFetches:0,
		outstandingAjaxRequests:0,
		ajaxOverflow:0,
		pollClearsEmpty:0,
		pollClears:0,
		pollSets:0,
		newSource:0,
		oldSource:0
	},
	/*
	 * The last time stamp of any data received, regardless of source.
	 *
	 * Used as a fallback for blank now, but can also be used to check
	 * "freshness", I suppose.
	 */
	_last: undefined,
	_now: undefined,

	/*
	 * These are provided so we can introduce error checking when we
	 * have time.
	 * 
	 * now() represents the data, not the intent. That means that if
	 * you want to check if we are traveling in time you should not
	 * check nmsData.now. That will always return a value as long as
	 * we've had a single piece of data.
	 */
	get now() { return this._now || this._last; },
	set now(val) {
		if (val == undefined) {
			this._now = undefined;
		}
		// FIXME: Check if now is valid syntax.
		this._now = now;
	},
	/*
	 * List of sources, name, handler, etc
	 */
	_sources: {},

	/*
	 * Maximum number of AJAX requests in transit before we start
	 * skipping updates.
	 */
	_ajaxThreshold: 5
};


nmsData._dropData = function (name) {
	nmsCore.assert(name);
	nmsCore.assert(this[name]);
	delete this[name];
	delete this.old[name];
}

nmsData.removeSource = function (name) {
	if (this._sources[name] == undefined) {
		this.stats.pollClearsEmpty++;
		return true;
	}
	if (this._sources[name]['handle']) {
		this.stats.pollClears++;
		clearInterval(this._sources[name]['handle']);
	}
	delete this._sources[name];
}

/*
 * Register a source.
 *
 * name: "Local" name. Maps to nmsData[name]
 * target: URL of the source
 * cb: Optional callback
 * cbdata: Optional callback data
 *
 * This can be called multiple times to add multiple handlers. There's no
 * guarantee that they will be run in order, but right now they do.
 *
 * Update frequency _might_ be adaptive eventually, but since we only
 * execute callbacks on change and backend sends cache headers, the browser
 * will not issue actual HTTP requests.
 *
 * FIXME: Should be unified with nmsTimers() somehow.
 */
nmsData.registerSource = function(name, target, cb, cbdata) {
	var cbob = {
		name: name,
		cb: cb,
		cbdata: cbdata
	};
	if (this._sources[name] == undefined) {
		this._sources[name] = { target: target, cbs: [] };
		this._sources[name]['handle'] = setInterval(function(){nmsData.updateSource(name)}, 1000);
		this.stats.newSource++;
	} else {
		this.stats.oldSource++;
	}
	this._sources[name].cbs.push(cbob);

	this.stats.pollSets++;
}

/*
 * Updates a source.
 *
 * Called on interval, but can also be used to update a source after a
 * known action that updates the underlying data (e.g: update comments
 * after a comment is posted).
 */
nmsData.updateSource = function(name) {
	this._genericUpdater(name);
}

/*
 * Reset a source, deleting all data, including old.
 *
 * Useful if traveling in time, for example.
 */
nmsData.resetSource = function(name) {
	this[name] = {};
	this.old[name] = {};
	this.updateSource(name);
}

/*
 * Updates nmsData[name] and nmsData.old[name], issuing any callbacks where
 * relevant.
 *
 * Do not use this directly. Use updateSource().
 *
 */
nmsData._genericUpdater = function(name) {
	if (this.stats.outstandingAjaxRequests++ > this._ajaxThreshold) {
		this.stats.outstandingAjaxRequests--;
		this.stats.ajaxOverflow++;
		return;
	}
	this.stats.outstandingAjaxRequests++;
	var now = "";
	if (this._now != undefined)
		now = "now=" + this._now;
	if (now != "") {
		if (this._sources[name].target.match("\\?"))
			now = "&" + now;
		else
			now = "?" + now;
	}
	$.ajax({
		type: "GET",
		url: this._sources[name].target + now,
		dataType: "json",
		success: function (data, textStatus, jqXHR) {
			nmsData._last = data['time'];
			if (nmsData[name] == undefined ||  nmsData[name]['hash'] != data['hash']) {
				nmsData.old[name] = nmsData[name];
				nmsData[name] = data;
				for (var i in nmsData._sources[name].cbs) {
					var tmp = nmsData._sources[name].cbs[i];
					tmp.cb(tmp.cbdata);
				}
			} else {
				nmsData.stats.identicalFetches++;
			}
		},
		complete: function(jqXHR, textStatus) {
			nmsData.stats.outstandingAjaxRequests--;
		}
	});
};
