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
        this.rate = settings.rate || 7.5; // resources gained per second
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

    getSaveState: function () {
        data = {
            "captureStatus": this.captureStatus,
            "id": this.id
        };

        if (this.owner) {
            data["owner"] = this.owner.name;
        }

        return data;
    },

    loadSaveState: function (data) {
        this.captureStatus = data.captureStatus;
        var players = me.game.world.getChildByType(game.Player);
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            if (player.name === data.owner) {
                this.owner = player;
                break;
            }
        }
    }
});