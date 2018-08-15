/*
 * Enemy AI controller entity
 */
game.AI = me.Renderable.extend({

    init: function (settings) {
        // call the parent constructor
        // (zero size makes this object non-renderable, so the Renderable.draw method won't get called)
        this._super(me.Renderable, 'init', [0, 0, 0, 0]);


        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;

        this.spawnPoint = settings.spawnPoint;
        this.base = settings.base;
        this.resourcePointsCaptured = 0;
        this.resourcePointsPending = 0;

        this.flag = settings.flag;
        this.playerFlag = settings.playerFlag;
        this.unitList = [];

        // Perform a computation after elapsed number of frames (~ 60 frames per second).
        // Since we don't really need to do computation every frame for high-level strategy
        // This is a parameter that can be tweaked to hopefully alter the difficulty of the AI

        if (settings.difficulty == "Easy") {
            game.sylvanlog("Easy difficulty.");

            this.processInterval = 240;
        } else {
            game.sylvanlog("Hard difficulty.");

            this.processInterval = 120;
            game.data.enemy.unitResources *= 1.5;
            game.data.enemy.resourceRateBoost = 4.0;
            game.data.enemy.changeResourceRate(game.data.enemy.resourceRate);
        }

        // Set the timing variables
        this.processAccumulator = 0;


        this.resourceCapturePriorities = [8, 5, 3, 1, 1, 1];    // Priority level for capturing 1 resource point, 2 resource points, 3 resource points, 4 resource points, etc.
        this.unitQtyPriorities = [10, 9, 7, 5, 3, 1, 1, 1];     // Priority level for having 1 unit alive, 2 units alive, 3 units alive, etc.
        this.defendFlagPriority = 6;          // Priority for keeping own flag at home base guarded
        this.returnFlagPriority = 9;        // Priority for returning flag if other play captures it
        this.captureFlagPriority = 8;       // Priority to capture other flag

        // Generate a list of all possible units we can buy, so all the attributes of each unit is known by the controller
        this.availableUnits = [];
        let unitNames = me.loader.getJSON("manifest_enemy").units;
        for (let name of unitNames) {
            let unit = me.loader.getJSON(name);
            this.availableUnits.push(unit);
        }

        // Generate list of resource points on the map
        this.resourcePointList = me.game.world.getChildByName("capture_point");

        this.flagRunners = [];

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

        let settings = me.loader.getJSON(name);

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


    // Determine where the player's flag currently is (and note if it is at its base)
    getOtherFlagPosition: function () {
        this.playerFlagAtHome = this.playerFlag.pos.equals(this.playerFlag.homePosition);

    },




    // AI does processing in here
    process: function () {
        game.sylvanlog("AI processing function. Resources:", game.data.enemy.unitResources, "Rate:", game.data.enemy.resourceRate);

        // Generate priorities object
        let priorities = {
            acquireResource: this.resourceCapturePriorities[this.resourcePointsPending],
            acquireUnit: this.unitQtyPriorities[this.unitList.length],
            guardFlag: this.flag.isHome() ? this.defendFlagPriority : 0,
            returnFlag: this.flag.isHome() ? 0 : this.returnFlagPriority,
            captureFlag: this.captureFlagPriority
        };

        let highestPriority = this.getHighestPriority(priorities);

        /*
         * Flag return:
         * If my flag is not at home and is dropped, send someone to go and return it
         */
        if (!this.flag.isHome()) {
            
            // Find the closest unit to the dropped flag and send him to pick it up or chase down the goon carrying it away
            var dest = new me.Vector2d(this.flag.pos.x, this.flag.pos.y + 20);
            let unit = this.getNearestUnit(dest);
            if (unit) {
                unit.command({ type: "return flag", x: dest.x, y: dest.y });
                return;
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
                let unit = this.getNearestUnit(dest);
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
           
                nameOfUnit = this.getLongestUnitICanAfford();
                if (nameOfUnit == "") {
                    game.sylvanlog("Enemy controller: cannot afford a flag guard at this time. Resources:", game.data.enemy.unitResources);
                } else {
                    // Do I have an idle unit I can deploy?
                    let flagLoc = new me.Vector2d(this.flag.pos.x, this.flag.pos.y);
                    var unit = this.getNearestIdleUnit(flagLoc);
                    if (unit != null) {
                        unit.command({ type: "guard flag", x: flagLoc.x, y: flagLoc.y });
                    } else {
                        // No unit to deploy, let's go ahead and buy it
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

            // See if I can purchase a new unit
            nameOfUnit = this.getToughestUnitICanAfford();
            if (nameOfUnit == "") {
                game.sylvanlog("Enemy controller: cannot afford a gatherer at this time. Resources:", game.data.enemy.unitResources);
            } else {
                // Do I have an idle unit I can deploy?
                // Find a unit near the middle of the map
                blueflagstand = me.game.world.getChildByName("blueflagstand")[0];
                redflagstand = me.game.world.getChildByName("redflagstand")[0];
                dist = blueflagstand.pos.distance(redflagstand.pos);
                targetLoc = new me.Vector2d(blueflagstand.pos.x + dist.x/2, blueflagstand.pos.y + dist.y/2);
                gatherer = this.getNearestIdleUnit(targetLoc);
                if (gatherer == null) {
                    // No unit to deploy, let's go ahead and buy it
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
        if (defenders.length < 2) {
            nameOfUnit = this.getStrongestUnitICanAfford();
            if (nameOfUnit == "") {
                game.sylvanlog("Enemy controller: cannot afford a defender at this time. Resources:", game.data.enemy.unitResources);
            } else {
                this.buyUnit(nameOfUnit);
                let defender = this.unitList[this.unitList.length - 1];

                let nearestResource = this.getNearestResourcePoint(this.base.pos);
                game.sylvanlog("nearest resource:", nearestResource.pos.toString());
                var dest;
                if (defenders.length == 0) {
                    dest = new me.Vector2d(nearestResource.pos.x + 150, nearestResource.pos.y + nearestResource.height * 0.5 + 250);
                } else {
                    let otherDefender = defenders[0];
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
         * Start sending units to capture the flag
         */
        game.sylvanlog("Enemy controller: check flag runners");
        nameOfUnit = this.getFastestUnitICanAfford();
        if (nameOfUnit != "") {
            let unit = me.loader.getJSON(nameOfUnit);
            if (unit.speed > 2) {
                // Purchase it
                this.buyUnit(nameOfUnit);
                let runner = this.unitList[this.unitList.length - 1];
                var dest = new me.Vector2d(this.playerFlag.pos.x, this.playerFlag.pos.y + 20);
                runner.command({ type: "capture flag", x: dest.x, y: dest.y });
                return;
            } else {
                // Continue waiting until we can afford a faster unit. Hopefully we are gathering resources during this time
                game.sylvanlog("Enemy controller: cannot afford a flag runner of speed 2 at this time. Resources:", game.data.enemy.unitResources);
            }
        } else {
            game.sylvanlog("Enemy controller: cannot afford any flag runner at this time. Resources:", game.data.enemy.unitResources);
        }

        

    },



    getHighestPriority: function (priorities) {
        var highestP = "";
        var highVal = 0;
        for (let p in priorities) {
            if (priorities[p] > highVal) {
                highVal = priorities[p];
                highestP = p;
            } else if (priorities[p] == highVal) {
                // need a tie breaker.
                if (Math.floor(Math.random() * 2) == 0) {
                    highVal = priorities[p];
                    highestP = p;
                }
            } else {
                // Do nothing
            }
        }

        return highestP;
    },


    getUnitActionPriority: function (priorities) {
        var highestP = "";
        var highVal = 0;
        for (let p in priorities) {
            if (p == "acquireUnit") {
                continue;
            }
            if (priorities[p] > highVal) {
                highVal = priorities[p];
                highestP = p;
            } else if (priorities[p] == highVal) {
                // need a tie breaker.
                if (Math.floor(Math.random() * 2) == 0) {
                    highVal = priorities[p];
                    highestP = p;
                }
            } else {
                // Do nothing
            }
        }

        return highestP;
    },


    // Unit with highest speed attribute whose cost is less than or equal to my current resource count
    getFastestUnitICanAfford: function () {
        var fastest = "";
        var highSpeed = 0;
        var highAtt = 0;
        var highDef = 0;
        var loCost = 0;
        for (let unit of this.availableUnits) {
            if (unit.cost > game.data.enemy.unitResources) {
                continue;
            }

            if (unit.speed > highSpeed) {
                fastest = unit.name;
                highSpeed = unit.speed;
                highAtt = unit.attack;
                highDef = unit.defense;
                loCost = unit.cost;
            } else if (unit.speed == highSpeed) {
                // need a tie breaker
                if (unit.defense == highDef) {
                    // need another tie breaker
                    if (unit.attack == highAtt) {
                        // All attributes are the same, go with the cheaper one
                        if (unit.cost < loCost) {
                            // The new unit wins
                            fastest = unit.name;
                            highSpeed = unit.speed;
                            highAtt = unit.attack;
                            highDef = unit.defense;
                            loCost = unit.cost;
                        } else {
                            // Stick with existing fastest unit
                        }
                    }
                    if (unit.attack > highAtt) {
                        // The new unit wins
                        fastest = unit.name;
                        highSpeed = unit.speed;
                        highAtt = unit.attack;
                        highDef = unit.defense;
                        loCost = unit.cost;
                    }
                }

                if (unit.defense > highDef) {
                    // The new unit wins
                    fastest = unit.name;
                    highSpeed = unit.speed;
                    highAtt = unit.attack;
                    highDef = unit.defense;
                    loCost = unit.cost;
                }

            }
        }

        return fastest;
    },


    // Unit with highest attack attribute whose cost is less than or equal to my current resource count
    getStrongestUnitICanAfford: function () {
        var strongest = "";
        var highSpeed = 0;
        var highAtt = 0;
        var highDef = 0;
        var loCost = 0;
        for (let unit of this.availableUnits) {
            if (unit.cost > game.data.enemy.unitResources) {
                continue;
            }

            if (unit.attack > highAtt) {
                strongest = unit.name;
                highSpeed = unit.speed;
                highAtt = unit.attack;
                highDef = unit.defense;
                loCost = unit.cost;
            } else if (unit.attack == highAtt) {
                // need a tie breaker
                if (unit.defense == highDef) {
                    // need another tie breaker
                    if (unit.speed == highSpeed) {
                        // All attributes are the same, go with the cheaper one
                        if (unit.cost < loCost) {
                            // The new unit wins
                            strongest = unit.name;
                            highSpeed = unit.speed;
                            highAtt = unit.attack;
                            highDef = unit.defense;
                            loCost = unit.cost;
                        } else {
                            // Stick with existing unit
                        }
                    }
                    if (unit.speed > highSpeed) {
                        // The new unit wins
                        strongest = unit.name;
                        highSpeed = unit.speed;
                        highAtt = unit.attack;
                        highDef = unit.defense;
                        loCost = unit.cost;
                    }
                }

                if (unit.defense > highDef) {
                    // The new unit wins
                    strongest = unit.name;
                    highSpeed = unit.speed;
                    highAtt = unit.attack;
                    highDef = unit.defense;
                    loCost = unit.cost;
                }

            }
        }

        return strongest;
    },


    // Unit with highest defense attribute whose cost is less than or equal to my current resource count
    getToughestUnitICanAfford: function () {
        var toughest = "";
        var highSpeed = 0;
        var highAtt = 0;
        var highDef = 0;
        var loCost = 0;
        for (let unit of this.availableUnits) {
            if (unit.cost > game.data.enemy.unitResources) {
                continue;
            }

            if (unit.defense > highDef) {
                toughest = unit.name;
                highSpeed = unit.speed;
                highAtt = unit.attack;
                highDef = unit.defense;
                loCost = unit.cost;
            } else if (unit.defense == highDef) {
                // need a tie breaker
                if (unit.attack == highAtt) {
                    // need another tie breaker
                    if (unit.speed == highSpeed) {
                        // All attributes are the same, go with the cheaper one
                        if (unit.cost < loCost) {
                            // The new unit wins
                            toughest = unit.name;
                            highSpeed = unit.speed;
                            highAtt = unit.attack;
                            highDef = unit.defense;
                            loCost = unit.cost;
                        } else {
                            // Stick with existing fastest unit
                        }
                    }
                    if (unit.speed > highSpeed) {
                        // The new unit wins
                        toughest = unit.name;
                        highSpeed = unit.speed;
                        highAtt = unit.attack;
                        highDef = unit.defense;
                        loCost = unit.cost;
                    }
                }

                if (unit.attack > highAtt) {
                    // The new unit wins
                    toughest = unit.name;
                    highSpeed = unit.speed;
                    highAtt = unit.attack;
                    highDef = unit.defense;
                    loCost = unit.cost;
                }

            }
        }

        return toughest;
    },


    // Unit with highest range attribute whose cost is less than or equal to my current resource count
    getLongestUnitICanAfford: function () {
        var longest = "";
        var highSpeed = 0;
        var highAtt = 0;
        var highRange = 0;
        var highDef = 0;
        var loCost = 0;
        for (let unit of this.availableUnits) {
            if (unit.cost > game.data.enemy.unitResources) {
                continue;
            }

            if (unit.range > highRange) {
                longest = unit.name;
                highSpeed = unit.speed;
                highRange = unit.range;
                highAtt = unit.attack;
                highDef = unit.defense;
                loCost = unit.cost;
            } else if (unit.range == highRange) {
                // need a tie breaker
                if (unit.attack == highAtt) {
                    // need another tie breaker
                    if (unit.defense == highDef) {
                        // All attributes are the same, go with the cheaper one
                        if (unit.cost < loCost) {
                            // The new unit wins
                            longest = unit.name;
                            highSpeed = unit.speed;
                            highRange = unit.range;
                            highAtt = unit.attack;
                            highDef = unit.defense;
                            loCost = unit.cost;
                        } else {
                            // Stick with existing fastest unit
                        }
                    }
                    if (unit.defense > highDef) {
                        // The new unit wins
                        longest = unit.name;
                        highSpeed = unit.speed;
                        highRange = unit.range;
                        highAtt = unit.attack;
                        highDef = unit.defense;
                        loCost = unit.cost;
                    }
                }

                if (unit.attack > highAtt) {
                    // The new unit wins
                    longest = unit.name;
                    highSpeed = unit.speed;
                    highRange = unit.range;
                    highAtt = unit.attack;
                    highDef = unit.defense;
                    loCost = unit.cost;
                }

            }
        }

        return longest;
    },


    getNearestResourcePoint: function(loc) {
        let resourceList = me.game.world.getChildByName("capture_point");
        var index = -1;
        var dist = 100000;
        var destPoint = null;
        for (var i = 0; i < resourceList.length; i++) {
            let point = resourceList[i];
            
            let thisDist = loc.distance(point.pos);
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
            return;
        }
        
        game.sylvanlog(unit);
        let resourceList = me.game.world.getChildByName("capture_point");
        var index = -1;
        var dist = 100000;
        var destPoint = null;
        for (var i = 0; i < resourceList.length; i++) {
            let point = resourceList[i];
            if (point.owner != null) {
                continue;
            }
            // Check other units to see if they've been ordered to capture the same resource point
            var alreadyOrdered = false;
            for (let eachUnit of this.unitList) {
                let orderPoint = eachUnit.currentOrders.point;
                if (orderPoint != null && orderPoint == point) {
                    alreadyOrdered = true;
                }
            }
            if (alreadyOrdered) {
                continue;
            }
            let thisDist = unit.pos.distance(point.pos);
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


    getDefenders: function() {
        var list = [];
        for (let unit of this.unitList) {
            if (unit.currentOrders.type == 'defend') {
                list.push(unit);
            }
        }
        return list;
    },


    getUnitWithOrders: function(type) {
        var theUnit = null;
        for (let unit of this.unitList) {
            if (unit.currentOrders.type == type) {
                theUnit = unit;
            }
        }
        return theUnit;
    },



    getIdleUnits: function() {
        var list = [];
        for (let unit of this.unitList) {
            if (unit.state == 'idle') {
                list.push(unit);
            }
        }
        return list;
    },


    getNearestIdleUnit: function(loc) {
        var list = this.getIdleUnits();
        if (list.length == 0) {
            return null;
        }
        var closest = list[0];
        var dist = loc.distance(closest.pos);
        for (var i = 1; i < list.length; i++) {
            let unit = list[i];
            var thisDist = loc.distance(unit.pos);
            if (thisDist < dist) {
                closest = unit;
                dist = thisDist;
            }
        }

        return closest;
    },


    getNearestUnit: function(loc) {
        if (this.unitList.length == 0) {
            return null;
        }
        var closest = this.unitList[0];
        var dist = loc.distance(closest.pos);
        for (var i = 1; i < this.unitList.length; i++) {
            let unit = this.unitList[i];
            var thisDist = loc.distance(unit.pos);
            if (thisDist < dist) {
                closest = unit;
                dist = thisDist;
            }
        }

        return closest;
    },






});