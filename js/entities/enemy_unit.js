/**
 * EnemyUnit Entity
 */
game.EnemyUnit = game.Unit.extend({
    init: function (x, y, settings) {

        settings.frameheight = 108;
        settings.framewidth = 88;
        settings.height = settings.myHeight;
        settings.width = settings.myWidth; //use myVariables in JSON for defining hitboxes

        this._super(game.Unit, 'init', [x, y, settings]);

        // To be assigned by the enemy controller
        this.controller = settings.controller;
        this.team = game.data.enemy;

        this.state = settings.initialState;
        this.escortTarget = {};

        // Orders take the form of an object, with a type, and some additional settings
        this.currentOrders = {};
        this.moveDestination = new me.Vector2d(0, 0);

        // Temporarily not colliding with WORLD_SHAPE because there are some pathfinding issues at the moment
        this.body.collisionType = game.collisionTypes.ENEMY_UNIT;
        this.body.setCollisionMask(
            game.collisionTypes.PLAYER_UNIT | me.collision.types.COLLECTABLE_OBJECT | me.collision.types.ACTION_OBJECT | me.collision.types.PROJECTILE_OBJECT);

        this.moveUpdateTimeout = 60;
        this.moveUpdateCounter = 0;
    },


    /** When the entity is created */
    onActivateEvent: function () {
        game.sylvanlog("enemy unit is created");

        this.detectionBox = new me.Ellipse(
            this.pos.x + (this.width * 0.5),
            this.pos.y + (this.height * 0.5),
            this.range * 2,
            this.range * 2
        );

        this.changeState(this.state);
    },


    // The enemy controller is issuing a command to this unit. The command is an object, consisting of:
    // { type: string,
    // other parameters: depending on the type }
    // TBD, the unit should act immediately upon receiving a command from the 'boss'
    command: function (order) {
        game.sylvanlog("Enemy unit received command:", order);
        this.currentOrders = order;
        switch (order.type) {
            case 'move to':
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            case 'capture resource':
                if (order.point != null) {
                    this.moveDestination.set(order.point.pos.x, order.point.pos.y + order.point.height * 0.5);
                    this.changeState("moving");
                }
                break;
            case 'capture flag':
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            case 'defend':
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            case 'escort':
                this.escortTarget = order.target;
                this.moveDestination.set(order.target.pos.x, order.target.pos.y);
                this.changeState("moving");
                break;
            case 'guard flag':
                this.moveDestination.set(order.x - 100, order.y + 50);
                game.sylvanlog("Enemy unit: guard flag, located at", order.x, order.y);
                this.changeState("moving");
                break;
            case 'return flag':
                this.previousOrders = this.currentOrders;
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            default:
                game.sylvanlog("command(): order type \'" + order.type + "\' not handled");
                break;
        }


    },

    // Enemy specific override
    die: function () {
        this.changeState('dying');

    },

    pickedUpFlag: function () {
        game.sylvanlog("Enemy unit: picked up the flag.");

        this.controller.report(this, 'got flag');
    },

    capturedResource: function (resourcePoint) {
        game.sylvanlog("Enemy Unit: captured a resource point:", resourcePoint);

        this.changeState("idle");

    },


    // Function to call when you want to switch unit states
    changeState: function (newState) {
        this.leaveState(this.state);
        this.enterState(newState);
    },



    // Called from changeState()
    enterState: function (newState) {
        // Maybe do something interesting here depending on the state
        this.state = newState;

        switch (this.state) {
            case 'spawning':
                game.sylvanlog("enemy unit spawning at spawn point:", this.pos.toString());
                break;
            case 'idle':
                game.sylvanlog("unit is now idle");
                break;
            case 'defending':
                game.sylvanlog("Unit change state to defending");
                break;
            case 'gathering':
                game.sylvanlog("Unit change state to gathering");
                break;
            case 'moving':
                game.sylvanlog("unit is now moving to", this.moveDestination.toString());
                this.move(this.moveDestination.x, this.moveDestination.y);
                break;
            case 'dying':
                
                //-5 resource rate if engineer dies.
                if (this.name == "enemy_engineer") {
                    game.data.player1.changeResourceRate(-5);
                    game.data.alertMessage.add("ENGINEER DIED: -5 RESOURCES PER SECOND ");
                }


                // Start a death animation or particle effect or something
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


                if (this.name == "enemy_biker"){ //if a biker dies
                //spawn civilian
                settings = me.loader.getJSON("enemy_civilian");

                var unit = me.pool.pull("enemy_civilian", 10, 10, settings);
                        unit.pos.x = this.pos.x //- unit.width * 0.5;
                        unit.pos.y = this.pos.y //- unit.height * 1.0;
                        unit.player = game.data.enemy;
                        //this.unitResources -= settings.cost; no cost on death - special effect spawn
                        game.data.enemy.availableUnits.push(unit);
                        game.data.alertMessage.add("ENEMY CIVILIAN DRIVER SURVIVES!");

                        me.game.world.addChild(unit, me.game.world.getChildByName("units")[0].pos.z);
                }
            
                if (this.name == "enemy_jetpack" || this.name == "enemy_plane" || this.name == "enemy_bomber"){ // if a jetpack, plane, or bomber dies
                //spawn infantry
                settings = me.loader.getJSON("enemy_infantry");

                var unit = me.pool.pull("enemy_infantry", 10, 10, settings);
                        unit.pos.x = this.pos.x //- unit.width * 0.5;
                        unit.pos.y = this.pos.y //- unit.height * 1.0;
                        unit.player = game.data.enemy;
                        //this.unitResources -= settings.cost; no cost on death - special effect spawn
                        game.data.enemy.availableUnits.push(unit);
                        game.data.alertMessage.add("ENEMY INFANTRY DRIVER SURVIVES!");

                        me.game.world.addChild(unit, me.game.world.getChildByName("units")[0].pos.z);
                }
        
                if (this.name == "enemy_tank"){ //if a tank dies
                //spawn engineer
                settings = me.loader.getJSON("enemy_engineer");

                var unit = me.pool.pull("enemy_engineer", 10, 10, settings);
                        unit.pos.x = this.pos.x //- unit.width * 0.5;
                        unit.pos.y = this.pos.y //- unit.height * 1.0;
                        unit.player = game.data.enemy;
                        //this.unitResources -= settings.cost; no cost on death - special effect spawn
                        game.data.enemy.available.push(unit);
                        //if engineer survives, give resource bonus still
                        game.data.enemy.changeResourceRate(+5);
                        game.data.alertMessage.add("ENGINEER TANK DRIVER SURVIVES! +5 RESOURCES PER SECOND ");
                        me.game.world.addChild(unit, me.game.world.getChildByName("units")[0].pos.z);
                }



                //death sound fx
                me.audio.play("unit_death");

                sprite.setCurrentAnimation(this.explodingName, function () {
                    me.game.world.removeChild(sprite);
                    return false;
                });

                me.game.world.addChild(sprite);
                break;
            case 'dead':
                game.sylvanlog("He's dead, Jim!");
                this.body.setCollisionMask(me.collision.types.NO_OBJECT);
                if (this.isHoldingFlag) {
                    this.carriedFlag.drop();
                    this.isHoldingFlag = false;
                }
                this.controller.report(this, 'dead');
                me.game.world.removeChild(this);
                break;
            default:
                game.sylvanlog("enterState(): state \'" + newState + "\' not handled");

                break;
        }

    },


    // Called from changeState()
    leaveState: function (oldState) {
        // Maybe do something interesting here depending on the state

        switch (oldState) {
            default:
                game.sylvanlog("leaveState(): state \'" + oldState + "\' not handled");

                break;
        }

        this.state = null;
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

        switch (this.state) {
            case 'spawning':
                this.changeState('idle');
                break;
            case 'idle':
                //this.health -= 1; // stop unit from dying for now. Too many console messages
                break;
            case 'defending':

                break;
            case 'moving':
                if (this.moveTo) {
                    this.doMove();
                }
                break;
            case 'gathering':

                break;
            case 'attacking':

                break;
            case 'dying':
                this.changeState('dead');
                break;

            default:

                break;
        }

        // Check for updated flag position in case the flag is moving, we want the unit to go after it
        this.moveUpdateCounter++;
        if (this.moveUpdateCounter > this.moveUpdateTimeout) {
            this.moveUpdateCounter = 0;
            if (this.currentOrders.type == 'capture flag' && !this.controller.playerFlag.isHome() && !this.isHoldingFlag) {
                this.moveDestination.x = this.controller.playerFlag.pos.x;
                this.moveDestination.y = this.controller.playerFlag.pos.y + 20;
                this.changeState('moving');
            }
            if (this.currentOrders.type == 'return flag' && !this.controller.flag.isHome()) {
                this.moveDestination.x = this.controller.flag.pos.x;
                this.moveDestination.y = this.controller.flag.pos.y + 20;
                this.changeState('moving');
            }
        }

        this.body.update(dt);

        me.collision.check(this);

        // return true to update if we are moving
        this._super(me.Entity, "update", [dt]); // For the animation to continue to work
        return true;
    },

    onCollision: function (response, other) {
        if (other.body.collisionType == me.collision.types.COLLECTABLE_OBJECT && other.team != this.team) {
            // Got the flag
            this.pickedUpFlag();
        }
        if (other.body.collisionType == me.collision.types.COLLECTABLE_OBJECT && other.team == this.team
            && !other.isHome()) {
            // Return the flag
            game.sylvanlog("Enemy unit: returned flag");
            this.changeState("idle");
            this.controller.report(this, 'returned flag');
        }

        return false;
    }

});

