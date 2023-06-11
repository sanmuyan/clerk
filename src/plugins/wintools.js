const path = require('path')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')

export const getClient = (config) => {
  const PROTO_PATH = path.join(config.win_tools_proto_file)
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)

  const winToolsGrpc = protoDescriptor.WinTools
  return new winToolsGrpc.GrpcServices('localhost:' + config.user_config.win_tools_port, grpc.credentials.createInsecure())
}
