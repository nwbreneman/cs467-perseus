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
