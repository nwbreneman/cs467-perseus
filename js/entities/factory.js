/**
 * factory entity
 */
game.factory = me.Entity.extend({
    // Constructor
    init: function (x, y, settings) {
        settings.anchorPoint = new me.Vector2d(0.5, 0.7);
        this._super(me.Entity, "init", [x, y, settings]);
        //set smoking animation
        this.renderable.addAnimation("still", [4]);
        this.renderable.addAnimation("working_green", [4, 5, 6, 7], 60);
        this.renderable.addAnimation("working_red", [0, 1, 2, 3], 60);
        this.renderable.addAnimation("working_blue", [8, 9, 10, 11], 60);
        
        this.renderable.setCurrentAnimation("still");

        this.body.setCollisionMask(game.collisionTypes.PLAYER_UNIT | game.collisionTypes.ENEMY_UNIT);
    },


    setAnimation: function(name) {
    	if (this.renderable.current.name != name) {
    		this.renderable.setCurrentAnimation(name);
    	}
    },

});
