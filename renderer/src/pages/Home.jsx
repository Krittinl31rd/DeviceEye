import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { toast } from "sonner";
import FormAddDevice from "../components/FormAddDevice";
import CardDevices from "../components/CardDevices";
import SocketSetting from "../components/SocketSetting";
import { EllipsisVertical, Pause, Play, Plus } from "lucide-react";

const Home = () => {
  const [running, setRunning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [addDevice, setAddDevice] = useState(false);
  const [delDevice, setDelDevice] = useState(false);
  const [updateDevice, setUpdateDevice] = useState(false);
  const [formDevice, setFormDevice] = useState({
    ip: "127.0.0.1",
    port: 502,
    tags: [
      {
        unitId: "",
        fc: "",
        start: "",
        length: "",
        interval: 1000,
        enabled: true,
      },
    ],
  });
  const [configScoket, setConfigScoket] = useState(false);
  const [statusSocket, setStatusSocket] = useState({
    state: "disconnected",
    url: "",
  });
  const [cfg, setCfg] = useState({
    enabled: false,
    url: "",
    token: "",
  });

  const getSocket = async () => {
    const data = await window.socketAPI.getSocket();
    setCfg(data);
  };

  const saveSocket = async () => {
    if (running) {
      toast.warning("Please stop Modbus before editing socket settings");
      return;
    }

    const { status, message } = await window.socketAPI.saveSocket(cfg);

    if (status == "saved") {
      toast.success(" Socket config saved (will apply on next START)");
      setConfigScoket(false);
    }
  };

  useEffect(() => {
    getSocket();
  }, []);

  useEffect(() => {
    const unsubscribe = window.socketAPI?.onStatus?.((data) => {
      // { state: 'connected', url: 'http://localhost:3000' }
      setStatusSocket(data);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const getConfig = async () => {
    const res = await window.modbusAPI.getConfig();
    setDevices(res.devices || []);
  };

  useEffect(() => {
    getConfig();
  }, []);

  const addDeviceConfig = async () => {
    const { status, message } = await window.modbusAPI.addConfig(formDevice);
    if (status == "saved") {
      toast.success(message);
      setAddDevice(false);
      getConfig();
    } else {
      toast.warning(message);
    }
  };

  const delDeviceConfig = async (ip) => {
    const { status, message } = await window.modbusAPI.removeConfig(ip);
    if (status == "saved") {
      toast.success(message);
      setDelDevice(false);
      getConfig();
    } else {
      toast.warning(message);
    }
  };

  const updateDeviceConfig = async (data) => {
    const { status, message } = await window.modbusAPI.updateConfig(data);
    if (status == "saved") {
      toast.success(message);
      setUpdateDevice(false);
      getConfig();
    } else {
      toast.warning(message);
    }
  };

  const startModbus = async () => {
    const { running, status } = await window.modbusAPI.start();
    setRunning(running);
    toast(status || "Modbus service started");
  };

  const stopAllModbus = async () => {
    const { running, status } = await window.modbusAPI.stopAll();
    setRunning(running);
    toast(status || "Modbus service stoped");
  };

  return (
    <div className="min-h-screen  flex flex-col items-start justify-start p-4 space-y-4">
      <div className="w-full bg-base-200 rounded-2xl shadow-md border border-base-300 p-4 space-y-4">
        {/* ===== STATUS ROW ===== */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Polling Status */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold opacity-70">Polling</div>

            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold
          ${running ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  running ? "bg-success animate-pulse" : "bg-error"
                }`}
              />
              {running ? "Running" : "Stopped"}
            </div>
          </div>

          {/* Socket Status */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold opacity-70">Socket</div>

            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold
          ${
            statusSocket.state === "connected"
              ? "bg-success/20 text-success"
              : "bg-error/20 text-error"
          }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  statusSocket.state === "connected"
                    ? "bg-success animate-pulse"
                    : "bg-error"
                }`}
              />
              {statusSocket.state}
            </div>

            <div className="text-xs opacity-50">{statusSocket.url}</div>
          </div>
        </div>

        {/* ===== ACTION ROW ===== */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={running}
            onClick={startModbus}
            className="btn btn-sm btn-success gap-2"
          >
            <Play className="w-4 h-4" />
            Start
          </button>

          <button
            disabled={!running}
            onClick={stopAllModbus}
            className="btn btn-sm btn-error gap-2"
          >
            <Pause className="w-4 h-4" />
            Stop
          </button>

          <div className="divider divider-horizontal hidden md:flex" />

          <button
            disabled={running}
            onClick={() => setAddDevice(true)}
            className="btn btn-sm btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>

          <button
            disabled={running}
            onClick={() => setConfigScoket(true)}
            className="btn btn-sm btn-outline gap-2"
          >
            <EllipsisVertical className="w-4 h-4" />
            Socket Settings
          </button>
        </div>
      </div>
      {/* device */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-2  gap-4">
        <CardDevices
          running={running}
          devices={devices}
          setDevices={setDevices}
          delDeviceConfig={delDeviceConfig}
          delDevice={delDevice}
          setDelDevice={setDelDevice}
          updateDevice={updateDevice}
          setUpdateDevice={setUpdateDevice}
          updateDeviceConfig={updateDeviceConfig}
        />
      </div>
      {addDevice && (
        <Modal
          title={`Add Devices`}
          show={addDevice}
          onClose={() => setAddDevice(false)}
          confirm={() => addDeviceConfig()}
        >
          <FormAddDevice
            formDevice={formDevice}
            setFormDevice={setFormDevice}
          />
        </Modal>
      )}
      {configScoket && (
        <Modal
          title={`Socket.io Settings`}
          show={configScoket}
          onClose={() => setConfigScoket(false)}
          confirm={saveSocket}
        >
          <SocketSetting modbusRunning={running} cfg={cfg} setCfg={setCfg} />
        </Modal>
      )}
    </div>
  );
};

export default Home;
