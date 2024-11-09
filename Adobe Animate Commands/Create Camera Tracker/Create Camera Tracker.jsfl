//---------------------------------------
//	Create Camera Tracker
//---------------------------------------
//	Creates a layer with a shape that
//	shows the path of the camera.
//---------------------------------------
//	Instructions:
//
//	1. Enable camera.
//	2. Run Script.
//
//---------------------------------------
//	Version 1.0
//	- Initial release.
//---------------------------------------

(function () {

	//----------------------------
	//	Create Global Variables
	//----------------------------
	var doc = fl.getDocumentDOM();
	if (!doc) {
		alert("Please open a document and try again.");
		return;
	}

	var scene = doc.getTimeline();

	// Check if there's even a camera.
	if (scene.camera.cameraEnabled == false) {
		alert("Please add a camera.");
		return;
	}

	// Select the camera layer.
	doc.selectNone()
	scene.setSelectedLayers(0, true);

	// Create new layer.
	var frameLayerIndex = scene.addNewLayer("TRK-CAM-MAIN", "normal", false);
	scene.setSelectedLayers(frameLayerIndex, true);

	//----------------------------
	//	Create Shapes
	//----------------------------

	// Create a frame the size of the stage.
	var cameraFrame = {
		top: 0,
		left: 0,
		right: doc.width,
		bottom: doc.height
	};

	// Create middle cross.
	var crossSize = 10;
	var centerPoint = {
		x: (doc.width / 2),
		y: doc.height / 2
	};

	var crossHorizontalP1 = {
		x: centerPoint.x - crossSize,
		y: centerPoint.y
	};
	var crossHorizontalP2 = {
		x: centerPoint.x + crossSize,
		y: centerPoint.y
	};
	var crossVerticalP1 = {
		x: centerPoint.x,
		y: centerPoint.y - crossSize
	};
	var crossVerticalP2 = {
		x: centerPoint.x,
		y: centerPoint.y + crossSize
	};

	// The up triangle indicator.
	var p1 = {
		x: centerPoint.x - crossSize,
		y: centerPoint.y
	};
	var p2 = {
		x: centerPoint.x,
		y: centerPoint.y - crossSize
	};
	var p3 = {
		x: centerPoint.x + crossSize,
		y: centerPoint.y
	};

	//----------------------------
	//	Draw
	//----------------------------

	// Set the stroke for the drawing.
	var stroke = doc.getCustomStroke("toolbar");
	stroke.color = "#FF0000";
	stroke.thickness = 3;
	stroke.joinType = "miter";
	doc.setCustomStroke(stroke);

	// Draw the frame.
	doc.addNewRectangle(cameraFrame, 0, true, false);

	// Draw the cross.
	doc.addNewLine(crossHorizontalP1, crossHorizontalP2);
	doc.addNewLine(crossVerticalP1, crossVerticalP2);

	// Draw the arrow.
	doc.addNewLine(p1, p2);
	doc.addNewLine(p2, p3);

	//----------------------------
	//	Create Keyframes
	//----------------------------

	var cameraLayer = scene.layers[0];
	var frameLayer = scene.layers[frameLayerIndex];
	fl.outputPanel.clear();
	function copyCameraDataToElements(frame, currentFrame) {
		var camElement = scene.layers[0].frames[currentFrame].elements[0];

		for (var i = 0; i < frame.elements.length; i++) {
			var element = frame.elements[i];

			element.x = camElement.x;
			element.y = camElement.y;
			element.rotation = camElement.rotation;
			element.scaleX = camElement.scaleX;
			element.scaleY = camElement.scaleY;
		}
	}

	// Create keyframes.
	for (var i = 0; i < cameraLayer.frameCount; i++) {
		var frame = cameraLayer.frames[i];

		if (frame.startFrame == i) {

			// Create keyframe if it's not the first frame.
			if (i > 0) scene.convertToKeyframes(frame.startFrame);

			copyCameraDataToElements(frameLayer.frames[i], i);
		}
	}
})();