import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { toast } from "sonner";
import FormAddDevice from "../components/FormAddDevice";
import CardDevices from "../components/CardDevices";

const Home = () => {
  const [addDevice, setAddDevice] = useState(false);
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

  const addDeviceConfig = () => {
    console.log(formDevice);
  };

  const startModbus = async () => {
    const resp = await window.modbusAPI.start();
    toast.success(resp?.status || "Modbus service started");
  };

  

  return (
    <div className="min-h-screen  flex flex-col items-start justify-start p-4 space-y-4">
      {/* header */}
      <div className="w-full flex items-center justify-end gap-2">
        <button onClick={startModbus} className="btn btn-sm btn-success">
          Start
        </button>
        {/* <button className="btn btn-sm btn-error">Stop</button> */}
        <button
          onClick={() => setAddDevice(true)}
          className="btn btn-sm btn-primary"
        >
          Add Device
        </button>
      </div>
      {/* device */}
      <div className="w-full grid grid-cols-1 md:grid-cols-1 xl:grid-cols-3 gap-4">
        <CardDevices />
      </div>
      {setAddDevice && (
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
