var VisGraph = function () {
    this.G = [];  // list of nodes/edges

    this.addNode = function (node) {
        if (this.G.findIndex(function (e) { return e.id === node.id }) === -1) {
            this.G.push(node);
        }
    }

    this.removeNode = function (node) {
        var index = this.G.findIndex(function (e) { return e.id === node.id });
        if (index > -1) {
            this.G.splice(index, 1);
        }
    }

    this.addVertex = function (vertex) {
        vertex.id = this.G.length;
        for (var i = 0; i < this.G.length; i++) {
            v = this.G[i];
            if (isVisible(v.x, v.y, vertex.x, vertex.y)) {
                v.addNeighbor(vertex);
                vertex.addNeighbor(v);
            }
        }

        this.addNode(vertex);
    }
}

var Vertex = function (x, y, id) {
    this.x = x;
    this.y = y;
    this.neighbors = [];
    this.id = id;
};


Vertex.prototype.addNeighbor = function (v) {
    if (this.neighbors.findIndex(function (e) { return e.id === v.id }) === -1) {
        this.neighbors.push(v);
    }
};


var isVisible = function (x1, y1, x2, y2) {
    var line = new me.Line(
        0, 0, [
            new me.Vector2d(x1, y1),
            new me.Vector2d(x2, y2)
        ]);

    var result = me.collision.rayCast(line);

    if (result.length > 0) {
        return false;
    }
    return true;
};


var buildGraph = function () {
    var graph = new VisGraph();

    // step 1: get all collision objects
    var collisionObjects = [];
    me.game.world.forEach(function (child) {
        if (child.isKinematic !== true) {
            if (child.body) {
                var playerCollide = child.body.collisionMask & game.collisionTypes.PLAYER_UNIT !== 0;
                var enemyCollide = child.body.collisionMask & game.collisionTypes.ENEMY_UNIT !== 0;
                if (playerCollide || enemyCollide) {
                    collisionObjects.push(child);
                }
            }
        }
    });

    // step 2: get all collision vertices
    var allCollisionVerticies = [];
    var absP;
    collisionObjects.forEach(function (child) {
        absP = calcAbsPoints(child.getBounds());
        for (var i = 0; i < absP.length; i++) {
            if (allCollisionVerticies.indexOf(absP[i]) === -1) {
                allCollisionVerticies.push(absP[i]);
            }
        }
    });

    // convert them to our Vertex object
    var vertices = [];
    var idCount = 0;
    allCollisionVerticies.forEach(function (v) {
        vertices.push(new Vertex(v.x, v.y, idCount));
        idCount++;
    });

    // step 3: get all tile coords and add them to vertices
    var level = me.levelDirector.getCurrentLevel();
    var layer = level.getLayers()[1];
    var cols = level.cols;
    var rows = level.rows;
    var coords;
    for (var i = 1; i < cols; i++) {
        for (var j = 1; j < rows; j++) {
            coords = level.getRenderer().tileToPixelCoords(i, j);
            if (layer.getTile(coords.x, coords.y)) {
                vertices.push(new Vertex(coords.x, coords.y, idCount));
                idCount++;
            }
        }
    }

    // step 4: naive algorithm & naive graph; for each vertex, check if it's
    // visible to every other vertex other than itself; if it is, add that edge
    // to graph and add its neighbors
    for (var i = 0; i < vertices.length; i++) {
        for (var j = 0; j < vertices.length; j++) {
            if (vertices[i].id !== vertices[j].id) {
                if (
                    isVisible(
                        vertices[i].x, vertices[i].y,
                        vertices[j].x, vertices[j].y)
                ) {
                    vertices[i].addNeighbor(vertices[j]);
                    vertices[j].addNeighbor(vertices[i]);
                    graph.addNode(vertices[i]);
                    graph.addNode(vertices[j]);
                }
            }
        }
    }

    return graph;
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
