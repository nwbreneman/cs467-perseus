
/**
 * Base Entity
 */
game.Base = me.Entity.extend({
    init: function (x, y, settings) {
        this._super(me.Entity, 'init', [x, y, settings]);
        this.player = game.data[settings.player];
        this.selected = false;
    },

    /**
     * If base owner is human, let human click on it
     */
    onActivateEvent: function () {
        if (this.player.ptype === "Human") {
            me.input.registerPointerEvent("pointerdown", this, this.pointerDown.bind(this));
        }
    },

    /**
     * Clicking a base displays the HUD to buy units.
     */
    pointerDown: function () {
        if (!this.selected) {
            this.select();
        } else {
            this.deselect();
        }
        return false;
    },

    select: function () {
        this.selected = true;
    },

    deselect: function () {
        this.selected = false;
    }
});


/**
 * Unit Entity
 */
game.Unit = me.Entity.extend({
    init: function (x, y, settings) {

        // below resizing was adapted from the enemy section of:
        // http://melonjs.org/en/home/platformer#part5

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        // settings.framewidth = settings.width;
        //settings.frameheight = settings.height;

        //settings.width = settings.framewidth * 0.3;
        //settings.height = settings.frameheight * 0.25;
        settings.width = settings.myWidth;
        settings.height = settings.myHeight;

        console.log("width: " + settings.width);
        console.log("height: " + settings.height);
        console.log("framewidth: " + settings.framewidth);
        console.log("frameheight: " + settings.frameheight);

        // redefine the default shape (used to define path) with a shape matching the renderable
        //settings.shapes = [];
        //settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        this._super(me.Entity, 'init', [x, y, settings]);

        this.body.collisionType = game.collisionTypes.PLAYER_UNIT;
        this.moveTo = null;
        this.alwaysUpdate = true;
        this.body.bounce = 0;

        this.selected = false;
        this.selectedBox = null;
        this.name = settings.name;
        this.cost = settings.cost;
        this.attack = settings.attack;
        this.range = settings.range;
        this.speed = settings.speed;
        this.defense = settings.defense;
        this.type = settings.type;
        this.image = settings.image;
        this.projectile = settings.projectile;
        this.body.setVelocity(this.speed, this.speed);
        this.isHoldingFlag = false;
        this.carriedFlag = {};
        this.team = game.data.player1;
        this.lastAttack = 0;
        this.attackCooldown = settings.attackCooldown || 2000;
        this.deathImage = settings.deathimage;

        // find correct projectile settings
        var projectiles = me.loader.getJSON("projectiles").settings;
        for (var i = 0; i < projectiles.length; i++) {
            if (projectiles[i].name === this.projectile) {
                this.projectileSettings = projectiles[i];
                break;
            }
        }

        // Mark:
        // add standing animations for all four facing directions
        console.log(this.renderable);
        game.sylvanlog(settings.xAnchor, settings.yAnchor);
        this.renderable.anchorPoint.set(settings.xAnchor, settings.yAnchor);
        this.renderable.addAnimation(this.name + "STANDING_SE", [0, 1, 2, 3], 60);
        this.renderable.addAnimation(this.name + "STANDING_SW", [4, 5, 6, 7], 60);
        this.renderable.addAnimation(this.name + "STANDING_NW", [8, 9, 10, 11], 60);
        this.renderable.addAnimation(this.name + "STANDING_NE", [12, 13, 14, 15], 60);
        this.explodingName = this.name + "EXPLODING_SE";
        // init facing southeast
        this.renderable.setCurrentAnimation(this.name + "STANDING_SE");


        this.terrainLayer = me.game.world.getChildByName("Plains")[0];
    },

    /** Registers this entity to pointer events when the entity is created */
    onActivateEvent: function () {
        me.input.registerPointerEvent(
            "pointerdown", this, this.pointerDown.bind(this));

        this.detectionBox = new me.Ellipse(
            this.pos.x + (this.width * 0.5),
            this.pos.y + (this.height * 0.5),
            this.range * 2,
            this.range * 2
        );
    },

    /**
     * Select single unit with a click; holding shift adds multiple units
     * to selection.
     */
    pointerDown: function () {
        if (me.input.isKeyPressed("shift")) {
            this.player.addSelectedUnit(this);
        } else {
            this.player.selectUnit(this);
        }
        this.select();
        return false;
    },


    update: function (dt) {
        // check if we need to attack anything
        // But no attack if holding flag
        var enemyPos = this.inRangeOfEnemy();
        if (enemyPos) {
            this.lastAttack += dt;
            if (this.lastAttack >= this.attackCooldown) {
                if (!this.isHoldingFlag) {
                    this.unitAttack(enemyPos.x, enemyPos.y);
                }
                this.lastAttack = 0;
            }
        }
        

        // if there are points in our moveTo array, move
        if (this.moveTo) {

            // get the next xy coordinates
            var newX = this.nextMove.x;
            var newY = this.nextMove.y;

            //Mark:
            //turn standing animation based on whether new (x, y) is greater than or less than old (X, Y)
            /*

            (-x,  y) | (x,  y)
            __________________

            (-x, -y) | (x, -y)

            */
            //

            if (newX && newY) {
                if (newX > this.pos.x && newY > this.pos.y) {
                    if (this.renderable.current.name != this.name + "STANDING_SE") {
                        this.renderable.setCurrentAnimation(this.name + "STANDING_SE");
                        this.explodingName = this.name + "EXPLODING_SE";
                        console.log("set current animation to " + this.name + "STANDING_SE");
                    }
                } else if (newX < this.pos.x && newY > this.pos.y) {
                    if (this.renderable.current.name != this.name + "STANDING_SW") {
                        this.renderable.setCurrentAnimation(this.name + "STANDING_SW");
                        this.explodingName = this.name + "EXPLODING_SW";
                        console.log("set current animation to " + this.name + "STANDING_SW");
                    }

                } else if (newX > this.pos.x && newY < this.pos.y) {
                    if (this.renderable.current.name != this.name + "STANDING_NE") {
                        this.renderable.setCurrentAnimation(this.name + "STANDING_NE");
                        this.explodingName = this.name + "EXPLODING_NE";
                        console.log("set current animation to " + this.name + "STANDING_NE");
                    }

                } else if (newX < this.pos.x && newY < this.pos.y) {
                    if (this.renderable.current.name != this.name + "STANDING_NW") {
                        this.renderable.setCurrentAnimation(this.name + "STANDING_NW");
                        this.explodingName = this.name + "EXPLODING_NW";
                        console.log("set current animation to " + this.name + "STANDING_NW");
                    }

                } else { //default
                    if (this.renderable.current.name != this.name + "STANDING_SE") {
                        this.renderable.setCurrentAnimation(this.name + "STANDING_SE");
                        this.explodingName = this.name + "EXPLODING_SE";
                        console.log("defaulted to set current animation to " + this.name + "STANDING_SE");
                    }
                }
            }

            // accelerate in the correct X direction
            if (newX && newX > this.pos.x) {
                this.body.vel.x += this.body.accel.x * me.timer.tick;
            } else if (newX && newX < this.pos.x) {
                this.body.vel.x -= this.body.accel.x * me.timer.tick;
            }

            // accelerate in the correct Y direction
            if (newY && newY > this.pos.y) {
                this.body.vel.y += this.body.accel.y * me.timer.tick;
            } else if (newY && newY < this.pos.y) {
                this.body.vel.y -= this.body.accel.y * me.timer.tick;
            }

            // stop accelerating on X axis when we reach the (rough) destination
            if (this.atTargetPos(this.pos.x, newX, this.speed)) {
                this.nextMove.x = null;
                this.body.vel.x = 0;
            }

            // stop accelerating on Y axis when we reach the (rough) destination
            if (this.atTargetPos(this.pos.y, newY, this.speed)) {
                this.nextMove.y = null;
                this.body.vel.y = 0;
            }

            // if we stopped accelerating on both axes, check if there's another
            // point in our moveTo path; if not, set both to null to stop moving
            if (this.nextMove.x === null && this.nextMove.y === null) {
                if (this.moveTo.length > 0) {
                    this.nextMove = this.moveTo.shift();
                } else {
                    this.nextMove = null;
                    this.moveTo = null;
                }
            }

            // update selectedBox position as we move as well
            if (this.selectedBox) {
                this.selectedBox.pos.x = this.pos.x + (this.width / 2);
                this.selectedBox.pos.y = this.pos.y + (this.height / 1.25);
            }

            // update detection box position
            this.detectionBox.pos.x = this.pos.x + (this.width * 0.5);
            this.detectionBox.pos.y = this.pos.y + (this.height * 0.5);
        }

        // if unit is selected, belongs to a human player and has no box
        // already, draw it
        if (this.selected) {
            if (!this.selectedBox && this.player.ptype === "Human") {
                pos = this.getBounds().pos;
                this.selectedBox = me.game.world.addChild(me.pool.pull("selectedShape", pos.x + (this.width / 2), pos.y + (this.height / 1.25)), 2);
            }
        } else {
            // remove select box if present and unit not selected
            if (this.selectedBox) {
                me.game.world.removeChild(this.selectedBox);
                this.selectedBox = null;
            }
        }

        this.body.update(dt);

        me.collision.check(this);

        // return true to update if we are moving
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    onCollision: function (response, other) {
        if (response.aInB) {
            response.a.pos.sub(response.overlapV);
        }

        var aCollType = response.a.body.collisionType;
        var bCollType = response.b.body.collisionType;
        var NPC_OBJECT = me.collision.types.NPC_OBJECT;

        if (aCollType === NPC_OBJECT || bCollType === NPC_OBJECT || other.body.collisionType == me.collision.types.WORLD_SHAPE) {
            if (this.body.vel.x !== 0 || this.body.vel.y !== 0) {
                response.a.pos.sub(response.overlapN);
            }
            return true;
        }
        return false;
    },

    deselect: function () {
        this.selected = false;
    },

    select: function () {
        this.selected = true;
    },

    move: function (x, y) {
        this.cancelMovement();
        var start = new Vertex(this.pos.x, this.pos.y);
        var end = new Vertex(x - (this.width / 2), y - (this.height));
        this.moveTo = shortestPath(start, end, this);
        // set next move immediately to allow for change in direction
        this.nextMove = this.moveTo.shift();
    },

    atTargetPos: function (current, target, tol) {
        var n = Math.round(current);
        var m = Math.round(target);
        var max = m + tol;
        var min = m - tol;

        if (n <= max && n >= min) {
            return true;
        }

        return false;
    },

    cancelMovement: function () {
        this.body.vel.x = 0;
        this.body.vel.y = 0;
        this.moveTo = null;
        this.nextMove = null;
    },

    unitAttack: function (x, y) {
        settings = this.projectileSettings;
        settings.targetX = x;
        settings.targetY = y;
        settings.damage = this.attack;
        settings.type = this.type;
        settings.ownerUnit = this.body.collisionType;
        me.game.world.addChild(me.pool.pull(
            this.projectile,
            this.pos.x + this.width,
            this.pos.y + (this.height / 2),
            settings
        ));
    },

    takeDamage: function (damage) {
        this.defense -= damage;

        //sprite flickers 0.5 second when unit takes damage
        this.renderable.flicker(500);

        if (this.defense <= 0) {
            this.die();
        }
    },

    die: function () {
        
        if (this.selectedBox) {
            me.game.world.removeChild(this.selectedBox);
            this.selectedBox = null;
        }
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);
        if (this.isHoldingFlag) {
            this.carriedFlag.drop();
            this.isHoldingFlag = false;
        }

        //-5 resource rate if engineer dies.
        if (this.name == "engineer") {
            game.data.player1.changeResourceRate(-5);
            game.data.alertMessage.add("ENGINEER DIED: -5 RESOURCES PER SECOND ");
        }
        
        me.audio.play("unit_death");
        game.data.player1.removeUnit(this);
        
        //death sound effect
        
        
        // Add an exploding animated sprite
        var sprite = new me.Sprite(this.pos.x, this.pos.y, {
            image: this.deathImage,
            framewidth: 156,
            frameheight: 194,
            anchorPoint: new me.Vector2d(0.4, 0.5),
        });

        sprite.addAnimation(this.name + "EXPLODING_SE", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 50);
        sprite.addAnimation(this.name + "EXPLODING_SW", [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], 50);
        sprite.addAnimation(this.name + "EXPLODING_NW", [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35], 50);
        sprite.addAnimation(this.name + "EXPLODING_NE", [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], 50);

        sprite.setCurrentAnimation(this.explodingName, function() {
            me.game.world.removeChild(sprite);
            return false;
        });

        me.game.world.addChild(sprite);
        me.game.world.removeChild(this);

    },

    inRangeOfEnemy: function () {
        // using unit's range, each update, check if within firing range of
        // an enemy

        var allUnits = me.game.world.getChildByType(game.Unit);
        allUnits = allUnits.concat(
            me.game.world.getChildByType(game.EnemyUnit));
        for (var i = 0; i < allUnits.length; i++) {
            var unit = allUnits[i];
            if (this.player.ptype !== unit.player.ptype) {
                if (this.detectionBox.containsPoint(unit.pos.x, unit.pos.y)) {
                    return {
                        "x": unit.pos.x,
                        "y": unit.pos.y
                    }
                }
            }
        }
        return false;
    },

    // Stub function, will be overridden in enemy_unit
    capturedResource: function (resourcePoint) {

    },

});


