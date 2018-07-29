
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
        this.select();
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
        settings.framewidth = settings.width;
        settings.frameheight = settings.height;

        // redefine the default shape (used to define path) with a shape matching the renderable
        settings.shapes = [];
        settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        this._super(me.Entity, 'init', [x, y, settings]);

        // may need to dynamically set the collision type in the future -- e.g. // to ENEMY_OBJECT if the owning player is the AI?
        this.body.collisionType = me.collision.types.PLAYER_OBJECT;
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
        this.body.setVelocity(this.speed, this.speed);

        this.renderable.anchorPoint.set(0.5, 0.5);

        this.terrainLayer = me.game.world.getChildByName("Plains")[0];
    },

    /** Registers this entity to pointer events when the entity is created */
    onActivateEvent: function () {
        me.input.registerPointerEvent("pointerdown", this, this.pointerDown.bind(this));
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
        this.selected = true;
        return false;
    },

    update: function (dt) {

        // if there are points in our moveTo array, move
        if (this.moveTo) {

            // get the next xy coordinates
            var newX = this.nextMove.x;
            var newY = this.nextMove.y;

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
            console.log("world shape");
            if (this.body.vel.x !== 0 || this.body.vel.y !== 0) {
                this.cancelMovement();
                response.a.pos.sub(response.overlapV);
            }
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
        var start = new Vertex(this.pos.x, this.pos.y);
        var end = new Vertex(x - (this.width / 2), y - (this.height));
        this.moveTo = shortestPath(start, end);
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
        this.holder = {};
        this.homePosition = new me.Vector2d(x, y);
        this.team = settings.team;
        this.body.collisionType = me.collision.types.COLLECTABLE_OBJECT;
        this.body.setMaxVelocity(0, 0);
        this.sendHome();
    },


    // Move to an x, y coordinate without altering its z-value
    moveTo: function (x, y) {
        this.pos.set(x, y, this.pos.z);
    },

    // Send the flag back to base and set the appropriate collision mask setting:
    // When the flag is at home at the player's base, it should only collide with enemy (NPC) objects.
    // Likewise the enemy flag, when stationed at the enemy base, should only collide with PLAYER objects
    sendHome: function () {
        this.moveTo(this.homePosition.x, this.homePosition.y);
        if (this.team === game.data.player1) {
            console.log("setting collision mask to NPC_OBJECT");
            this.body.setCollisionMask(me.collision.types.ENEMY_OBJECT);
        } else {
            console.log("setting collision mask to PLAYER_OBJECT");
            this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT);
        }
    },


    // Query the flag to see if it is safe at the base
    isHome: function () {
        return this.pos.equals(this.homePosition);
    },


    // Collision handling. When the flag is touched, make it so it doesn't keep colliding with the object.
    // When a flag is touched by a friendly:
    //   This means that the flag was not at home base, so we should send it home
    // When a flag is touched by an enemy:
    //   The enemy gets to pick up the flag, and then collisions between the flag and the unit that picked it up should be disabled
    //   Enable collisions between the flag and its own team so it can be returned
    onCollision: function (response, other) {
        console.log("flag collision");
        if (other.team === this.team) {
            // Flag should be returned to base
            console.log("Flag touched by same team");
            this.sendHome();
        } else {
            // Flag should be picked up
            console.log("Flag picked up by opposing team");
            if (this.team === game.data.player1) {
                this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT);
            } else {
                this.body.setCollisionMask(me.collision.types.ENEMY_OBJECT);
            }

            this.isHeld = true;
            this.holder = other;

        }
        return false;
    },


    update: function (dt) {
        me.collision.check(this);

        if (this.isHeld) {
            this.moveTo(this.holder.pos.x + this.holder.width * 0.5, this.holder.pos.y + this.holder.height * 0.5);
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
        this._super(me.Entity, "init", [x, y, settings]);

        //set smoking animation
        this.renderable.addAnimation("smoke", [0, 1, 2, 3], 60);
        this.renderable.setCurrentAnimation("smoke");

        this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT | me.collision.types.ENEMY_OBJECT);
    },

});

/**
 * capture resource point entity
 */
game.capturePoint = me.Entity.extend({
    init: function (x, y, settings) {
        this._super(me.Entity, "init", [x, y, settings]);
        this.owner = ""; //human or AI currently owns, or "" for nobody owns

        //Mark: not sure what collision type the capture point will need yet
        this.body.collisionType = me.collision.types.NO_OBJECT;

        this.isKinematic = true;
    },

    update: function (x, y, settings) { },

    onCollision: function (response, other) {
        if (this.owner == "") {
            //capture point
        } else { }
    }
});
