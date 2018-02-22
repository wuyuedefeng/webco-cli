var program = require('commander');
program
    .version('0.1.0')
    .command('init')
    .description('initialize webco config struct')
    .action(function(env, options){
        console.log('init project')
    })
program.parse(process.argv);


