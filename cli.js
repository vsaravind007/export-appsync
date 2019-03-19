#!/usr/bin/env node

/*
Filename: cli.js
Author: Aravind VS
Date: 11/02/2019
Description: Export appsync resolvers from AWS account as VTL files
*/

const program = require('commander');
const AWS = require('aws-sdk');
const async = require('async');
const fs = require('fs');

program
    .version('0.0.1 Beta')
    .option('-a --api-id <required>', 'API ID of the appsync API')
    .option('-k --aws-key <required>', 'Required AWS Access Key')
    .option('-s --aws-secret <required>', 'Required AWS Secret Access Key')
    .option('-r --aws-region <required>', 'Required AWS Region')
    .option('-o --output-dir [optional]', 'Optional directory to save resolvers to, defaults to mappingTemplates')
    .action(function(req, optional) {

        if (!req.hasOwnProperty('awsKey')) {
            console.log('ERROR! Missing required option aws-key, run -h for help')
            process.exit(1)
        }

        if (!req.hasOwnProperty('awsSecret')) {
            console.log('ERROR! Missing required option aws-secret, run -h for help')
            process.exit(1)
        }

        if (!req.hasOwnProperty('apiId')) {
            console.log('ERROR! Missing required option api-ID, run -h for help')
            process.exit(1)
        }

        if (!req.hasOwnProperty('awsRegion')) {
            console.log('ERROR! Missing required option aws-region, run -h for help')
            process.exit(1)
        }

        const OUTPUT_DIR = req.outputDir || './mappingTemplates';
        const API_ID = req.apiId;

        AWS.config.update({
            "accessKeyId": req.awsKey,
            "secretAccessKey": req.awsSecret,
            "region": req.awsRegion
        });

        var appsync = new AWS.AppSync();

        let params = {
            apiId: API_ID,
            format: 'JSON',
            maxResults: 25,
            nextToken: null
        };

        function _getDataTypes(params, callback) {
            appsync.listTypes(params, function(err, data) {
                if (err) {
                    return callback(err)
                } else {
                    return callback(null, data)
                }
            })
        }

        function _fetchResolvers(apiId, typeName) {
            return new Promise(function(resolve, reject) {
                let params = {
                    apiId: apiId,
                    typeName: typeName,
                    maxResults: 25
                };
                appsync.listResolvers(params, function(err, data) {
                    if (err)
                        return reject(err)
                    else
                        return resolve(data)
                });
            })
        }

        function _writeMappingTemplates(typeName, resolver) {
            return new Promise(function(resolve, reject) {
                async.series([
                        function writeRequestMapper(callback) {
                            if (!fs.existsSync(`${OUTPUT_DIR}/${typeName}`)) {
                                fs.mkdir(`${OUTPUT_DIR}/${typeName}`, { recursive: true }, (err) => {
                                    if (err) throw err;
                                    fs.writeFile(`${OUTPUT_DIR}/${typeName}/${resolver.fieldName}-request-mapping-template.vtl`, resolver.requestMappingTemplate, (err) => {
                                        if (!err) {
                                            console.log('Wrote request mapper for ', typeName);
                                            callback(null);
                                        } else {
                                            console.log('Failed writing response mapper');
                                            callback(`Error writing request mapping for ${typeName} -> ${resolver.fieldName}`)
                                        }
                                    });
                                });
                            } else {
                                fs.writeFile(`${OUTPUT_DIR}/${typeName}/${resolver.fieldName}-request-mapping-template.vtl`, resolver.requestMappingTemplate, (err) => {
                                    if (!err) {
                                        console.log('Wrote request mapper for ', typeName);
                                        callback(null);
                                    } else {
                                        console.log('Failed writing response mapper');
                                        callback(`Error writing request mapping for ${typeName} -> ${resolver.fieldName}`)
                                    }
                                });
                            }
                        },
                        function writeResponseMapper(callback) {
                            if (!fs.existsSync(`${OUTPUT_DIR}/${typeName}`)) {
                                fs.mkdir(`${OUTPUT_DIR}/${typeName}`, { recursive: true }, (err) => {
                                    if (err) throw err;
                                    fs.writeFile(`${OUTPUT_DIR}/${typeName}/${resolver.fieldName}-response-mapping-template.vtl`, resolver.responseMappingTemplate, (err) => {
                                        if (!err) {
                                            console.log('Wrote response mapper for ', typeName);
                                            callback(null);
                                        } else {
                                            console.log('Failed writing response mapper')
                                            callback(`Error writing response mapping for ${typeName} -> ${resolver.fieldName}`)
                                        }
                                    });
                                });
                            } else {
                                fs.writeFile(`${OUTPUT_DIR}/${typeName}/${resolver.fieldName}-response-mapping-template.vtl`, resolver.responseMappingTemplate, (err) => {
                                    if (!err) {
                                        console.log('Wrote response mapper for ', typeName);
                                        callback(null);
                                    } else {
                                        console.log('Failed writing response mapper')
                                        callback(`Error writing response mapping for ${typeName} -> ${resolver.fieldName}`)
                                    }
                                });
                            }
                        }
                    ],
                    function(err, results) {
                        if (err)
                            return reject(err)
                        else
                            return resolve(null)
                    });
            })
        }

        function ProcessAPI(params, callback) {
            _getDataTypes(params, function(err, data) {
                if (err)
                    return callback(err)
                async.each(data.types, function(type, eachCallback) {
                    async.waterfall([
                        function fetchResolvers(cb) {
                            _fetchResolvers(API_ID, type.name).then(function(data) {
                                cb(null, data);
                            }).catch(function(e) {
                                cb(e);
                            })
                        },
                        function writeResolvers(data, cb) {
                            if (data.resolvers.length > 0) {
                                async.each(data.resolvers, function(resolver, resolverCallback) {
                                    _writeMappingTemplates(type.name, resolver).then(function() {
                                        resolverCallback(null)
                                    }).catch(function(err) {
                                        resolverCallback(err)
                                    })
                                }, function(err, done) {
                                    cb(null)
                                })
                            } else {
                                console.log('No resolvers for ', type.name)
                                cb(null, 'NO_RESOLVER');
                            }
                        }
                    ], function(err, done) {
                        eachCallback(err, done)
                    });
                }, function(err, done) {
                    if (data.nextToken != null || data.nextToken != undefined) {
                        params.nextToken = data.nextToken;
                        ProcessAPI(params, callback)
                    } else
                        callback(null, `Done exporting resolvers for ${API_ID}, saved resolvers under /${OUTPUT_DIR}`)
                });
            })
        }

        ProcessAPI(params, function(err, done) {
            if (err)
                console.log('Error while processing resolvers', err)
            else
                console.log(done)
        })
    });
program.parse(process.argv);