import React, { useEffect, useState } from "react";
import { PencilLine, Trash2 } from "lucide-react";
import Modal from "./Modal";
import FormUpdateDevice from "./FormUpdateDevice";
import WirteRegister from "./WirteRegister";
import { toast } from "sonner";

const STATUS_COLOR = {
  CONNECTED: "text-green-500",
  CONNECTING: "text-yellow-500",
  ERROR: "text-red-500",
};

const STATUS_LABEL = {
  CONNECTED: "ONLINE",
  CONNECTING: "CONNECTING",
  ERROR: "OFFLINE",
};

const FC_LIST = [
  { id: 1, label: "CS" },
  { id: 2, label: "IS" },
  { id: 3, label: "HR" },
  { id: 4, label: "IR" },
];

const FC_NAME = {
  1: "Coils Status",
  2: "Input Status",
  3: "Holding Register",
  4: "Input Register",
};

const canWriteFC = (fc) => fc === 1 || fc === 3;

const inputTypeByFC = (fc) => {
  if (fc === 1) return "boolean";
  if (fc === 3) return "number";
  return "readonly";
};

const CardDevices = ({
  running,
  devices,
  setDevices,
  delDeviceConfig,
  delDevice,
  setDelDevice,
  updateDevice,
  setUpdateDevice,
  updateDeviceConfig,
}) => {
  const [deviceStatus, setDeviceStatus] = useState({});
  const [selectDevice, setSelectDevice] = useState(null);
  const [unitView, setUnitView] = useState({});
  const [fcView, setFcView] = useState({});
  const [formDevice, setFormDevice] = useState(selectDevice);
  const [editCell, setEditCell] = useState(null); // { ip, unitId, fc, address, value }
  const [writeModal, setWriteModal] = useState(null);

  const setUnit = (dIdx, unitId) => {
    setUnitView((prev) => ({ ...prev, [dIdx]: unitId }));
  };

  const setFC = (dIdx, unitId, fc) => {
    setFcView((prev) => ({
      ...prev,
      [dIdx]: {
        ...(prev[dIdx] || {}),
        [unitId]: fc,
      },
    }));
  };

  const setWrite = ({ activeFC, device, row, activeUnit }) => {
    const readFC = activeFC;
    const writeFC = readFC == 1 ? 5 : readFC == 3 ? 6 : null;

    if (!writeFC) return;

    setWriteModal({
      ip: device.ip,
      unitId: activeUnit,
      readFc: readFC,
      fc: writeFC,
      address: row.addr,
      value: row.value ?? 0,
    });
  };

  const handleWrite = async () => {
    const { success, message } = await window.modbusAPI.writeModbus(writeModal);
    if (success) {
      toast.success(message);
    }
    setWriteModal(null);
  };

  useEffect(() => {
    setFormDevice(selectDevice);
  }, [selectDevice]);

  useEffect(() => {
    const unsubscribe = window.modbusAPI?.onStatus?.((status) => {
      const { ip, state, reason } = status;

      setDeviceStatus((prev) => ({
        ...prev,
        [ip]: { state, reason },
      }));
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!running) return setDeviceStatus({});

    const unsubscribe = window.modbusAPI.onChange((items) => {
      const { ip, unitId, fc, start, data } = items;

      setDevices((prevDevices) =>
        prevDevices.map((device) => {
          if (device.ip != ip) return device;

          const updatedTags = device.tags.map((tag) => {
            if (tag.unitId != unitId || tag.fc != fc) return tag;

            if (
              start < tag.start ||
              start + data.length > tag.start + tag.length
            )
              return tag;

            const newValues = [...(tag.values || [])];

            data.forEach((item) => {
              const idx = item.address - tag.start;
              if (idx >= 0 && idx < tag.length) {
                newValues[idx] = item.value;
              }
            });

            return { ...tag, values: newValues };
          });

          return { ...device, tags: updatedTags };
        })
      );
    });

    return () => {
      unsubscribe?.();
    };
  }, [running]);

  if (!devices.length) {
    return (
      <div className="w-full text-center text-sm text-gray-400 py-10">
        No devices configured
      </div>
    );
  }

  return devices.map((device, dIdx) => {
    const unitIds = [...new Set(device.tags.map((t) => t.unitId))];
    const activeUnit = unitView[dIdx] ?? unitIds[0];
    const activeFC =
      fcView[dIdx]?.[activeUnit] ??
      [
        ...new Set(
          device.tags.filter((t) => t.unitId == activeUnit).map((t) => t.fc)
        ),
      ][0];
    const unitTags = device.tags.filter(
      (t) => t.unitId == activeUnit && t.fc == activeFC
    );

    const isOffline = deviceStatus[device.ip]?.state != "CONNECTED";

    return (
      <div key={dIdx} className="w-full card bg-base-300 p-2 shadow-2xl">
        <div className="card-body p-0 space-y-0">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-base flex items-center gap-2">
              {device.ip}:{device.port}
              {deviceStatus[device.ip] && (
                <span
                  className={`text-xs font-semibold ${
                    STATUS_COLOR[deviceStatus[device.ip].state]
                  }`}
                >
                  ● {STATUS_LABEL[deviceStatus[device.ip].state]}
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              <button
                disabled={running}
                onClick={() => {
                  setUpdateDevice(true);
                  setSelectDevice(device);
                }}
                className="btn btn-xs btn-warning"
              >
                <PencilLine className="w-4 h-4" />
              </button>
              <button
                disabled={running}
                onClick={() => {
                  setDelDevice(true);
                  setSelectDevice(device);
                }}
                className="btn btn-xs btn-error"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Unit Selector */}
          <div className="flex gap-4 text-sm">
            {unitIds.map((uid) => (
              <label
                key={uid}
                className="flex items-center gap-1 cursor-pointer opacity-80 hover:opacity-100"
              >
                <input
                  type="radio"
                  name={`unit-${dIdx}`}
                  className="radio radio-xs"
                  checked={activeUnit == uid}
                  onChange={() => setUnit(dIdx, uid)}
                />
                <span>ID {uid}</span>
              </label>
            ))}
          </div>

          {/* FC Selector */}
          <div className="flex gap-3 text-xs mt-1">
            {[
              ...new Set(
                device.tags
                  .filter((t) => t.unitId == activeUnit)
                  .map((t) => t.fc)
              ),
            ].map((fc) => (
              <label
                key={fc}
                className="flex items-center gap-1 cursor-pointer opacity-80 hover:opacity-100"
              >
                <input
                  type="radio"
                  name={`fc-${dIdx}-${activeUnit}`}
                  className="radio radio-xs"
                  checked={activeFC == fc}
                  onChange={() => setFC(dIdx, activeUnit, fc)}
                />
                <span>
                  FC {fc} ({FC_LIST.find((f) => f.id == fc)?.label})
                </span>
              </label>
            ))}
          </div>

          <div
            className={`bg-base-200 rounded-md overflow-hidden mb-3 ${
              isOffline ? "opacity-40" : ""
            }`}
          >
            <div className="px-3 py-1 text-xs font-semibold text-gray-600 bg-base-300">
              Unit {activeUnit} | FC {activeFC} – {FC_NAME[activeFC]}
            </div>

            <div className="text-xs font-mono max-h-56 overflow-auto">
              <div className="grid grid-cols-2 px-3 py-1 text-gray-500 sticky top-0 bg-base-200">
                <span>Addr</span>
                <span>Value</span>
              </div>

              {unitTags
                .flatMap((tag) =>
                  Array.from({ length: tag.length }).map((_, i) => ({
                    addr: Number(tag.start) + i,
                    value:
                      Array.isArray(tag.values) && tag.values[i] != undefined
                        ? tag.values[i]
                        : "--",
                    enabled: tag.enabled,
                  }))
                )
                .map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-2 px-3 py-1 ${
                      i % 2 == 0 ? "bg-base-200" : "bg-base-100"
                    } ${row.enabled ? "" : "opacity-40"}`}
                  >
                    <span>{row.addr}</span>
                    <span
                      className={`cursor-pointer ${
                        row.enabled && (activeFC === 1 || activeFC === 3)
                          ? "text-blue-400 underline"
                          : "opacity-50"
                      }`}
                      onClick={() =>
                        setWrite({ activeFC, device, row, activeUnit })
                      }
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {delDevice && (
          <Modal
            title={`Delete Devices ${selectDevice?.ip}`}
            show={delDevice}
            onClose={() => setDelDevice(false)}
            confirm={() => delDeviceConfig(selectDevice?.ip)}
          >
            <p className="opacity-70">
              Are you sure delete device <b>{selectDevice?.ip}</b>
            </p>
          </Modal>
        )}
        {updateDevice && (
          <Modal
            title={`Update Devices ${selectDevice?.ip}`}
            show={updateDevice}
            onClose={() => setUpdateDevice(false)}
            confirm={() => updateDeviceConfig(formDevice)}
          >
            <FormUpdateDevice
              formDevice={formDevice}
              setFormDevice={setFormDevice}
            />
          </Modal>
        )}

        {writeModal && running && (
          <Modal
            title="Write Modbus Value"
            show={true}
            onClose={() => setWriteModal(null)}
            confirm={handleWrite}
          >
            <WirteRegister
              data={writeModal}
              onConfirm={(val) => setWriteModal(val)}
            />
          </Modal>
        )}
      </div>
    );
  });
};

export default CardDevices;
