//==================================================
//	Export Layers as Image Sequences
//--------------------------------------------------
//	Takes all layers and renders them as image
//	sequences in separate folders.
//--------------------------------------------------
//	Instructions:
//
//	1. Run Script.
//--------------------------------------------------
//	Version 1.0 (September 13, 2024)
//	- Initial Release
//==================================================

(function () {

	function parentURI(layer, uriArray) {

		if (layer.parentLayer) {
			var parent = layer.parentLayer;
			uriArray.push(parent.name)
			parentURI(parent, uriArray);
		}

		if (uriArray.length == 0) return "";
		else return uriArray.reverse().join("/") + "/";

	}

	var doc = fl.getDocumentDOM();
	var scene = doc.getTimeline();

	// Present dialogue.
	var xmlURI = fl.scriptURI.replace(fl.scriptURI.split("/").pop(), "Export Layer as Image Sequences UI.xml");
	mainWindow = fl.xmlPanel(xmlURI);

	if (mainWindow.dismiss == "cancel") return;

	var exportURI = FLfile.platformPathToURI(mainWindow.exportURITextbox);
	if (!exportURI) {
		alert("Unable to find export location.");
	}

	var mainFolderURI = exportURI + "/" + doc.name.replace(/\..*/, "");
	FLfile.createFolder(mainFolderURI);

	for (var i in scene.layers) {
		var layer = scene.layers[i];
		if (layer.layerType != "folder") scene.layers[i].visible = false;
	}

	for (var i in scene.layers) {

		var layer = scene.layers[i];

		var layerFolderURI = mainFolderURI + "/" + parentURI(layer, []) + layer.name;
		FLfile.createFolder(layerFolderURI);

		if (layer.layerType == "folder") continue;

		layer.visible = true;

		var frameURI = layerFolderURI + "/" + layer.name + "_.png";

		if (mainWindow.imageFormatMenu == "PNG") doc.exportPNG(frameURI, true, false);
		else doc.exportSVG(frameURI, true, false);

		layer.visible = false;
	}

})();