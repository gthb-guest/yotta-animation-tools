(function () {

	include("/XDTS Assets/JSON.jsfl");

	function print(text) {
		fl.trace(text);
	}

	function padZeroes(number, maxLength) {
		var numberString = number.toString();
		var array = Array((maxLength + 1) - numberString.length)
		return array.join("0") + numberString;
	}

	function include(file) {
		var uri = fl.scriptURI.slice(0, fl.scriptURI.lastIndexOf("/"));
		fl.runScript(uri + file);
	}

	function removeFileSuffix(uri) {
		// If it has a period.
		if (uri.indexOf(".") !== -1) {
			return uri.slice(0, uri.lastIndexOf("."));
		} else return uri;
	}

	function generateParentURI(layer, uriArray) {
		if (!uriArray) uriArray = [];

		if (layer.parentLayer) {
			var parent = layer.parentLayer;
			uriArray.push(parent.name)
			generateParentURI(parent, uriArray);
		}

		if (uriArray.length == 0) return "";
		else return uriArray.reverse().join("/") + "/";

	}

	const XDTSFieldIDType = {
		cell: 0,
		dialogue: 3,
		cameraWork: 5
	}

	const XDTSFrameSymbol = {
		inbetween: "SYMBOL_TICK_1",
		reverse: "SYMBOL_TICK_2",
		empty: "SYMBOL_NULL_CELL",
		continueLast: "SYMBOL_HYPHEN"
	}

	function XDTSFrameData(symbol) {
		this.id = 0;
		this.values = [symbol];
	}

	function XDTSFrame(startFrame, symbol) {
		this.frame = startFrame;
		this.data = [];

		if (symbol) {
			var frameData = new XDTSFrameData(symbol);
			this.data.push(frameData);
		}
	}

	function XDTSTrack(trackNumber) {
		this.trackNo = trackNumber;
		this.frames = [];

		this.addFrame = function (startFrame, symbol) {
			var tempFrame = new XDTSFrame(startFrame, symbol);
			this.frames.push(tempFrame);
		}
	}

	function XDTSField(fieldIDType) {
		this.fieldId;
		this.tracks = [];
	}

	function XDTSTimeTableHeader(fieldIDType) {
		this.fieldId = fieldIDType;
		this.names = [];
	}

	function XDTSTimeTable(name, duration) {
		this.name = name;
		this.duration = duration;
		this.timeTableHeaders = [];
		this.fields = [];
	}

	function XDTS() {

		this.header = {
			scene: "1",
			cut: "1"
		}
		this.timeTables = [];
		this.version = 5;

		this.writeToFile = function (uri) {
			var fileContents = "exchangeDigitalTimeSheet Save Data\n" + JSON.stringify(this, null, " ");
			FLfile.write(uri, fileContents);
		}
	}

	function main() {

		// Check if there's a document open.
		var doc = fl.getDocumentDOM();
		if (!doc) {
			alert("Please open a document and try again.");
			return;
		}

		// Present dialogue.
		var xmlURI = fl.scriptURI.replace(fl.scriptURI.split("/").pop(), "XDTS Assets/XDTS Exporter.xml");
		var mainWindow = fl.xmlPanel(xmlURI);

		if (mainWindow.dismiss == "cancel") return;

		var shouldExportCels = mainWindow.exportCelsCheckbox == "true" ? true : false;
		var saveLocationURI = FLfile.platformPathToURI(mainWindow.exportURITextbox);
		var shouldExportHiddenLayers = mainWindow.exportVisibleCheckbox == "true" ? false : true;
		var shouldExportPNG = mainWindow.imageFormatMenu == "PNG" ? true : false;
		var shouldExportFolders = mainWindow.exportFoldersCheckbox == "true" ? true : false;
		var exportName = mainWindow.nameTextbox;
		var shouldExportLayersInFolders = mainWindow.exportLayerFoldersCheckbox == "true" ? true : false;

		// Get scene.
		var scene = doc.getTimeline();

		// Create the file.
		var xdts = new XDTS();
		xdts.header.scene = scene.name;

		// Create a time table.
		var timeTable = new XDTSTimeTable(scene.name, scene.frameCount);

		// Create the headers.
		var header = new XDTSTimeTableHeader(XDTSFieldIDType.cell);

		// Create the fields.
		var field = new XDTSField(XDTSFieldIDType.cell);

		// Check if the user only wants to export the visible layers.
		var visibleLayers = [];

		// Keep track of all of the visible layers
		for (var i = 0; i < scene.layerCount; i++) {
			var layer = scene.layers[i];
			if (layer.visible) visibleLayers.push(i);
		}

		// Create time tables.
		for (var i = 0; i < scene.layerCount; i++) {
			var layer = scene.layers[i];

			// Only export animation layers.
			if (layer.layerType != "normal") continue;

			// Check if it's a visible layer.
			if (shouldExportHiddenLayers == false) {
				var isVisible = false;
				for (var j = 0; j < visibleLayers.length; j++) {
					if (i == visibleLayers[j]) isVisible = true;
				}
				if (!isVisible) continue;
			}

			header.names.push(layer.name);

			// Create track
			var track = new XDTSTrack();

			// Get the frames.
			var frameCounter = 0;
			for (var j = 0; j < layer.frameCount; j++) {
				var frame = layer.frames[j];

				// Check to see if it's the first frame of the sequence.
				if (frame.startFrame == j) {

					// If it's empty, check if it has a label before assigning an empty symbol.
					if (frame.isEmpty) {

						// Check for a label first.
						if (frame.name) {
							switch (frame.name.toLowerCase()) {
								case "tween":
									track.addFrame(j, XDTSFrameSymbol.inbetween);
									break;
								case "reverse":
									track.addFrame(j, XDTSFrameSymbol.reverse);
									break;
							}
						} else {
							track.addFrame(j, XDTSFrameSymbol.empty);
						}
					} else {
						//track.addFrame(j, frameCounter.toString());
						track.addFrame(j, layer.name + "-" + padZeroes(frameCounter, 4));
						frameCounter++;
					}
				}
			}

			// Add the track.dd
			field.tracks.push(track);
		}

		// Add track index. Reverse order.
		header.names.reverse();
		field.tracks.reverse();
		var counter = field.tracks.length - 1;
		for (var i = 0; i < field.tracks.length; i++) {
			field.tracks[i].trackNo = i;
			counter--;
		}

		// Add the field and header in the time table.
		timeTable.timeTableHeaders.push(header);
		timeTable.fields.push(field);
		xdts.timeTables.push(timeTable);

		// Save.
		xdts.writeToFile(saveLocationURI + "/" + exportName + ".xdts")

		//==================================
		//	Export Cels
		//==================================

		if (!shouldExportCels) return;

		// Make all layers invisible.
		for (var i = 0; i < scene.layerCount; i++) scene.layers[i].visible = false;

		// Loop through the layers and export cels.
		for (var i = 0; i < scene.layerCount; i++) {
			var layer = scene.layers[i];

			// Check if it's a normal layer only.
			if (layer.layerType != "normal") continue;

			// Check if it's a visible layer.
			if (shouldExportHiddenLayers == false) {
				var isVisible = false;
				for (var j = 0; j < visibleLayers.length; j++) {
					if (i == visibleLayers[j]) isVisible = true;
				}
				if (!isVisible) continue;
			}

			// Create a URI for the main folder.
			var currentURI = saveLocationURI + "/" + exportName + "/"
			if (shouldExportFolders) currentURI += generateParentURI(layer);
		
			// Create a URI for the layer folder.
			if (shouldExportLayersInFolders) currentURI += layer.name + "/";
		
			// Create the folder.
			if (FLfile.exists(currentURI) != true) FLfile.createFolder(currentURI);

			// Make visible.
			layer.visible = true;

			// Export frames.
			var frameCount = 0;
			for (var j = 0; j < layer.frameCount; j++) {
				var frame = layer.frames[j];

				if (frame.isEmpty == false && frame.startFrame == j) {
					scene.currentFrame = j;

					var exportURI = currentURI + layer.name + "-" + padZeroes(frameCount, 4);

					if (shouldExportPNG) doc.exportPNG(exportURI + ".png", true, true);
					else doc.exportSVG(exportURI + ".svg", true, true);

					frameCount++;
				}
			}

			// Make invisible.
			layer.visible = false;
		}

		// Make layers visible again.
		for (var i = 0; i < visibleLayers.length; i++) {
			scene.layers[visibleLayers[i]].visible = true;
		}

	}

	main();
})()