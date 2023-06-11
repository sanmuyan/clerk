$out_path = "."
$proto_file = ".\WinTools.proto"
cp ..\..\..\resources\$proto_file .
protoc --csharp_out=$out_path --grpc_out=$out_path $proto_file --plugin=protoc-gen-grpc=$env:USERPROFILE\.nuget\packages\grpc.tools\2.54.0\tools\windows_x86\grpc_csharp_plugin.exe