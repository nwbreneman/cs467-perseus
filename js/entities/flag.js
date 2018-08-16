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
