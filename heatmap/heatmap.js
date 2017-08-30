var Heatmap = function(heatmapConfig) {
    /* For inheritance, and other functions to bind to this one */
    var _this = this;
    /* The main element for this script */
    _this.elem = document.getElementById(heatmapConfig.mainID);
    /* Set the size of the canvas to the size of the window */
    _this.elem.style.height = window.innerHeight + 'px';
    _this.elem.style.width = window.innerWidth + 'px';
    _this.elem.width = String(window.innerWidth);
    _this.elem.height = String(window.innerHeight);
    /* If the canvas element cannot fetch the context, we can't work */
    if ((_this.context = _this.elem.getContext("2d")) === null) {
        console.error(['Could not get context', _this.context]);
    }
    /* Storage for the coordinate points to be drawn on the page */
    _this.points = [];
    /* Add an x,y coordinate to the points array */
    function addPoint(newPoint) {
        _this.points.push({ x : newPoint.x, y : newPoint.y });
    }
    /* Draw all the points on the page */
    function drawPoints() {
        _this.sortedPoints = {};
        /* Create an object with a color value for each point in _this.points */
        _this.points.map(function(point) {
            if (!_this.sortedPoints[point.x]) {
                _this.sortedPoints[point.x] = {};
            }
            if (!_this.sortedPoints[point.x][point.y]) {
                _this.sortedPoints[point.x][point.y] = {
                    color : 0
                };
            }
            _this.sortedPoints[point.x][point.y].color += 35;
        });
        /* Map out the coordinates, and draw a 2x2 pixel dot for each block */
        Object.keys(_this.sortedPoints).map(function(xRow) {
            Object.keys(_this.sortedPoints[xRow]).map(function(yRow) {
                _this.context.fillStyle = 'rgb(' + 
                String(_this.sortedPoints[xRow][yRow].color * 5) + ',' + 
                String(_this.sortedPoints[xRow][yRow].color * 1) + ',' +
                String(_this.sortedPoints[xRow][yRow].color * 3) + ')';
                _this.context.fillRect(xRow, yRow, 2, 2);
            });
        });    
    }
    /* When the mouse moves, add a datapoint */
    window.onmousemove = function(heatmapMouseEvent) {
        addPoint({ x : heatmapMouseEvent.clientX, y : heatmapMouseEvent.clientY });
    };
    /* Bind the button to draw the heatmap */
    document.getElementById("draw-heatmap").onclick = drawPoints;
}
/* Create a new heatmap when the page loads */
document.addEventListener('DOMContentLoaded', function(loadedEvent) {
    var pageHeatmap = new Heatmap({
        mainID : "heatmap-view"
    });
});
