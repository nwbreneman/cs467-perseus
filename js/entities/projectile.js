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
            if (this.type == "paper" && other.type == "rock") {
                console.log("paper hit rock - double this damage: " + this.damage * 1.5);
                other.takeDamage(this.damage * 1.5);
            }
            else if (this.type == "rock" && other.type == "scissors") {
                console.log("rock hit scissors - buff this damage: " + this.damage * 1.5);
                other.takeDamage(this.damage * 1.5);

            }
            else if (this.type == "scissors" && other.type == "paper") {
                console.log("scissors hit paper - buff this damage: " + this.damage * 1.5);
                other.takeDamage(this.damage * 1.5);

            }
            else if (this.type == "paper" && other.type == "scissors") {
                console.log("paper hit scissors - nerf this damage: " + this.damage / 1.5);
                other.takeDamage(this.damage / 1.5);
            }
            else if (this.type == "rock" && other.type == "paper") {
                console.log("rock hit paper - nerf this damage: " + this.damage / 1.5);
                other.takeDamage(this.damage / 1.5);
            }
            else if (this.type == "scissors" && other.type == "rock") {
                console.log("scissors hit rock - nerf this damage: " + this.damage / 1.5);
                other.takeDamage(this.damage / 1.5);
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