/**
 * Shape indicating a unit has been selected
 */
game.selectedShape = me.Sprite.extend({
    init: function (x, y) {
        this._super(me.Sprite, 'init', [x, y, { image: "selection", framewidth: 128, frameheight: 64 }]);
        this.addAnimation("loop", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], 50);
        this.setCurrentAnimation("loop");
    },

});


/**
 * Flag entity
 */
game.flag = me.Entity.extend({
    // Constructor
    init: function (x, y, settings) {
        this._super(me.Entity, "init", [x, y, settings]);
        this.renderable.anchorPoint.set(0.2, 0.7);
        this.renderable.addAnimation("flutter", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], 60);
        this.renderable.setCurrentAnimation("flutter");
        this.alwaysUpdate = true;
        this.isHeld = false;
        this.other = {};
        this.homePosition = new me.Vector2d(x, y);
        this.team = settings.team;
        this.body.collisionType = me.collision.types.COLLECTABLE_OBJECT;
        this.body.setCollisionMask(game.collisionTypes.PLAYER_UNIT | game.collisionTypes.ENEMY_UNIT);
        this.body.setMaxVelocity(0, 0);
        this.sendHome();

    },


    // Move to an x, y coordinate without altering its z-value
    moveTo: function (x, y) {
        this.pos.set(x, y, this.pos.z);
    },


    // Send the flag back to base
    sendHome: function () {
        //console.log("Sending flag home");
        this.moveTo(this.homePosition.x, this.homePosition.y);

    },


    // Query the flag to see if it is safe at the base
    isHome: function () {
        return this.pos.equals(this.homePosition);
    },


    // Drop the flag if the unit that was carrying it has died
    // At this point, it can be touched by either team, so set the collision mask appropriately
    drop: function () {
        //console.log("Flag dropped");
        this.isHeld = false;
        this.holder = {};
        this.body.setCollisionMask(game.collisionTypes.PLAYER_UNIT | game.collisionTypes.ENEMY_UNIT);
    },


    // Collision handling. When the flag is touched, make it so it doesn't keep colliding with the object.
    // When a flag is touched by a friendly:
    //   Do nothing if flag is at home, otherwise send it home
    // When a flag is touched by an enemy:
    //   The enemy gets to pick up the flag, and then collisions between the flag and the unit that picked it up should be disabled
    onCollision: function (response, other) {
        //console.log("flag collision");
        if (other.team === this.team) {
            // Touched by a member of this flag's team

            // If this flag is at home, and the unit is carrying the opposing team's flag, then it's a win
            if (this.isHome()) {
                //console.log("Flag is at home");
                if (other.isHoldingFlag) {
                    game.sylvanlog("VICTORY!");

                } else {
                    // If this flag is at home, and the unit is NOT carrying a flag, then do nothing
                    return false;
                }
            } else {
                // If this flag is not at home, then the flag should be returned to base
                //console.log("Flag touched by same team");
                this.isHeld = false;
                this.sendHome();
            }

        } else {
            // Touched by a member of the opposite team
            // Flag should be picked up and no more collision checks unless the flag is dropped by the unit carrying it
            //console.log("Flag picked up by opposing team");
            this.body.setCollisionMask(me.collision.types.NO_OBJECT);
            this.isHeld = true;
            this.holder = other;
            other.isHoldingFlag = true;
            other.carriedFlag = this;
            me.audio.play("short_horn");
        }
        return false;
    },


    update: function (dt) {

        if (this.isHeld) {
            this.moveTo(this.holder.pos.x + this.holder.width * 0.5, this.holder.pos.y + this.holder.height * -0.1);
        }

        this._super(me.Entity, "update", [dt]); // For the animation to continue to work
        return true;
    },


});

