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
    civilian:
    [
        {
            attack: 5,
            range: 1, //attack-collision radius
            defense: 10,
            speed: 10,
            animationSpeed: 100, //not sure if this is needed, saw it in an example
            type: "rock" //something like this could be used for rock-paper-scissors combat balancing
        }
    ],

    infantry:
    [
        {
            attack: 7,
            range, 3,  //attack-collision radius
            defense: 22,
            speed: 10,
            animationSpeed: 100,
            type: "paper"
        }
    ]

    //tier 2 units...

    //tier 3 units...
}

//not sure if this is needed...pixel dimensions?
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

//additional unit configurations, stats, etc. can go inside this file
