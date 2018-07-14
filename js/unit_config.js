/* unit_config.js: contains the stats of all the units*/

  /* to do: 
UnitConfig = function() 
{
    return _UnitConfig;
}
*/

_UnitConfig =
{

    //tier 1 units
    worker:
    [
        {
            attack: 5,
            defense: 10,
            speed: 10,
            animationSpeed: 100, //not sure if this is needed
            type: "rock" //something like this could be used for rock-paper-scissors combat balancing
        }
    ],

    fighter:
    [
        {
            attack: 7,
            defense: 22,
            speed: 10,
            animationSpeed: 100,
            type: "paper"
        }
    ]

    //tier 2 units...

    //tier 3 units...
}

unitSizes =
{
    worker: 
    [
        {
            width: 32,
            height: 64 //32 width by 64 height
        }
    ],

    fighter:
    [
        {
            width: 32,
            height: 64
        }
    ]
}

spawningTime =
{
    worker: 10,
    fighter: 15
}

//additional unit configurations, stats, etc. can go inside this file
