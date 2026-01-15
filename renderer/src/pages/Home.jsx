import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { toast } from "sonner";
import FormAddDevice from "../components/FormAddDevice";
import CardDevices from "../components/CardDevices";

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
      {/* header */}
      <div className="w-full flex items-center justify-end gap-2">
        <label className="label">Polling:</label>
        <div
          className={`badge badge-soft ${
            running ? "badge-success" : "badge-error"
          }`}
        >
          {running ? "Running" : "Stopped"}
        </div>
        <button
          disabled={running}
          onClick={startModbus}
          className="btn btn-sm btn-success"
        >
          Start
        </button>
        <button
          disabled={!running}
          onClick={stopAllModbus}
          className="btn btn-sm btn-error"
        >
          Stop
        </button>
        <button
          disabled={running}
          onClick={() => setAddDevice(true)}
          className="btn btn-sm btn-primary"
        >
          Add Device
        </button>
      </div>
      {/* device */}
      <div className="w-full grid grid-cols-1 md:grid-cols-1 xl:grid-cols-3 gap-4">
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
    </div>
  );
};

export default Home;
