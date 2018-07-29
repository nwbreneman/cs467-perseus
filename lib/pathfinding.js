var shortestPath = function (start, end) {
    // get our visibility graph (does not change during the game)
    var G = game.data.visGraph;

    // add start and end to G
    addVertexToGraph(G, start);
    addVertexToGraph(G, end);

    // find shortest path from start to end with Dijkstra's
    var path = Dijkstra(G, start, end);

    return path;
};

var minDist = function (dist, Q) {
    var min = Infinity;
    var minV = null;

    for (var v in dist) {
        if (dist[v] < min) {
            min = dist[v];
            minV = v;
        }
    }

    for (var i = 0; i < Q.length; i++) {
        v = Q[i];
        if (v && v.id === parseFloat(minV)) {
            return v;
        }
    }
}


var length = function (u, v) {
    var a = Math.pow(u.x - v.x, 2);
    var b = Math.pow(u.y - v.y, 2);
    var dist = Math.sqrt(a + b);
    return dist;
};


var Dijkstra = function (Graph, source, target) {
    dist = {};
    prev = {};

    Q = [];

    Graph.forEach(function (v) {
        dist[v.id] = Infinity;
        prev[v.id] = undefined;
        Q.push(v);
        count++;
    });

    dist[source.id] = 0;

    while (Q.length > 0) {
        u = minDist(dist, Q);

        // remove u from Q
        Q.splice(Q.indexOf(u), 1);

        if (u === target) {
            return {
                "dist": dist,
                "prev": prev
            }
        }

        u.neighbors.forEach(function (v) {
            alt = dist[u.id] + length(u, v);
            if (alt < dist[v.id]) {
                dist[v.id] = alt;
                prev[v.id] = u;
            }
        });
    }


    return {
        "dist": dist,
        "prev": prev
    }
};