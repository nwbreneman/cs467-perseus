/**
 * Unit Spawn Point
 */
// game.SpawnPoint = me.Entity.extend({
//     init: function (x, y, settings) {
//         this._super(me.Entity, 'init', [x, y, settings]);
//         this.isKinematic = true;
//     }
// });

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
        this.body.collisionType = me.collision.types.NPC_OBJECT;
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
        if (this.moveTo !== null) {
            var newX = this.moveTo.x;
            var newY = this.moveTo.y;

            if (newX && newX > this.pos.x) {
                this.body.vel.x += this.body.accel.x * me.timer.tick;
            } else if (newX && newX < this.pos.x) {
                this.body.vel.x -= this.body.accel.x * me.timer.tick;
            }

            if (newY && newY > this.pos.y) {
                this.body.vel.y += this.body.accel.y * me.timer.tick;
            } else if (newY && newY < this.pos.y) {
                this.body.vel.y -= this.body.accel.y * me.timer.tick;
            }

            if (this.atTargetPos(this.pos.x, newX, this.speed)) {
                this.moveTo.x = null;
                this.body.vel.x = 0;
            }

            if (this.atTargetPos(this.pos.y, newY, this.speed)) {
                this.moveTo.y = null;
                this.body.vel.y = 0;
            }

            if (this.moveTo.x === null && this.moveTo.y === null) {
                this.moveTo = null;
            }

            this.selectedBox.pos.x = this.pos.x + (this.width / 2);
            this.selectedBox.pos.y = this.pos.y + (this.height / 1.25);

        }

        if (this.selected) {
            if (!this.selectedBox && this.player.ptype === "Human") {
                pos = this.getBounds().pos;
                this.selectedBox = me.game.world.addChild(me.pool.pull("selectedShape", pos.x + (this.width / 2), pos.y + (this.height / 1.25)), 2);
            }
        } else {
            if (this.selectedBox) {
                me.game.world.removeChild(this.selectedBox);
                this.selectedBox = null;
            }
        }

        this.body.update(dt);

        me.collision.check(this);

        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    onCollision: function (response) {
        if (response.aInB) {
            response.a.pos.sub(response.overlapV);
        }

        var aCollType = response.a.body.collisionType;
        var bCollType = response.b.body.collisionType;
        var NPC_OBJECT = me.collision.types.NPC_OBJECT;

        if (aCollType === NPC_OBJECT || bCollType === NPC_OBJECT) {
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
        this.moveTo = {
            "x": x - (this.width / 2),
            "y": y - (this.height)
        };
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
    },

});

