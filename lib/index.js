#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var http = require('http')
var mkdirp = require('mkdirp')
var program = require('commander')

function rootPath(sub = '.') {
    return path.resolve(__filename, '../..', sub)
}

function copyFile(from, to) {
    fs.createReadStream(from).pipe(fs.createWriteStream(to));
}

program
    .version('0.0.1')
    .command('init')
    .description('init webco config struct')
    .action(function() {
        const templateFile = rootPath('templates/webco.json')
        copyFile(templateFile, 'webco.json')
        console.log('init finished, this folder had created a webco.json file')
    })

program
    .version('0.0.1')
    .command('download')
    .description('download remote components follow config')
    .action(function() {
        const config = JSON.parse(fs.readFileSync('./webco.json'))
        const local = config.component.local

        let shouldKeyLength = Object.keys(local.global).length + Object.keys(local.lazy).length
        let total = shouldKeyLength
        Object.keys(local).forEach((outKey) => {
            Object.keys(local[outKey]).forEach((key) => {
                let keyPath = local[outKey][key]
                downloadFile(keyPath, config.host).then(() => {
                    shouldKeyLength--
                    console.log(key, 'success, now:', total - shouldKeyLength, 'finished, total:', total)
                    if (shouldKeyLength == 0) {
                        console.log('=== Congratulation!!! All finished, Haha! ===')
                    }
                }).catch(err => {
                    console.log(key, 'error', err)
                    throw err
                })
            })
        })
    })

program.parse(process.argv)

function downloadFile(keyPath, host) {
    return new Promise((resolve) => {
        let url = `${host}/${keyPath}`
        mkdirp(rootPath(path.resolve(keyPath, '..')), () => {
            mkdirp(rootPath(path.resolve(`tmp/${keyPath}`, '..')), () => {
                fs.stat(rootPath(keyPath), function(err, stat){
                    if(stat && stat.isFile()) {
                        resolve()
                    } else {
                        let dest = rootPath(`tmp/${keyPath}`)
                        let file = fs.createWriteStream(dest);
                        http.get(url, function(response) {
                            if (response.statusCode !== 200) {
                                throw new Error(`${url} request error, may network error or file can not found`)
                            }
                            response.pipe(file);
                            file.on('finish', function() {
                                file.close((err) => {
                                    if (err) { throw err }
                                    copyFile(dest, rootPath(keyPath))
                                    resolve()
                                });  // close() is async, call cb after close completes.
                            });
                        }).on('error', function(err) { // Handle errors
                            fs.unlink(dest); // Delete the file async. (But we don't check the result)
                            throw err
                        })
                    }
                })
            })
        })
    })
}