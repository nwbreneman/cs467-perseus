var Vertex = function (x, y) {
    this.x = x;
    this.y = y;
    this.neighbors = [];
    this.id = parseFloat(this.x + this.y);
};


Vertex.prototype.addNeighbor = function (v) {
    this.neighbors.push(v);
};


var isVisible = function (x1, y1, x2, y2, object) {
    var line = new me.Line(
        0, 0, [
            new me.Vector2d(x1, y1),
            new me.Vector2d(x2, y2)
        ]);

    // now check if the line's bounding box intersects with the
    // provided object
    var aBounds = line.getBounds();
    var bBounds = object.getBounds();
    absPointsA = calcAbsPoints(aBounds);
    absPointsB = calcAbsPoints(bBounds);
    a = [absPointsA[0], absPointsA[2]];
    b = [absPointsB[0], absPointsB[2]];

    // https://martin-thoma.com/how-to-check-if-two-line-segments-intersect/
    // uses bounding box intersection method from above
    return a[0].x <= b[1].x
        && a[1].x >= b[0].x
        && a[0].y <= b[1].y
        && a[1].y >= b[0].y;
};


var buildGraph = function () {
    var graph = [];

    // step 1: get all collision objects
    var collisionObjects = [];
    me.game.world.forEach(function (child) {
        if (!child.isKinematic) {
            collisionObjects.push(child);
        }
    });

    // step 2: get all collision vertices
    var allCollisionVerticies = [];
    collisionObjects.forEach(function (child) {
        if (!child.isKinematic) {
            allCollisionVerticies = allCollisionVerticies.concat(
                calcAbsPoints(child.getBounds()));
        }
    });

    // convert them to our Vertex object
    var vertices = [];
    allCollisionVerticies.forEach(function (v) {
        vertices.push(new Vertex(v.x, v.y));
    });

    // step 3: naive algorithm & naive graph; for each vertex, check if it's
    // visible to every other vertex other than itself; if it is, add that edge
    // to graph and add its neighbors
    for (var i = 0; i < vertices.length; i++) {
        for (var j = 0; j < vertices.length; j++) {
            if (vertices[i].id !== vertices[j].id) {
                collisionObjects.forEach(function (object) {
                    if (isVisible(vertices[i].x, vertices[i].y, vertices[j].x, vertices[j].y, object)) {
                        vertices[i].addNeighbor(vertices[j]);
                        vertices[j].addNeighbor(vertices[i]);

                        if (graph.indexOf(vertices[i]) === -1) {
                            graph.push(vertices[i]);
                        }

                        if (graph.indexOf(vertices[j]) === -1) {
                            graph.push(vertices[j]);
                        }
                    }
                });
            }
        }
    }

    return graph;
};

var addVertexToGraph = function (graph, vertex) {
    var collisionObjects = [];
    me.game.world.forEach(function (child) {
        if (!child.isKinematic) {
            collisionObjects.push(child);
        }
    });

    for (var i = 0; i < graph.length; i++) {
        v = graph[i];
        collisionObjects.forEach(function (object) {
            if (isVisible(v.x, v.y, vertex.x, vertex.y, object)) {
                v.addNeighbor(vertex);
                vertex.addNeighbor(v);
            }
        });
    }

    if (graph.indexOf(vertex) === -1) {
        graph.push(vertex);
    }
};

var calcAbsPoints = function (bounds) {
    var calculatedPoints = [];
    var pos = bounds.pos;
    var points = bounds.points;

    for (var i = 0; i < points.length; i++) {
        point = points[i];
        calculatedPoints.push({
            "x": point.x + pos.x,
            "y": point.y + pos.y
        });
    }

    return calculatedPoints;
};