/**
 * factory entity
 */
game.factory = me.Entity.extend({
    // Constructor
    init: function (x, y, settings) {
        settings.anchorPoint = new me.Vector2d(0.5, 0.7);
        this._super(me.Entity, "init", [x, y, settings]);
        //set smoking animation
        this.renderable.addAnimation("smoke", [0, 1, 2, 3], 60);
        this.renderable.setCurrentAnimation("smoke");

        this.body.setCollisionMask(game.collisionTypes.PLAYER_UNIT | game.collisionTypes.ENEMY_UNIT);
    },

});

/**
 * capture resource point entity
 */
game.capturePoint = me.Entity.extend({
    init: function (x, y, settings) {
        this._super(me.Entity, "init", [x, y, settings]);
        this.owner = null;
        this.capturingUnit = null;
        this.alwaysUpdate = true;
        this.captureStatus = 0;
        this.lastCaptureCheck = 0;
        this.timeToCapture = 4; // time in seconds
        this.rate = settings.rate || 4.25; // resources gained per second
        this.factoryType = settings.factory_type;
        this.factoryId = settings.factory_id;

        this.body.collisionType = me.collision.types.ACTION_OBJECT;
        this.body.setCollisionMask(game.collisionTypes.PLAYER_UNIT | game.collisionTypes.ENEMY_UNIT);
    },

    /** When the entity is created */
    onActivateEvent: function () {
        this.factory = this.getFactory(this.factoryType, this.factoryId);
    },

    update: function (dt) {
        this.lastCaptureCheck += dt;
        if (this.lastCaptureCheck >= 1000 && this.capturingUnit) {

            if (this.capturingUnit.body) { //Mark: need this extra if-statement to prevent game crashing when a unit on top of a point is killed
                var bodyType = this.capturingUnit.body.collisionType; //janky fix but seems to work?
            }

            // capture point if not already captured for unit's player
            if (bodyType === game.collisionTypes.PLAYER_UNIT) {
                if (this.captureStatus !== this.timeToCapture) {
                    this.captureStatus += 1;
                }
            } else if (bodyType === game.collisionTypes.ENEMY_UNIT) {
                if (this.captureStatus !== -this.timeToCapture) {
                    this.captureStatus -= 1;
                }
            }

            var playerOwner = (this.owner === game.data.player1);
            var playerCapture = (this.captureStatus === this.timeToCapture);
            var enemyOwner = (this.owner === game.data.enemy);
            var enemyCapture = (this.captureStatus === -this.timeToCapture);

            // figure out if there's a change in owner
            // if there is, increase/decrease resource rate as appropriate
            // probably a simpler logical construct here
            if (playerCapture && !playerOwner) {
                if (enemyOwner) {
                    this.owner.changeResourceRate(-this.rate);
                    game.data.alertMessage.add(this.owner.name + " LOSES -" + this.rate + " RESOURCES PER SECOND");
                    me.audio.play("point_lost");
                    this.owner.controlledFactories -= 1;
                }
                this.owner = game.data.player1;
                this.owner.changeResourceRate(this.rate);
                game.data.alertMessage.add(this.owner.name + " GAINS +" + this.rate + " RESOURCES PER SECOND");
                me.audio.play("point_capture");
                this.owner.controlledFactories += 1;
                this.capturingUnit.capturedResource(this);  // notify the unit that it has captured the resource (used by AI)
            } else if (enemyCapture && !enemyOwner) {
                if (playerOwner) {
                    this.owner.changeResourceRate(-this.rate);
                    game.data.alertMessage.add(this.owner.name + " LOSES -" + this.rate + " RESOURCES PER SECOND");
                    me.audio.play("point_lost");
                    this.owner.controlledFactories -= 1;
                }
                this.owner = game.data.enemy;
                this.owner.changeResourceRate(this.rate);
                game.data.alertMessage.add(this.owner.name + " GAINS +" + this.rate + " RESOURCES PER SECOND");
                me.audio.play("point_capture");
                this.owner.controlledFactories += 1;
                this.capturingUnit.capturedResource(this);  // notify the unit that it has captured the resource (used by AI)
            }

            // no owner once status reaches 0
            if (this.captureStatus === 0 && this.owner) {
                this.owner.changeResourceRate(-this.rate);
                game.data.alertMessage.add(this.owner.name + " LOSES - " + this.rate + " RESOURCES PER SECOND");
                me.audio.play("point_lost");
                this.owner = null;
            }

            this.lastCaptureCheck = 0;

            if (!me.collision.check(this)) {
                this.capturingUnit = null;
            }
        } else if (this.capturingUnit) {
            if (this.factory != null) {
                this.factory.renderable.flicker(40);
            }
        }
    },

    onCollision: function (_, other) {
        this.capturingUnit = other;

        return false;
    },

    getFactory: function (type, id) {
        var factory = null;

        var factoryName = "factory_" + type;

        let factoryList = me.game.world.getChildByName(factoryName);
        for (let item of factoryList) {
            if (item.id == id) {
                factory = item;
            }
        }

        return factory;
    },
});

