![alt text](https://github.com/vsaravind007/export-appsync/raw/master/header.png)

Simple command line program to export AWS Appsync resolvers as VTL files - Perfect for exporting an existing appsync API.

# Why

If you've ever used AWS AppSync, you know that you can export the Graphql schema but, there is no way to export your resolvers via the console, the only option you have is to manually copy paste resolvers to files which is a no-go if you have a fairly large API with many resolvers deployed. This commandline exporter will allow you to export all of your resolvers to a local machine for development/archival/redeployment purposes.

# Installation

```$ npm i export-appsync -g```

# Usage
1. Create a pair of programatic access keys for the exporter(full appsync permissions required)
2. Run the following after replacing the variables:

```$ export-appsync -a api-id -k access-key-id -s secret-access-key -r region -o output-dir```

Where api-id is the ID of the appsync API you're exporting, access-key-id & secret-access-key are your AWS programatic access keys and region is the AWS region where you API is deployed in.

Each of the types defined in your Graphql schema(including Query & Mutation) will have its own directory and fields under which its resolvers are saved. For example, if you have a type 'User' with a field 'media', the resolvers for 'media' will be saved as ``User/media-request-mapping-template.vtl`` and ``User/media-response-mapping-template.vtl`` respectively.

# Roadmap
- Fetch AWS credentials from AWS Profile
- Export Graphql schema as well 
- Export lambda resolvers
- Export CF stack
