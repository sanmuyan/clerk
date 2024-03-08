using System.Collections.Specialized;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Windows.Forms;
using Grpc.Core;

namespace WinTools;

static class Program
{
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

static class WindowTools
{
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);


    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
}

class Services : GrpcServices.GrpcServicesBase
{
    [SupportedOSPlatform("windows")]
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


    [SupportedOSPlatform("windows")]
    public override Task<Message> GetFileDropList(Message request, ServerCallContext context)
    {
        Thread thread = new Thread(() =>
        {
            try
            {
                var fileDropList = Clipboard.GetFileDropList();
                foreach (var f in fileDropList)
                {
                    request.FileDropList.Add(f);
                }
            }
            catch (Exception)
            {
                // 用户未进入桌面前获取文件剪切板会抛异常
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

    [SupportedOSPlatform("windows")]
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