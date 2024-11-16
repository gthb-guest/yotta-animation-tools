(function () {

	include("/XDTS Assets/JSON.jsfl");

	function print(text) {
		fl.trace(text);
	}

	function include(file) {
		var uri = fl.scriptURI.slice(0, fl.scriptURI.lastIndexOf("/"));
		fl.runScript(uri + file);
	}

	function searchForLayerInFolder(name, uri, areFramesInFolders) {
		var folders = FLfile.listFolder(uri, "directories");
		
		// If no further folders are found, check if the frames are not in a folder.
		if (!areFramesInFolders) {
			
			var files = FLfile.listFolder(uri, "files");
			
			for (var i=0; i<files.length; i++) {
				var file = files[i];
				
				if (file.match(name)) {
					return uri;
				}
			}
		}

		for (var i = 0; i < folders.length; i++) {
			var folderName = folders[i];
			var newURI = uri + "/" + folderName;
			
			if (folderName == name) return newURI;
			else {
				var result = searchForLayerInFolder(name, newURI, areFramesInFolders);
				if (result) return result;
			}
		}
	}

	function main() {
		
		// Present dialogue.
		var xmlURI = fl.scriptURI.replace(fl.scriptURI.split("/").pop(), "XDTS Assets/XDTS Importer.xml");
		var mainWindow = fl.xmlPanel(xmlURI);

		if (mainWindow.dismiss == "cancel") return;

		// Read data.
		var xdtsString = FLfile.read(FLfile.platformPathToURI(mainWindow.xdtsURITextbox));
		var assetFolderURI = FLfile.platformPathToURI(mainWindow.assetURITextbox);
		var fps = Number(mainWindow.fpsTextbox);
		var shouldImportFolderStructure = mainWindow.importFolderStructureCheckbox == "true" ? true : false;
		var areFramesInLayerFolders = mainWindow.framesAreInLayerFoldersCheckbox == "true" ? true : false;

		// Remove the first line.
		var xdts = JSON.parse(xdtsString.slice(xdtsString.indexOf("\n"), xdtsString.length));

		// Create new document.
		var doc = fl.createDocument("timeline");
		doc.frameRate = fps;

		// Get the timeline.
		var scene = doc.getTimeline();
		scene.name = xdts.timeTables[0].name;
		scene.advancedLayersEnabled = true;

		//--------------------------------
		// Process XDTS
		//--------------------------------

		var trackNames = xdts.timeTables[0].timeTableHeaders[0].names;
		var tracks = xdts.timeTables[0].fields[0].tracks;

		var duration = xdts.timeTables[0].duration;

		// Add duration to the first layer.
		scene.insertBlankKeyframe(duration - 1);

		// Find the right track. Starting from 0 counting upwards.
		var currentFolder = [];
		var parentFolder;
		var isCanvasSizeSet = false;
		for (var i = 0; i < tracks.length; i++) {
			var track = tracks[i];
			var trackName = trackNames[i];

			// Create folders.
			var fullLayerURI = searchForLayerInFolder(trackName, assetFolderURI, areFramesInLayerFolders);
			
			if (shouldImportFolderStructure) {

				if (!fullLayerURI) continue;
				else if (fullLayerURI.length > 0) {

					var folderList = [];
					if (areFramesInLayerFolders) folderList = fullLayerURI.slice(0, fullLayerURI.lastIndexOf("/")).replace(assetFolderURI, "").split("/");
					else folderList = fullLayerURI.replace(assetFolderURI, "").split("/");
					
					folderList = folderList.splice(1, folderList.length);

					if (folderList.length > 0) {

						for (var j = 0; j < folderList.length; j++) {
							var folderName = folderList[j];

							// Check if it's in the current folder.
							if (j < currentFolder.length) {

								if (folderName == currentFolder[j]) {
									parentFolder = scene.layers[j];
									scene.setSelectedLayers(j, true);
									continue;
								} else {
									currentFolder = [];
								}
							}

							var folderLayerIndex = scene.addNewLayer(folderName, "folder", parentFolder == null ? true : false);
							var folderLayer = scene.layers[folderLayerIndex]

							if (parentFolder) folderLayer.parentLayer = parentFolder;

							parentFolder = folderLayer;
							currentFolder.push(folderName);

						}
					} else {
						parentFolder = null;
						currentFolder = [];
						scene.setSelectedLayers(0, true);
					}
				}
			}

			// Create layer.
			var layerIndex = scene.addNewLayer(trackName, "normal", parentFolder == null ? true : false);
			var currentLayer = scene.layers[layerIndex];
			if (parentFolder) currentLayer.parentLayer = parentFolder;
			parentFolder = null;

			// Create frames.
			var frames = track.frames;
			for (var j = 0; j < frames.length; j++) {
				
				var frame = frames[j];
				var startTime = frame.frame;
				var symbol = frame.data[0].values[0];

				scene.currentFrame = startTime;
				if (startTime > 0) scene.insertBlankKeyframe(startTime);

				if (symbol == "SYMBOL_TICK_1" || symbol == "SYMBOL_TICK_2" || symbol == "SYMBOL_NULL_CELL") {
					
					switch (symbol) {
						case "SYMBOL_TICK_1":
							currentLayer.frames[currentLayer.frameCount - 1].name = "tween";
							break;
						case "SYMBOL_TICK_2":
							currentLayer.frames[currentLayer.frameCount - 1].name = "reverse";
							break;
						case "SYMBOL_NULL_CELL":
							break;
						default:
							break;
					}

				} else {
					// Look for the file in the folder.
					var fileURI = fullLayerURI + "/" + symbol + ".png";
					
					/*if (!FLfile.exists(fileURI)) {
						fileURI = fullLayerURI + "/" + symbol + ".svg";
					}*/
						
					if (FLfile.exists(fileURI)) {
						doc.importFile(fileURI, false, false, false);

						if (!isCanvasSizeSet && currentLayer.frameCount > startTime) {
							var element = currentLayer.frames[startTime].elements[0];
							if (element) {
								doc.height = element.height;
								doc.width = element.width;
								isCanvasSizeSet = true;
							}
						}
					}
				}
			}

			// Reset selection.
			scene.setSelectedLayers(0, true);
		}

		// Delete the default layer.
		scene.deleteLayer(scene.layerCount - 1);

		// Delete all frames past the duration.
		if (scene.frameCount > duration) {
			scene.currentFrame = duration + 1;
			scene.removeFrames();
		}

	}

	main();
})()