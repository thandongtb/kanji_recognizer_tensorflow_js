//-------------------
// GLOBAL variables
//-------------------
let model;

var canvasWidth           	= 150;
var canvasHeight 			= 150;
var canvasStrokeStyle		= "white";
var canvasLineJoin			= "round";
var canvasLineWidth       	= 4;
var canvasBackgroundColor 	= "black";
var canvasId              	= "canvas";

var clickX = new Array();
var clickY = new Array();
var clickD = new Array();
var drawing;
const TOP_K = 5
const IMG_SIZE = 96

// document.getElementById('chart_box').innerHTML = "";
// document.getElementById('chart_box').style.display = "none";

//---------------
// Create canvas
//---------------
var canvasBox = document.getElementById('canvas_box');
var canvas    = document.createElement("canvas");

canvas.setAttribute("width", canvasWidth);
canvas.setAttribute("height", canvasHeight);
canvas.setAttribute("id", canvasId);
canvas.style.backgroundColor = canvasBackgroundColor;
canvasBox.appendChild(canvas);
if (typeof G_vmlCanvasManager != 'undefined') {
  canvas = G_vmlCanvasManager.initElement(canvas);
}

var result_canvas = document.getElementById("result_canvas");
var result_ctx = result_canvas.getContext("2d");

ctx = canvas.getContext("2d");

//---------------------
// MOUSE DOWN function
//---------------------
$("#canvas").mousedown(function(e) {
	var mouseX = e.pageX - this.offsetLeft;
	var mouseY = e.pageY - this.offsetTop;

	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();
});

//-----------------------
// TOUCH START function
//-----------------------
canvas.addEventListener("touchstart", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}

	var rect = canvas.getBoundingClientRect();
	var touch = e.touches[0];

	var mouseX = touch.clientX - rect.left;
	var mouseY = touch.clientY - rect.top;

	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();

}, false);

//---------------------
// MOUSE MOVE function
//---------------------
$("#canvas").mousemove(function(e) {
	if(drawing) {
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
		predict();
	}
});

//---------------------
// TOUCH MOVE function
//---------------------
canvas.addEventListener("touchmove", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}
	if(drawing) {
		var rect = canvas.getBoundingClientRect();
		var touch = e.touches[0];

		var mouseX = touch.clientX - rect.left;
		var mouseY = touch.clientY - rect.top;

		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
}, false);

//-------------------
// MOUSE UP function
//-------------------
$("#canvas").mouseup(function(e) {
	drawing = false;
});

//---------------------
// TOUCH END function
//---------------------
canvas.addEventListener("touchend", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}
	drawing = false;
}, false);

//----------------------
// MOUSE LEAVE function
//----------------------
$("#canvas").mouseleave(function(e) {
	drawing = false;
});

//-----------------------
// TOUCH LEAVE function
//-----------------------
canvas.addEventListener("touchleave", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}
	drawing = false;
}, false);

//--------------------
// ADD CLICK function
//--------------------
function addUserGesture(x, y, dragging) {
	clickX.push(x);
	clickY.push(y);
	clickD.push(dragging);
}

//-------------------
// RE DRAW function
//-------------------
function drawOnCanvas() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	ctx.strokeStyle = canvasStrokeStyle;
	ctx.lineJoin    = canvasLineJoin;
	ctx.lineWidth   = canvasLineWidth;

	for (var i = 0; i < clickX.length; i++) {
		ctx.beginPath();
		if(clickD[i] && i) {
			ctx.moveTo(clickX[i-1], clickY[i-1]);
		} else {
			ctx.moveTo(clickX[i]-1, clickY[i]);
		}
		ctx.lineTo(clickX[i], clickY[i]);
		ctx.closePath();
		ctx.stroke();
	}
}

//------------------------
// CLEAR CANVAS function
//------------------------
function clearCanvas(id) {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	result_ctx.clearRect(0, 0, result_ctx.canvas.width, result_ctx.canvas.height);
	clickX = new Array();
	clickY = new Array();
	clickD = new Array();
}

//-------------------------------------
// loader for model
//-------------------------------------
async function loadModel() {
  console.log("model loading..");
  // clear the model variable
  model = undefined;
  // load the model
  model = await tf.loadModel("./model/model.json");

  console.log("model loaded..");
}

loadModel();

//-----------------------------------------------
// preprocess the canvas
//-----------------------------------------------
function preprocessCanvas(image) {

	// resize the input image to target size of (1, IMG_SIZE, IMG_SIZE, 3)
	let tensor = tf.fromPixels(image)
	    .resizeNearestNeighbor([IMG_SIZE, IMG_SIZE])
	    .expandDims()
	    .toFloat();

	return tensor.div(255.);
}

function drawTopResult(top_k){
	result_ctx.clearRect(0, 0, result_ctx.canvas.width, result_ctx.canvas.height);
	var best_character = top_k[0]['className']
    var top_2_character = top_k[1]['className']
    var top_3_character = top_k[2]['className']
    var top_4_character = top_k[3]['className']
    var top_5_character = top_k[4]['className']

	result_ctx.font = "10pt Arial";
	result_ctx.fillText('Top 1', 30, 55);
	result_ctx.fillText('Top 2', 5, 110);
	result_ctx.fillText('Top 3', 75, 110);
	result_ctx.fillText('Top 4', 145, 110);
	result_ctx.fillText('Top 5', 215, 110);
	result_ctx.font = "60pt Arial";
	result_ctx.fillText(best_character, 80, 80);
	result_ctx.font = "20pt Arial";


	result_ctx.fillText(top_2_character, 10, 143);
	result_ctx.fillText(top_3_character, 80, 143);
	result_ctx.fillText(top_4_character, 150, 143);
	result_ctx.fillText(top_5_character, 220, 143);
}

//---------------------
// Get top_k function
//---------------------

function getTopK(predictions, k){
	// Input: predictions is the output dataSync of model.predict() function
	top_k = Array.from(predictions)
		.map(function(p, i){
		    return {
		        probability: p,
		        className: KANJI_CLASSES[i]
		    };
		}).sort(function(a,b){
		    return b.probability - a.probability;
		}).slice(0, TOP_K);

	return top_k
}

//--------------------------------------------
// predict function
//------------------------------------------
async function predict() {
	// preprocess canvas
	let tensor = preprocessCanvas(canvas);
	// make predictions on the preprocessed image tensor
	let predictions = await model.predict(tensor).dataSync();
	// get the model's prediction results
	let top_k = getTopK(predictions, TOP_K)

	drawTopResult(top_k)
}
