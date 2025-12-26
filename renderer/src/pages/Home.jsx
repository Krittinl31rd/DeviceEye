import React, { useState } from "react";
import Modal from "../components/Modal";
import { toast } from "sonner";
import FormAddDevice from "../components/FormAddDevice";

const Home = () => {
  const [addDevice, setAddDevice] = useState(false);

  return (
    <div className="min-h-screen  flex items-start justify-center p-4">
      {/* header */}
      <div className="w-full flex items-center justify-end gap-2">
        <button className="btn btn-sm btn-success">Start</button>
        <button className="btn btn-sm btn-error">Stop</button>
        <button
          onClick={() => setAddDevice(true)}
          className="btn btn-sm btn-primary"
        >
          Add Device
        </button>
      </div>
      {/* device */}

      {setAddDevice && (
        <Modal
          title={`Add Devices`}
          show={addDevice}
          onClose={() => setAddDevice(false)}
          confirm={() => {
            toast.success("SUCCESS");
          }}
        >
          <FormAddDevice />
        </Modal>
      )}
    </div>
  );
};

export default Home;
