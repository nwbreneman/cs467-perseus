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

    doMove: function () {
        /* Moves unit and sets animations */
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
                }
            } else if (newX < this.pos.x && newY > this.pos.y) {
                if (this.renderable.current.name != this.name + "STANDING_SW") {
                    this.renderable.setCurrentAnimation(this.name + "STANDING_SW");
                    this.explodingName = this.name + "EXPLODING_SW";
                }

            } else if (newX > this.pos.x && newY < this.pos.y) {
                if (this.renderable.current.name != this.name + "STANDING_NE") {
                    this.renderable.setCurrentAnimation(this.name + "STANDING_NE");
                    this.explodingName = this.name + "EXPLODING_NE";
                }

            } else if (newX < this.pos.x && newY < this.pos.y) {
                if (this.renderable.current.name != this.name + "STANDING_NW") {
                    this.renderable.setCurrentAnimation(this.name + "STANDING_NW");
                    this.explodingName = this.name + "EXPLODING_NW";
                }

            } else { //default
                if (this.renderable.current.name != this.name + "STANDING_SE") {
                    this.renderable.setCurrentAnimation(this.name + "STANDING_SE");
                    this.explodingName = this.name + "EXPLODING_SE";
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
    },

    update: function (dt) {
        // check if we need to attack anything
        // But no attack if holding flag
        var enemyPos = this.inRangeOfEnemy();
        this.lastAttack += dt;
        if (enemyPos) {
            if (this.lastAttack >= this.attackCooldown) {
                if (!this.isHoldingFlag) {
                    this.unitAttack(enemyPos.x, enemyPos.y);
                }
                this.lastAttack = 0;
            }
        }

        // if there are points in our moveTo array, move
        if (this.moveTo) {
            this.doMove();
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
        if (this.body) {
            this.body.vel.x = 0;
            this.body.vel.y = 0;
        }
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
            this.pos.x + this.width/2,
            this.pos.y + this.height/2,
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
        if (this.body) {
            this.body.setCollisionMask(me.collision.types.NO_OBJECT);
        }

        if (this.isHoldingFlag) {
            this.carriedFlag.drop();
            this.isHoldingFlag = false;
        }

        //-5 resource rate if engineer dies.
        if (this.name == "engineer") {
            game.data.player1.changeResourceRate(-5);
            game.data.alertMessage.add("ENGINEER DIED: -5 RESOURCES PER SECOND ");
        }

        //death sound effect
        me.audio.play("unit_death");
        game.data.player1.removeUnit(this);

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

        sprite.setCurrentAnimation(this.explodingName, function () {
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
                if (this.detectionBox.containsPoint(unit.pos.x + unit.width/2, unit.pos.y + unit.height/2)) {
                    return {
                        "x": unit.pos.x + unit.width/2,
                        "y": unit.pos.y + unit.height/2
                    }
                }
            }
        }
        return false;
    },

    // Stub function, will be overridden in enemy_unit
    capturedResource: function (resourcePoint) {

    },

    getSaveState: function () {
        data = {
            "name": this.name,
            "pos": { "x": this.pos.x, "y": this.pos.y },
            "isHoldingFlag": this.isHoldingFlag,
        }

        if (this.carriedFlag && this.carriedFlag.teamName) {
            data["carriedFlag"] = this.carriedFlag.teamName;
        } else {
            data["carriedFlag"] = null;
        }

        return data;
    },

    loadSaveState: function (data) {
        this.pos.x = data.pos.x;
        this.pos.y = data.pos.y;
        this.isHoldingFlag = data.isHoldingFlag;
        var flags = me.game.world.getChildByType(game.flag);
        for (var i = 0; i < flags.length; i++) {
            var flag = flags[i];
            if (flag.teamName === data.carriedFlag) {
                this.carriedFlag = flag;
                flag.holder = this;
                break;
            }
        }
    }

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
