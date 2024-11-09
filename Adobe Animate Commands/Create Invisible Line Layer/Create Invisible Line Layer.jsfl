//==================================================
//	Create Invisible Line Layer
//--------------------------------------------------
//	This script takes the selected layers and merges
//	them into a single layer. It creates as many
//	frames as necessary. Then, it makes all of the
//	lines invisible.
//--------------------------------------------------
//	Instructions:
//
//	1. Select one or more layers.
//	2. Run Script.
//--------------------------------------------------
//	Version 1.1 (September 21, 2024)
//	- Made it so layers don't have to be unlocked
//	  and visible for the script to work.
//
//	Version 1.0 (September 13, 2024)
//	- Initial Release
//==================================================

(function () {
	var doc = fl.getDocumentDOM();
	if (!doc) {
		alert("Please open a document and try again.");
		return;
	}

	var scene = doc.getTimeline();

	scene.duplicateLayers();
	var newLayer = scene.mergeLayers();

	// Version 1.1
	newLayer.visible = true;
	newLayer.locked = false;

	// Go through the elements and change the alpha to 0.
	for (var i in newLayer.frames) {
		var frame = newLayer.frames[i];
		scene.currentFrame = frame.startFrame;

		doc.selectNone();

		// Loop through and only select shapes.
		for (var j in frame.elements) {
			var element = frame.elements[j];

			if (element.elementType == "shape") {
				doc.selection = [element];
				doc.setStrokeColor("#00000000");
				doc.setFillColor("#00000000");
				doc.selectNone();
			}
		}
	}
})();