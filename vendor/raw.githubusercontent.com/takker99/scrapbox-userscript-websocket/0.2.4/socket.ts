import type {
  Manager,
  ManagerOptions,
  Socket,
  SocketOptions,
} from "./types/socketIO/index.ts";
export type { Manager, ManagerOptions, Socket, SocketOptions };

export const socketIO = async (): Promise<Socket> => {
  const io = await importSocketIO();
  const socket = io("https://scrapbox.io", {
    reconnectionDelay: 5000,
    transports: ["websocket"],
  });

  await new Promise<void>((resolve, reject) => {
    const onDisconnect = (reason: Socket.DisconnectReason) => reject(reason);
    socket.once("connect", () => {
      socket.off("disconnect", onDisconnect);
      resolve();
    });
    socket.once("disconnect", onDisconnect);
  });
  return socket;
};

type IO = (
  uri: string,
  opts?: Partial<ManagerOptions & SocketOptions>,
) => Socket;
declare const io: IO | undefined;
const version = "4.2.0";
const url =
  `https://cdnjs.cloudflare.com/ajax/libs/socket.io/${version}/socket.io.min.js`;
let error: string | Event | undefined;

const importSocketIO = async (): Promise<IO> => {
  if (error) throw error;
  if (!document.querySelector(`script[src="${url}"]`)) {
    const script = document.createElement("script");
    script.src = url;
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = (e) => {
        error = e;
        reject(e);
      };
      document.head.append(script);
    });
  }

  return new Promise((resolve) => {
    const id = setInterval(() => {
      if (!io) return;
      clearInterval(id);
      resolve(io);
    }, 500);
  });
};