/**
 * Projectile entity for weapons
 */
game.projectile = me.Entity.extend({
    init: function (x, y, settings) {
        this._super(me.Entity, "init", [x, y, settings]);
        this.body.collisionType = me.collision.types.PROJECTILE_OBJECT;
        this.alwaysUpdate = true;
        this.damage = settings.damage;
        this.type = settings.type;
        console.log("projectile fired and its type is " + this.type);
        this.ownerUnit = settings.ownerUnit;
        this.speed = settings.speed;

        // no friendly fire:
        // if fired by a player, only collide with world or enemy units;
        // if fired by an enemy, only collide with world or player units
        if (this.ownerUnit === game.collisionTypes.PLAYER_UNIT) {
            this.body.setCollisionMask(
                me.collision.types.WORLD_SHAPE
                | game.collisionTypes.ENEMY_UNIT
            );
        } else if (this.ownerUnit === game.collisionTypes.ENEMY_UNIT) {
            this.body.setCollisionMask(
                me.collision.types.WORLD_SHAPE
                | game.collisionTypes.PLAYER_UNIT
            );
        }

        this.direction = new me.Vector2d(settings.targetX, settings.targetY);
        this.direction = this.direction.sub(this.pos);
        this.direction = this.direction.normalize();

        this.body.setVelocity(settings.speed, settings.speed);
    },

    update: function (dt) {

        if (this.body.vel.x === 0) {
            this.body.vel.x += this.direction.x * dt;
        }

        if (this.body.vel.y === 0) {
            this.body.vel.y += this.direction.y * dt;
        }

        this.body.update(dt);
        me.collision.check(this);

        return true;
    },

    onCollision: function (_, other) {

        var otherType = other.body.collisionType;

        if (otherType === me.collision.types.WORLD_SHAPE) {
            me.game.world.removeChild(this);
            return true;
        }

        if (otherType === game.collisionTypes.ENEMY_UNIT
            || otherType === game.collisionTypes.PLAYER_UNIT) {
            
            /*
            other.takeDamage(this.damage); //this needs to go in the below checks, leaving for now just testing this.
            */

            // Mark
            // Rock-paper-scissors unit attack balancing. 
            // e.g., If rock type vs scissors type damage is doubled; if scissors vs rock type damage is halved, 
            console.log(other.name + " of type " + other.type + " damaged from projectile of type: " + this.type);
            if(this.type == "paper" && other.type == "rock"){
                console.log("paper hit rock - double this damage: " + this.damage*2);
                other.takeDamage(this.damage*2);
            }
            else if(this.type == "rock" && other.type == "scissors"){
                console.log("rock hit scissors - double this damage: " + this.damage*2);
                other.takeDamage(this.damage*2);

            }
            else if(this.type =="scissors" && other.type == "paper"){
                console.log("scissors hit paper - double this damage: " + this.damage*2);
                other.takeDamage(this.damage*2);

            }
            else if(this.type =="paper" && other.type == "scissors"){
                console.log("paper hit scissors - halve this damage: " + this.damage/2);
                other.takeDamage(this.damage/2);
            }
            else if(this.type =="rock" && other.type == "paper"){
                console.log("rock hit paper - halve this damage: " + this.damage/2);
                other.takeDamage(this.damage/2);
            }
            else if(this.type =="scissors" && other.type == "rock"){
                console.log("scissors hit rock - halve this damage: " + this.damage/2);
                other.takeDamage(this.damage/2); 
            }
            /*
            default: no buff or debuff. flat damage
            */
            else { //no damage buff if not a rock-paper-scissors type match'
                console.log("no damage buff/debuff on hit: " + this.type + " hit " + other.type + " and damage is " + this.damage);
                other.takeDamage(this.damage);
            }


            me.game.world.removeChild(this);
            return true;
        }
    }
});
