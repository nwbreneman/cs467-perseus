/*
 * Enemy AI controller entity
 */
game.AI = game.Player.extend({

    init: function (name, ptype, settings) {
        // call the parent constructor
        // (zero size makes this object non-renderable, so the Renderable.draw method won't get called)
        this._super(game.Player, 'init', [name, ptype, settings]);

        this.spawnPoint = settings.spawnPoint;
        this.base = settings.base;
        this.resourcePointsCaptured = 0;
        this.resourcePointsPending = 0;

        this.flag = settings.flag;
        this.playerFlag = settings.playerFlag;

        // Set the timing variables
        this.processAccumulator = 0;

        // Generate a list of all possible units we can buy, so all the attributes of each unit is known by the controller
        this.availableUnits = [];
        var unitNames = me.loader.getJSON("manifest_enemy").units;
        for (var name of unitNames) {
            var unit = me.loader.getJSON(name);
            unit.attackPerSecond = unit.attack * 1000 / unit.attackCooldown;
            this.availableUnits.push(unit);
        }

        // Generate list of resource points on the map
        this.resourcePointList = me.game.world.getChildByName("capture_point");
    },

    /** When the entity is created */
    onActivateEvent: function () {
        game.sylvanlog("enemy controller is created");
        if (game.data.difficulty == "Easy") {
            game.sylvanlog("Easy difficulty.");

            this.processInterval = 360;
            this.maxIntermediateDefenders = 1;
            this.maxRunners = 1;
            this.minAttack = 0;
        } else {
            game.sylvanlog("Hard difficulty.");

            this.processInterval = 240;
            this.maxIntermediateDefenders = 2;
            this.maxRunners = 2;
            this.unitResources *= 2;
            this.resourceRateBoost = 2.0;
            this.minAttack = 10;
        }
    },


    // Set up the intervals to call certain functions. Most AI processing won't be done in here
    // because this function is being called 60 times/sec and that is overkill for high-level AI processing.
    update: function (dt) {
        // Dispatch timed functions
        this.processAccumulator++;
        if (this.processAccumulator >= this.processInterval) {
            this.processAccumulator = 0;
            this.process();
        }
    },


    // Purchase a unit by name, and place him at the spawn point, subtracting the cost from current resources
    buyUnit: function (name) {
        game.sylvanlog("Trying to buy", name);

        var settings = me.loader.getJSON(name);

        //change resource rate to player if buying an engineer
                if (settings.name == "enemy_engineer" && !loadingSave) {
                    this.changeResourceRate(5);
                    game.data.alertMessage.add("ENEMY ENGINEER BUILT: +5 RESOURCES PER SECOND ");
                }

        if (settings !== null) {
            settings.controller = this;
            settings.team = game.data.enemy;
            settings.initialState = 'spawning';

            if (game.data.enemy.unitResources >= settings.cost) {
                game.sylvanlog("Purchasing unit", name);
                var unit = me.pool.pull(name, 20, 20, settings);
                unit.pos.x = this.spawnPoint.pos.x - unit.width * 0.5;
                unit.pos.y = this.spawnPoint.pos.y - unit.height * 1.0;
                game.data.enemy.unitResources -= settings.cost;
                this.unitList.push(unit);
                unit.player = this;
                me.game.world.addChild(unit, me.game.world.getChildByName("units")[0].pos.z);
            }
        }
    },




    // Receive a message from a unit so we can act on the information
    report: function (unit, message) {
        if (message == 'dead') {
            game.sylvanlog("AI Controller: Unit reporting as dead");
            this.removeUnitFromList(unit);
        }
        if (message == "returned flag") {
            game.sylvanlog("AI Controller: Unit reporting it returned the flag");
            unit.command(unit.previousOrders);
        }
        if (message == "got flag") {
            game.sylvanlog("AI Controller: Unit reporting picked up flag");
            destination = this.flag.homePosition;
            unit.command({ type: "capture flag", x: destination.x, y: destination.y + 20 });
        }

    },


    // If a unit dies, we need to remove the reference to that unit from the array
    removeUnitFromList: function (unit) {
        var pos = this.unitList.indexOf(unit);
        if (pos != -1) {
            this.unitList.splice(pos, 1);
        }
    },



    // AI does processing in here
    process: function () {
        game.sylvanlog("AI processing function. Resources:", game.data.enemy.unitResources, "Rate:", game.data.enemy.resourceRate);


        /*
         * Flag return:
         * If my flag is not at home, send someone to go and return it
         */
        if (!this.flag.isHome()) {

            // Find the closest unit to the dropped flag and send him to pick it up or chase down the goon carrying it away
            var dest = new me.Vector2d(this.flag.pos.x, this.flag.pos.y + 20);
            var unit = this.getNearestUnit(dest);
            if (unit) {
                unit.command({ type: "return flag", x: dest.x, y: dest.y });
                return;
            } else {
                // Try to buy a unit because this is important
                unitName = this.getBestUnitWithWeighting(2000, 1, 2, 1, 0, 0, 0, game.data.enemy.unitResources);
                if (unitName == "") {
                    game.sylvanlog("Enemy controller: cannot afford a defender at this time. Resources:", game.data.enemy.unitResources);
                } else {
                    this.buyUnit(unitName);
                    unit = this.unitList[this.unitList.length - 1];
                    unit.command({ type: "return flag", x: dest.x, y: dest.y });
                    return;
                }
            }

        }


        /*
         * Flag capture:
         * If the enemy flag is dropped somewhere, and no runner is around, send the nearest unit to try and grab it
         */
        if (!this.playerFlag.isHome() && !this.playerFlag.isHeld) {
            // Is anyone going after the flag?
            var goingForFlag = false;
            for (var unit of this.unitList) {
                if (unit.currentOrders.type == 'capture flag') {
                    goingForFlag = true;
                }
            }

            if (!goingForFlag) {
                // Find the closest unit to the dropped flag and send him to pick it up
                var dest = new me.Vector2d(this.playerFlag.pos.x, this.playerFlag.pos.y + 20);
                var unit = this.getNearestUnit(dest);
                if (unit) {
                    unit.command({ type: "capture flag", x: dest.x, y: dest.y });
                    return;
                }
            }
        }



        /*
         * Flag defending:
         * I want someone defending the flag at all times if is at home
         */
        game.sylvanlog("Enemy controller: check guard flag");
        var flagDefender = this.getUnitWithOrders('guard flag');
        if (this.flag.isHome()) {
            if (flagDefender == null) {
                nameOfUnit = this.getBestUnitWithWeighting(1, 1.5, 1, 1.5, 0, 0, 0, game.data.enemy.unitResources);
                if (nameOfUnit == "") {
                    game.sylvanlog("Enemy controller: cannot afford a flag guard at this time. Resources:", game.data.enemy.unitResources);
                } else {
                    // Do I have an idle unit I can deploy?
                    var flagLoc = new me.Vector2d(this.flag.pos.x, this.flag.pos.y);
                    var unit = this.getNearestIdleUnit(flagLoc);
                    if (unit != null) {
                        unit.command({ type: "guard flag", x: flagLoc.x, y: flagLoc.y });
                    } else {
                        // No unit to deploy, var's go ahead and buy it
                        this.buyUnit(nameOfUnit);
                        unit = this.unitList[this.unitList.length - 1];
                        game.sylvanlog("Enemy controller: commanding newly purchased unit to guard the flag at", flagLoc.toString());
                        unit.command({ type: "guard flag", x: flagLoc.x, y: flagLoc.y });
                    }
                }

                return; // Only do one thing per process to keep things fair for the player
            }
        }


        /*
         * Resource gathering:
         * I want someone gathering resources at all times
         */
        game.sylvanlog("Enemy controller: check resource gathering");
        var gatherer = this.getUnitWithOrders('capture resource');
        if (gatherer == null) {
            // There is currently no unit with orders to gather resources
            // Do I have an idle unit I can deploy?
            // Find a unit near the middle of the map
            blueflagstand = me.game.world.getChildByName("blueflagstand")[0];
            redflagstand = me.game.world.getChildByName("redflagstand")[0];
            dist = blueflagstand.pos.distance(redflagstand.pos);
            targetLoc = new me.Vector2d(blueflagstand.pos.x + dist.x / 2, blueflagstand.pos.y + dist.y / 2);
            gatherer = this.getNearestIdleUnit(targetLoc);
            if (gatherer == null) {
                // No unit to deploy
                // See if I can purchase a new unit
                nameOfUnit = this.getBestUnitWithWeighting(100, 1, 1, 1, 0, 0, 0, 200);
                if (nameOfUnit == "") {
                    game.sylvanlog("Enemy controller: cannot purchase a gatherer that meets the criteria. Resources:", game.data.enemy.unitResources);
                } else {
                    this.buyUnit(nameOfUnit);
                    gatherer = this.unitList[this.unitList.length - 1];
                }
            } 
        }

        if (gatherer != null) {
            game.sylvanlog("Gatherer state:", gatherer.state);
            // Make sure he's not sitting idle if he already captured his resource point
            if (gatherer.state != 'gathering' && gatherer.state != 'moving') {
                resourcePoint = this.getNearestUncapturedResource(gatherer);
                if (resourcePoint) {
                    game.sylvanlog("Enemy controller: commanding newly purchased unit to acquire resource");
                    gatherer.command({ type: "capture resource", point: resourcePoint });

                    return;
                }
            }
        }


        /*
         * Intermediate defenders:
         * Station a few units near the resource points to help keep those alive
         */
        game.sylvanlog("Enemy controller: check defenders");
        var defenders = this.getDefenders();
        if (defenders.length < this.maxIntermediateDefenders) {
            nameOfUnit = this.getBestUnitWithWeighting(1, 1, 1, 1, 0, this.minAttack, 0, game.data.enemy.unitResources);
            if (nameOfUnit == "") {
                game.sylvanlog("Enemy controller: cannot purchase a defender that meets the criteria. Resources:", game.data.enemy.unitResources);
            } else {
                this.buyUnit(nameOfUnit);
                var defender = this.unitList[this.unitList.length - 1];

                var nearestResource = this.getNearestResourcePoint(this.base.pos);
                game.sylvanlog("nearest resource:", nearestResource.pos.toString());
                var dest;
                if (defenders.length == 0) {
                    dest = new me.Vector2d(nearestResource.pos.x + 150, nearestResource.pos.y + nearestResource.height * 0.5 + 250);
                } else {
                    var otherDefender = defenders[0];
                    if (otherDefender.pos.y > nearestResource.pos.y) {
                        dest = new me.Vector2d(nearestResource.pos.x + 150, nearestResource.pos.y + nearestResource.height * 0.5 - 250);
                    } else {
                        dest = new me.Vector2d(nearestResource.pos.x + 150, nearestResource.pos.y + nearestResource.height * 0.5 + 250);
                    }

                }
                defender.command({ type: "defend", x: dest.x, y: dest.y });
            }

            return;
        }



        /*
         * Flag capture:
         * Start sending units to capture the flag.
         * Try limiting the number of runners at a time, to encourage saving for the top tier units, and to avoid spamming the map with bikers
         */
        game.sylvanlog("Enemy controller: check flag runners");
        if (this.getFlagRunners().length < this.maxRunners) {
            nameOfUnit = this.getBestUnitWithWeighting(2000, 1, 2, 1, 2.0, 0, 0, game.data.enemy.unitResources);
            if (nameOfUnit != "") {
                var unit = me.loader.getJSON(nameOfUnit);
                this.buyUnit(nameOfUnit);
                var runner = this.unitList[this.unitList.length - 1];
                var dest = new me.Vector2d(this.playerFlag.pos.x, this.playerFlag.pos.y + 20);
                runner.command({ type: "capture flag", x: dest.x, y: dest.y });
                return;

            } else {
                // Continue waiting until we can afford a faster unit. Hopefully we are gathering resources during this time
                game.sylvanlog("Enemy controller: cannot purchase a flag runner that meets the criteria. Resources:", game.data.enemy.unitResources);
            }
        }
        



    },


    getBestUnitWithWeighting: function(speedWeight, attackWeight, defenseWeight, rangeWeight, minSpeed, minAttack, minDefense, maxCost) {
        var best = "";
        var highestSum = 0;

        for (var unit of this.availableUnits) {
            unit.weightedSpeed = unit.speed * speedWeight;
            unit.weightedAttack = unit.attackPerSecond * attackWeight;
            unit.weightDefense = unit.defense * defenseWeight;
            unit.rangeWeight = unit.range * rangeWeight;
            unit.weightedSum = unit.weightedSpeed + unit.weightedAttack + unit.weightedAttack;

            if (unit.weightedSum > highestSum && unit.speed >= minSpeed && unit.attack >= minAttack && unit.defense >= minDefense
                && unit.cost <= maxCost && unit.cost <= game.data.enemy.unitResources) {
                // Good to go
                best = unit.name;
                highestSum = unit.weightedSum;
            }
        }

        return best;
    },



    getNearestResourcePoint: function (loc) {
        var resourceList = me.game.world.getChildByName("capture_point");
        var index = -1;
        var dist = 100000;
        var destPoint = null;
        for (var i = 0; i < resourceList.length; i++) {
            var point = resourceList[i];

            var thisDist = loc.distance(point.pos);
            if (thisDist < dist) {
                dist = thisDist;
                index = i;
            }
        }

        return resourceList[index];
    },


    // Get the nearest resource point that hasn't been captured yet
    getNearestUncapturedResource: function (unit) {
        if (unit == null) {
            return null;
        }

        game.sylvanlog(unit);
        var resourceList = me.game.world.getChildByName("capture_point");
        var index = -1;
        var dist = 100000;
        var destPoint = null;
        for (var i = 0; i < resourceList.length; i++) {
            var point = resourceList[i];
            if (point.owner == game.data.enemy) {
                continue;
            }
            // Check other units to see if they've been ordered to capture the same resource point
            var alreadyOrdered = false;
            for (var eachUnit of this.unitList) {
                var orderPoint = eachUnit.currentOrders.point;
                if (orderPoint != null && orderPoint == point) {
                    alreadyOrdered = true;
                }
            }
            if (alreadyOrdered) {
                continue;
            }
            var thisDist = unit.pos.distance(point.pos);
            if (thisDist < dist) {
                dist = thisDist;
                index = i;
            }
        }


        var destPoint = null;
        if (index != -1) {
            destPoint = resourceList[index];
            game.sylvanlog("nearest uncaptured resource:", destPoint.pos.toString());

        }

        return destPoint;

    },


    getDefenders: function () {
        var list = [];
        for (var unit of this.unitList) {
            if (unit.currentOrders.type == 'defend') {
                list.push(unit);
            }
        }
        return list;
    },


    getFlagRunners: function() {
        var list = [];
        for (var unit of this.unitList) {
            if (unit.currentOrders.type == 'capture flag') {
                list.push(unit);
            }
        }
        return list;
    },


    getUnitWithOrders: function (type) {
        var theUnit = null;
        for (var unit of this.unitList) {
            if (unit.currentOrders.type == type) {
                theUnit = unit;
            }
        }
        return theUnit;
    },



    getIdleUnits: function () {
        var list = [];
        for (var unit of this.unitList) {
            if (unit.state == 'idle') {
                list.push(unit);
            }
        }
        return list;
    },


    getNearestIdleUnit: function (loc) {
        var list = this.getIdleUnits();
        if (list.length == 0) {
            return null;
        }
        var closest = list[0];
        var dist = loc.distance(closest.pos);
        for (var i = 1; i < list.length; i++) {
            var unit = list[i];
            var thisDist = loc.distance(unit.pos);
            if (thisDist < dist) {
                closest = unit;
                dist = thisDist;
            }
        }

        return closest;
    },


    getNearestUnit: function (loc) {
        if (this.unitList.length == 0) {
            return null;
        }
        var closest = this.unitList[0];
        var dist = loc.distance(closest.pos);
        for (var i = 1; i < this.unitList.length; i++) {
            var unit = this.unitList[i];
            var thisDist = loc.distance(unit.pos);
            if (thisDist < dist) {
                closest = unit;
                dist = thisDist;
            }
        }

        return closest;
    },






});