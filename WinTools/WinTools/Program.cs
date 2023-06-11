using System.Collections.Specialized;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows.Forms;
using Grpc.Core;

namespace WinTools;

class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder
            .UnsafeRelaxedJsonEscaping, // 不转义非 ASCII 字符
    };

    [STAThread]
    static void Main(string[] args)
    {
        var port = 50051;
        if (args.Length > 0)
        {
            int.TryParse(args[0], out port);
        }

        Server server = new Server
        {
            Services = { GrpcServices.BindService(new Services()) },
            Ports = { new ServerPort("localhost", port, ServerCredentials.Insecure) }
        };
        server.Start();
        Console.WriteLine("gRPC server listening on port " + port);

        ManualResetEvent waitHandle = new ManualResetEvent(false);
        waitHandle.WaitOne();
        server.ShutdownAsync().Wait();
    }
}

class WindowTools
{
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
}

class Services : GrpcServices.GrpcServicesBase
{
    [SuppressMessage("Interoperability", "CA1416:验证平台兼容性")]
    public override Task<Message> SetFileDropList(Message request, ServerCallContext context)
    {
        var filePaths = new StringCollection();
        foreach (var f in request.FileDropList)
        {
            filePaths.Add(f);
        }
        
        if (filePaths.Count == 0)
        {
            return Task.FromResult(new Message() { Status = false });
        }

        Thread thread = new Thread(() => { Clipboard.SetFileDropList(filePaths); });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        return Task.FromResult(new Message() { Status = true });
    }


    [SuppressMessage("Interoperability", "CA1416:验证平台兼容性")]
    public override Task<Message> GetFileDropList(Message request, ServerCallContext context)
    {
        Thread thread = new Thread(() =>
        {
            var fileDropList = Clipboard.GetFileDropList();
            foreach (var f in fileDropList)
            {
                request.FileDropList.Add(f);
            }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();
        request.Status = true;
        return Task.FromResult(request);
    }

    public override Task<Message> GetForegroundWindow(Message request, ServerCallContext context)
    {
        return Task.FromResult(new Message()
        {
            ForegroundWindow = WindowTools.GetForegroundWindow().ToInt32(),
            Status = true
        });
    }

    public override Task<Message> SetForegroundWindow(Message request, ServerCallContext context)
    {
        var result = WindowTools.SetForegroundWindow(request.ForegroundWindow);
        Thread.Sleep(100);
        SendKeys.SendWait("%+");
        if (request.IsPaste)
        {
            if (request.ForegroundWindow == WindowTools.GetForegroundWindow())
            {
                SendKeys.SendWait("^v");
            }
        }
        return Task.FromResult(new Message() { Status = result });
    }

    public override Task<Message> Ping(Message request, ServerCallContext context)
    {
        return Task.FromResult(new Message() { Status = true });
    }
}